import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

function hojeISO() {
  return new Date().toISOString().slice(0, 10);
}

function diaSemanaNome(data: string) {
  const dias = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  const dt = new Date(data);
  return dias[dt.getDay()] || "-";
}

function competenciaLabel(comp?: string | null) {
  if (!comp) return "-";
  return comp;
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const hoje = hojeISO();

    const [
      alunosRes,
      alunosAtivosRes,
      impressoesHojeRes,
      treinosPersonalizadosAtivosRes,
      pagamentosRes,
      historicoImpressoesRes,
      catracaRes,
    ] = await Promise.all([
      supabaseServer
        .from("alunos")
        .select("id, nome, status", { count: "exact" })
        .eq("academia_id", academiaId),

      supabaseServer
        .from("alunos")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .eq("status", "ativo"),

      supabaseServer
        .from("historico_impressoes")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .gte("created_at", `${hoje}T00:00:00`)
        .lte("created_at", `${hoje}T23:59:59`),

      supabaseServer
        .from("treinos_personalizados")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .eq("ativo", true),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, competencia, valor, status, created_at, vencimento")
        .eq("academia_id", academiaId),

      supabaseServer
        .from("historico_impressoes")
        .select("id, aluno_id, aluno_nome, personal_nome, exercicios, created_at")
        .eq("academia_id", academiaId)
        .order("created_at", { ascending: false })
        .limit(1000),

      supabaseServer
  .from("acessos_catraca")
  .select("id, created_at, status, aluno_nome")
  .eq("academia_id", academiaId)
  .order("created_at", { ascending: false })
  .limit(1000),
    ]);

    if (alunosRes.error) throw new Error(alunosRes.error.message);
    if (alunosAtivosRes.error) throw new Error(alunosAtivosRes.error.message);
    if (impressoesHojeRes.error) throw new Error(impressoesHojeRes.error.message);
    if (treinosPersonalizadosAtivosRes.error) {
      throw new Error(treinosPersonalizadosAtivosRes.error.message);
    }
    if (pagamentosRes.error) throw new Error(pagamentosRes.error.message);
    if (historicoImpressoesRes.error) throw new Error(historicoImpressoesRes.error.message);
    if (catracaRes.error) throw new Error(catracaRes.error.message);

    const alunos = alunosRes.data || [];
    const pagamentos = pagamentosRes.data || [];
    const historico = historicoImpressoesRes.data || [];
    const catraca = catracaRes.data || [];

    const totalPago = pagamentos
      .filter((p) => p.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const totalAberto = pagamentos
      .filter((p) => p.status !== "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const personalMap = new Map<string, number>();
    const horaMap = new Map<string, number>();
    const exercicioMap = new Map<string, number>();
    const alunoTreinoMap = new Map<string, number>();
    const diaSemanaMap = new Map<string, number>([
      ["Segunda", 0],
      ["Terça", 0],
      ["Quarta", 0],
      ["Quinta", 0],
      ["Sexta", 0],
      ["Sábado", 0],
      ["Domingo", 0],
    ]);
    const faturamentoCompetenciaMap = new Map<
      string,
      { competencia: string; pago: number; aberto: number }
    >();

    for (const item of historico) {
      const personal = String(item.personal_nome || "Não informado");
      personalMap.set(personal, (personalMap.get(personal) || 0) + 1);

      const alunoNome = String(item.aluno_nome || "Aluno");
      alunoTreinoMap.set(alunoNome, (alunoTreinoMap.get(alunoNome) || 0) + 1);

      const hora = new Date(item.created_at).getHours().toString().padStart(2, "0") + ":00";
      horaMap.set(hora, (horaMap.get(hora) || 0) + 1);

      const diaSemana = diaSemanaNome(item.created_at);
      diaSemanaMap.set(diaSemana, (diaSemanaMap.get(diaSemana) || 0) + 1);

      const exercicios = Array.isArray(item.exercicios) ? item.exercicios : [];
      for (const ex of exercicios) {
        const nome = String(ex?.nome_exercicio_snapshot || ex?.nome || "").trim();
        if (!nome) continue;
        exercicioMap.set(nome, (exercicioMap.get(nome) || 0) + 1);
      }
    }

    for (const item of pagamentos) {
      const comp = competenciaLabel(item.competencia);
      const atual = faturamentoCompetenciaMap.get(comp) || {
        competencia: comp,
        pago: 0,
        aberto: 0,
      };

      if (item.status === "pago") {
        atual.pago += Number(item.valor || 0);
      } else {
        atual.aberto += Number(item.valor || 0);
      }

      faturamentoCompetenciaMap.set(comp, atual);
    }

    const rankingPersonais = [...personalMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const horariosMovimento = [...horaMap.entries()]
      .map(([hora, total]) => ({ hora, total }))
      .sort((a, b) => a.hora.localeCompare(b.hora));

    const topExercicios = [...exercicioMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const topAlunos = [...alunoTreinoMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const treinosPorDiaSemana = [...diaSemanaMap.entries()].map(([dia, total]) => ({
      dia,
      total,
    }));

    const faturamentoPorCompetencia = [...faturamentoCompetenciaMap.values()].sort((a, b) =>
      a.competencia.localeCompare(b.competencia)
    );

    const acessosLiberadosHoje = catraca.filter((item) => {
  const data = new Date(item.created_at).toISOString().slice(0, 10);
  return data === hoje && item.status === "liberado";
}).length;

const alunosFrequenciaMap = new Map<string, number>();

for (const item of catraca) {
  if (item.status !== "liberado") continue;

  const nome = String(item.aluno_nome || "Aluno");
  alunosFrequenciaMap.set(nome, (alunosFrequenciaMap.get(nome) || 0) + 1);
}

const topFrequencia = [...alunosFrequenciaMap.entries()]
  .map(([nome, total]) => ({ nome, total }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 10);

    return NextResponse.json({
      cards: {
        alunos_cadastrados: alunosRes.count || 0,
        alunos_ativos: alunosAtivosRes.count || 0,
        treinos_impressos_hoje: impressoesHojeRes.count || 0,
        treinos_personalizados_ativos: treinosPersonalizadosAtivosRes.count || 0,
        faturamento_pago: totalPago,
        faturamento_em_aberto: totalAberto,
        acessos_liberados_hoje: acessosLiberadosHoje,
      },
      ranking_personais: rankingPersonais,
      horarios_movimento: horariosMovimento,
      top_exercicios: topExercicios,
      top_alunos: topAlunos,
      treinos_por_dia_semana: treinosPorDiaSemana,
      faturamento_por_competencia: faturamentoPorCompetencia,
      top_frequencia: topFrequencia
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard" },
      { status: 400 }
    );
  }
}