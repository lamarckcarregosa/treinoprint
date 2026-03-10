import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function primeiroDiaMesISO() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
}

function ultimoDiaMesISO() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const periodo = searchParams.get("periodo") || "mes";
    const hoje = new Date();

    let inicio = primeiroDiaMesISO();
    let fim = ultimoDiaMesISO();

    if (periodo === "hoje") {
      inicio = hoje.toISOString().slice(0, 10);
      fim = hoje.toISOString().slice(0, 10);
    } else if (periodo === "semana") {
      const inicioSemana = new Date();
      inicioSemana.setDate(hoje.getDate() - 6);
      inicio = inicioSemana.toISOString().slice(0, 10);
      fim = hoje.toISOString().slice(0, 10);
    }

    const hojeStr = hojeISO();

    const [
      alunosRes,
      alunosAtivosRes,
      treinosPeriodoRes,
      treinosRecentesRes,
      pagamentosPendentesRes,
      pagamentosPagosPeriodoRes,
      despesasPeriodoRes,
      alunosVencidosRes,
    ] = await Promise.all([
      supabaseServer
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId),

      supabaseServer
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .eq("status", "ativo"),

      supabaseServer
        .from("treinos_modelos")
        .select("id, dia, nivel, tipo, created_at, semana")
        .eq("academia_id", academiaId)
        .gte("created_at", `${inicio}T00:00:00`)
        .lte("created_at", `${fim}T23:59:59`),

      supabaseServer
        .from("treinos_modelos")
        .select("id, dia, nivel, tipo, created_at, semana")
        .eq("academia_id", academiaId)
        .order("created_at", { ascending: false })
        .limit(12),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, valor, vencimento, status")
        .eq("academia_id", academiaId)
        .eq("status", "pendente"),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, valor, data_pagamento, forma_pagamento, status")
        .eq("academia_id", academiaId)
        .eq("status", "pago")
        .gte("data_pagamento", inicio)
        .lte("data_pagamento", fim)
        .order("data_pagamento", { ascending: false }),

      supabaseServer
        .from("financeiro_despesas")
        .select("id, valor, created_at")
        .eq("academia_id", academiaId)
        .gte("created_at", `${inicio}T00:00:00`)
        .lte("created_at", `${fim}T23:59:59`),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, valor, vencimento, status")
        .eq("academia_id", academiaId)
        .eq("status", "pendente")
        .lt("vencimento", hojeStr)
        .order("vencimento", { ascending: true }),
    ]);

    if (alunosRes.error) {
      return NextResponse.json({ error: alunosRes.error.message }, { status: 500 });
    }

    if (alunosAtivosRes.error) {
      return NextResponse.json({ error: alunosAtivosRes.error.message }, { status: 500 });
    }

    if (treinosPeriodoRes.error) {
      return NextResponse.json({ error: treinosPeriodoRes.error.message }, { status: 500 });
    }

    if (treinosRecentesRes.error) {
      return NextResponse.json({ error: treinosRecentesRes.error.message }, { status: 500 });
    }

    if (pagamentosPendentesRes.error) {
      return NextResponse.json({ error: pagamentosPendentesRes.error.message }, { status: 500 });
    }

    if (pagamentosPagosPeriodoRes.error) {
      return NextResponse.json(
        { error: pagamentosPagosPeriodoRes.error.message },
        { status: 500 }
      );
    }

    if (despesasPeriodoRes.error) {
      return NextResponse.json({ error: despesasPeriodoRes.error.message }, { status: 500 });
    }

    if (alunosVencidosRes.error) {
      return NextResponse.json({ error: alunosVencidosRes.error.message }, { status: 500 });
    }

    const alunosCadastrados = alunosRes.count || 0;
    const alunosAtivos = alunosAtivosRes.count || 0;

    const treinosPeriodo = treinosPeriodoRes.data || [];
    const treinosRecentesRaw = treinosRecentesRes.data || [];
    const pagamentosPendentes = pagamentosPendentesRes.data || [];
    const pagamentosPagosPeriodo = pagamentosPagosPeriodoRes.data || [];
    const despesasPeriodo = despesasPeriodoRes.data || [];
    const alunosVencidosRaw = alunosVencidosRes.data || [];

    const alunoIds = Array.from(
      new Set(
        [...pagamentosPendentes, ...pagamentosPagosPeriodo, ...alunosVencidosRaw]
          .map((item: any) => Number(item.aluno_id))
          .filter(Boolean)
      )
    );

    let alunosMapa = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunosLista, error: alunosListaError } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      if (alunosListaError) {
        return NextResponse.json({ error: alunosListaError.message }, { status: 500 });
      }

      alunosMapa = new Map(
        (alunosLista || []).map((item: any) => [Number(item.id), item.nome || "Aluno"])
      );
    }

    const totalTreinosHoje =
      periodo === "hoje"
        ? treinosPeriodo.length
        : treinosPeriodo.filter((item: any) => {
            const dataItem = new Date(item.created_at).toISOString().slice(0, 10);
            return dataItem === hojeStr;
          }).length;

    const ordemDias = [
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ];

    const treinosPorDia = ordemDias.map((dia) => ({
      dia,
      total: treinosPeriodo.filter((item: any) => item.dia === dia).length,
    }));

    const niveisOrdem = ["Iniciante", "Intermediário", "Avançado"];
    const treinosPorNivel = niveisOrdem.map((nivel) => ({
      nivel,
      total: treinosPeriodo.filter((item: any) => item.nivel === nivel).length,
    }));

    const diaCounter = new Map<string, number>();
    treinosPeriodo.forEach((item: any) => {
      const dia = item.dia || "Não informado";
      diaCounter.set(dia, (diaCounter.get(dia) || 0) + 1);
    });

    const diaMaisUsado =
      Array.from(diaCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const treinosRecentes = treinosRecentesRaw.map((item: any) => ({
      horario: new Date(item.created_at).toLocaleString("pt-BR"),
      aluno: `${item.nivel || "-"} • ${item.tipo || "-"}`,
      dia: item.dia || "-",
    }));

    const receitaMes = pagamentosPagosPeriodo.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const despesas = despesasPeriodo.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const pontoEquilibrio = despesas;
    const mensalidadesEmAberto = pagamentosPendentes.length;

    const inadimplentesIds = new Set(
      alunosVencidosRaw.map((item: any) => Number(item.aluno_id))
    );
    const inadimplentes = inadimplentesIds.size;

    const ultimosPagamentos = pagamentosPagosPeriodo.slice(0, 8).map((item: any) => ({
      id: item.id,
      aluno: alunosMapa.get(Number(item.aluno_id)) || "Aluno",
      valor: Number(item.valor || 0),
      forma_pagamento: item.forma_pagamento || null,
      data_pagamento: item.data_pagamento || null,
    }));

    const alunosVencidos = alunosVencidosRaw.slice(0, 8).map((item: any) => ({
      aluno: alunosMapa.get(Number(item.aluno_id)) || "Aluno",
      valor: Number(item.valor || 0),
      vencimento: item.vencimento,
    }));

    return NextResponse.json({
      alunosCadastrados,
      alunosAtivos,
      treinosHoje: totalTreinosHoje,
      personalMaisAtivo: "-",
      diaMaisUsado,
      mensalidadesEmAberto,
      inadimplentes,
      treinosPorDia,
      treinosPorNivel,
      treinosRecentes,
      ultimosPagamentos,
      alunosVencidos,
      financeiro: {
        receitaMes,
        despesas,
        pontoEquilibrio,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard" },
      { status: 400 }
    );
  }
}