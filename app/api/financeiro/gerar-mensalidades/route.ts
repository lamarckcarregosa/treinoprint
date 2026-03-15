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

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();
    const competencia = body.competencia;

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;

    const { data: alunos, error } = await supabaseServer
      .from("financeiro_alunos")
      .select("*")
      .eq("academia_id", academiaId)
      .eq("ativo", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let total = 0;

    for (const item of alunos || []) {
      if (!deveGerar(item.tipo_cobranca, mesAtual)) {
        continue;
      }

      const vencimento = `${competencia}-${String(item.vencimento_dia).padStart(
        2,
        "0"
      )}`;

      // Evita gerar duplicado
      const { data: existente } = await supabaseServer
        .from("financeiro_pagamentos")
        .select("id")
        .eq("academia_id", academiaId)
        .eq("aluno_id", item.aluno_id)
        .eq("competencia", competencia)
        .maybeSingle();

      if (existente) continue;

      const { data: pagamento, error: insertError } = await supabaseServer
        .from("financeiro_pagamentos")
        .insert({
          academia_id: academiaId,
          aluno_id: item.aluno_id,
          competencia,
          valor: item.valor_mensalidade,
          vencimento,
          status: "pendente",
          gateway: "mercado_pago",
        })
        .select()
        .single();

      if (!insertError && pagamento) {
        total++;

        // Aqui depois vamos gerar a cobrança MP
        // usando pagamento.id como external_reference
      }
    }

    return NextResponse.json({
      total_gerado: total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar mensalidades" },
      { status: 400 }
    );
  }
}