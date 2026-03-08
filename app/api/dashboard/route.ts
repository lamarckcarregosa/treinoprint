import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const hoje = new Date();
    const inicioHoje = new Date(hoje);
    inicioHoje.setHours(0, 0, 0, 0);

    const { count: totalAlunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("academia_id", academiaId);

    const { data: impressoesHoje, error: impressoesError } = await supabaseServer
      .from("historico_impressoes")
      .select("id, personal_nome, dia, nivel, aluno_nome, created_at")
      .eq("academia_id", academiaId)
      .gte("created_at", inicioHoje.toISOString())
      .order("created_at", { ascending: false });

    const { data: financeiro, error: financeiroError } = await supabaseServer
      .from("dashboard_financeiro")
      .select("receita_mes, despesas, ponto_equilibrio")
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    if (impressoesError) {
      return NextResponse.json({ error: impressoesError.message }, { status: 500 });
    }

    if (financeiroError) {
      return NextResponse.json({ error: financeiroError.message }, { status: 500 });
    }

    const listaImpressoes = impressoesHoje || [];

    const personalMap: Record<string, number> = {};
    const diaMap: Record<string, number> = {};
    const nivelMap: Record<string, number> = {};

    for (const item of listaImpressoes) {
      const nomePersonal = String(item.personal_nome || "").trim();
      const nomeDia = String(item.dia || "").trim();
      const nomeNivel = String(item.nivel || "").trim();

      if (nomePersonal) {
        personalMap[nomePersonal] = (personalMap[nomePersonal] || 0) + 1;
      }

      if (nomeDia) {
        diaMap[nomeDia] = (diaMap[nomeDia] || 0) + 1;
      }

      if (nomeNivel) {
        nivelMap[nomeNivel] = (nivelMap[nomeNivel] || 0) + 1;
      }
    }

    const personalMaisAtivo =
      Object.entries(personalMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const diaMaisUsado =
      Object.entries(diaMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const treinosPorDia = Object.entries(diaMap)
      .map(([dia, total]) => ({ dia, total }))
      .sort((a, b) => b.total - a.total);

    const treinosPorNivel = Object.entries(nivelMap)
      .map(([nivel, total]) => ({ nivel, total }))
      .sort((a, b) => b.total - a.total);

    const treinosRecentes = listaImpressoes.slice(0, 5).map((item) => ({
      horario: new Date(item.created_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      aluno: item.aluno_nome || "-",
      dia: item.dia || "-",
    }));

    return NextResponse.json({
      alunosCadastrados: totalAlunos || 0,
      treinosHoje: listaImpressoes.length,
      personalMaisAtivo,
      diaMaisUsado,
      treinosPorDia,
      treinosPorNivel,
      treinosRecentes,
      financeiro: {
        receitaMes: Number(financeiro?.receita_mes || 0),
        despesas: Number(financeiro?.despesas || 0),
        pontoEquilibrio: Number(financeiro?.ponto_equilibrio || 0),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard" },
      { status: 400 }
    );
  }
}