import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

function deveGerar(tipo: string, mesAtual: number) {
  if (tipo === "mensal") return true;
  if (tipo === "trimestral") return mesAtual % 3 === 0;
  if (tipo === "semestral") return mesAtual % 6 === 0;
  if (tipo === "anual") return mesAtual === 1;
  return true;
}

function normalizarDiaVencimento(competencia: string, dia: number) {
  const [anoStr, mesStr] = competencia.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);

  if (!ano || !mes) return `${competencia}-01`;

  const ultimoDiaMes = new Date(ano, mes, 0).getDate();
  const diaFinal = Math.max(1, Math.min(Number(dia || 1), ultimoDiaMes));

  return `${competencia}-${String(diaFinal).padStart(2, "0")}`;
}

async function criarCobrancaMercadoPago(params: {
  academiaId: string;
  pagamentoId: number;
  alunoId: number;
  alunoNome: string;
  academiaNome: string;
  accessToken: string;
  competencia: string;
  valor: number;
}) {
  const {
    academiaId,
    pagamentoId,
    alunoId,
    alunoNome,
    academiaNome,
    accessToken,
    competencia,
    valor,
  } = params;

  const externalReference = `${academiaId}|${pagamentoId}|${alunoId}`;

  const response = await fetch(
    "https://api.mercadopago.com/checkout/preferences",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Mensalidade ${competencia} - ${academiaNome}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(valor || 0),
          },
        ],
        payer: {
          name: alunoNome || "Aluno",
        },
        external_reference: externalReference,
        notification_url: `${process.env.APP_BASE_URL}/api/mercadopago/webhook`,
        back_urls: {
          success: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=success`,
          failure: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=failure`,
          pending: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=pending`,
        },
        auto_return: "approved",
      }),
    }
  );

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.message || "Erro ao criar cobrança Mercado Pago");
  }

  return {
    preferenceId: json.id || null,
    initPoint: json.init_point || null,
    sandboxInitPoint: json.sandbox_init_point || null,
    externalReference,
    raw: json,
  };
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const competencia = String(body?.competencia || "").trim();

    if (!competencia || !/^\d{4}-\d{2}$/.test(competencia)) {
      return NextResponse.json(
        { error: "Competência inválida. Use o formato YYYY-MM" },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, nome, mp_connected, mp_access_token")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia) {
      return NextResponse.json(
        { error: academiaError?.message || "Academia não encontrada" },
        { status: 404 }
      );
    }

    const { data: alunosFinanceiro, error } = await supabaseServer
      .from("financeiro_alunos")
      .select("*")
      .eq("academia_id", academiaId)
      .eq("ativo", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alunoIds = Array.from(
      new Set(
        (alunosFinanceiro || [])
          .map((item: any) => Number(item.aluno_id))
          .filter(Boolean)
      )
    );

    let alunosMapa = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos, error: alunosError } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      if (alunosError) {
        return NextResponse.json({ error: alunosError.message }, { status: 500 });
      }

      alunosMapa = new Map(
        (alunos || []).map((item: any) => [Number(item.id), item.nome || "Aluno"])
      );
    }

    let totalGerado = 0;
    let totalCobrancasCriadas = 0;
    let totalSemGateway = 0;
    const detalhes: any[] = [];

    for (const item of alunosFinanceiro || []) {
      if (!deveGerar(String(item.tipo_cobranca || ""), mesAtual)) {
        continue;
      }

      const alunoId = Number(item.aluno_id);
      if (!alunoId) continue;

      const existenteRes = await supabaseServer
        .from("financeiro_pagamentos")
        .select("id, status, link_pagamento")
        .eq("academia_id", academiaId)
        .eq("aluno_id", alunoId)
        .eq("competencia", competencia)
        .maybeSingle();

      if (existenteRes.data) {
        detalhes.push({
          aluno_id: alunoId,
          aluno_nome: alunosMapa.get(alunoId) || "Aluno",
          acao: "ignorado",
          motivo: "mensalidade já existente",
        });
        continue;
      }

      const vencimento = normalizarDiaVencimento(
        competencia,
        Number(item.vencimento_dia || 1)
      );

      const { data: pagamento, error: insertError } = await supabaseServer
        .from("financeiro_pagamentos")
        .insert({
          academia_id: academiaId,
          aluno_id: alunoId,
          competencia,
          valor: Number(item.valor_mensalidade || 0),
          vencimento,
          status: "pendente",
          gateway: academia.mp_connected ? "mercado_pago" : null,
          gateway_status: null,
        })
        .select()
        .single();

      if (insertError || !pagamento) {
        detalhes.push({
          aluno_id: alunoId,
          aluno_nome: alunosMapa.get(alunoId) || "Aluno",
          acao: "erro",
          motivo: insertError?.message || "erro ao inserir mensalidade",
        });
        continue;
      }

      totalGerado++;

      if (!academia.mp_connected || !academia.mp_access_token) {
        totalSemGateway++;
        detalhes.push({
          aluno_id: alunoId,
          aluno_nome: alunosMapa.get(alunoId) || "Aluno",
          pagamento_id: pagamento.id,
          acao: "mensalidade criada",
          motivo: "academia sem Mercado Pago conectado",
        });
        continue;
      }

      try {
        const cobranca = await criarCobrancaMercadoPago({
          academiaId,
          pagamentoId: Number(pagamento.id),
          alunoId,
          alunoNome: alunosMapa.get(alunoId) || "Aluno",
          academiaNome: academia.nome || "Academia",
          accessToken: academia.mp_access_token,
          competencia,
          valor: Number(item.valor_mensalidade || 0),
        });

        const { error: updateError } = await supabaseServer
          .from("financeiro_pagamentos")
          .update({
            gateway: "mercado_pago",
            gateway_status: "pending",
            gateway_preference_id: cobranca.preferenceId,
            gateway_external_reference: cobranca.externalReference,
            link_pagamento: cobranca.initPoint || cobranca.sandboxInitPoint,
            payload_gateway: cobranca.raw,
          })
          .eq("academia_id", academiaId)
          .eq("id", pagamento.id);

        if (updateError) {
          detalhes.push({
            aluno_id: alunoId,
            aluno_nome: alunosMapa.get(alunoId) || "Aluno",
            pagamento_id: pagamento.id,
            acao: "mensalidade criada",
            motivo: "erro ao salvar cobrança",
            erro: updateError.message,
          });
          continue;
        }

        totalCobrancasCriadas++;

        detalhes.push({
          aluno_id: alunoId,
          aluno_nome: alunosMapa.get(alunoId) || "Aluno",
          pagamento_id: pagamento.id,
          acao: "mensalidade + cobrança criada",
        });
      } catch (mpError: any) {
        detalhes.push({
          aluno_id: alunoId,
          aluno_nome: alunosMapa.get(alunoId) || "Aluno",
          pagamento_id: pagamento.id,
          acao: "mensalidade criada",
          motivo: "erro ao criar cobrança Mercado Pago",
          erro: mpError?.message || "erro desconhecido",
        });
      }
    }

    return NextResponse.json({
      total_gerado: totalGerado,
      total_cobrancas_criadas: totalCobrancasCriadas,
      total_sem_gateway: totalSemGateway,
      detalhes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar mensalidades" },
      { status: 400 }
    );
  }
}