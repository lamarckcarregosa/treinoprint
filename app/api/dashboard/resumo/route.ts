import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

type RankingItem = {
  nome: string;
  total: number;
};

type SerieCompetencia = {
  competencia: string;
  pago: number;
  aberto: number;
};

function inicioDoDia(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatCompetenciaLabel(date: Date) {
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const ano = date.getFullYear();
  return `${mes}/${ano}`;
}

function buildUltimosMeses(qtd: number, base = new Date()) {
  const lista: { key: string; label: string }[] = [];

  for (let i = qtd - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    lista.push({
      key,
      label: formatCompetenciaLabel(d),
    });
  }

  return lista;
}

function diaSemanaPt(dateString: string) {
  const dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = new Date(dateString);
  return dias[d.getDay()] || "-";
}

function horaLabel(dateString: string) {
  const d = new Date(dateString);
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}

function normalizeNome(valor: unknown, fallback = "Não informado") {
  if (typeof valor !== "string") return fallback;
  const v = valor.trim();
  return v || fallback;
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const inicioHoje = inicioDoDia(hoje);

    const [
      alunosRes,
      impressoesRes,
      pagamentosRes,
      acessosRes,
      treinosRes,
    ] = await Promise.all([
      supabaseServer
        .from("alunos")
        .select("id, nome, status, created_at")
        .eq("academia_id", academiaId),

      supabaseServer
        .from("historico_impressoes")
        .select(`
          id,
          academia_id,
          aluno_id,
          aluno_nome,
          personal_nome,
          created_at,
          exercicios
        `)
        .eq("academia_id", academiaId),

      supabaseServer
        .from("financeiro_pagamentos")
        .select(`
          id,
          academia_id,
          aluno_id,
          competencia,
          valor,
          vencimento,
          data_pagamento,
          status,
          created_at
        `)
        .eq("academia_id", academiaId),

      supabaseServer
        .from("acessos_catraca")
        .select(`
          id,
          academia_id,
          aluno_id,
          aluno_nome,
          status,
          motivo,
          origem,
          created_at
        `)
        .eq("academia_id", academiaId),

      supabaseServer
        .from("treinos_personalizados")
        .select("id, academia_id, ativo, divisao, created_at")
        .eq("academia_id", academiaId),
    ]);

    if (alunosRes.error) throw alunosRes.error;
    if (impressoesRes.error) throw impressoesRes.error;
    if (pagamentosRes.error) throw pagamentosRes.error;
    if (acessosRes.error) throw acessosRes.error;
    if (treinosRes.error) throw treinosRes.error;

    const alunos = alunosRes.data || [];
    const impressoes = impressoesRes.data || [];
    const pagamentos = pagamentosRes.data || [];
    const acessos = acessosRes.data || [];
    const treinos = treinosRes.data || [];

    const alunosCadastrados = alunos.length;

    const alunosAtivos = alunos.filter(
      (a) => String(a.status || "").toLowerCase() === "ativo"
    ).length;

    const treinosImpressosHoje = impressoes.filter(
      (i) => i.created_at && new Date(i.created_at) >= inicioHoje
    ).length;

    const treinosPersonalizadosAtivos = treinos.filter(
      (t) => t.ativo === true
    ).length;

    const faturamentoPago = pagamentos
      .filter((p) => String(p.status || "").toLowerCase() === "pago")
      .reduce((s, p) => s + Number(p.valor || 0), 0);

    const faturamentoEmAberto = pagamentos
      .filter((p) => String(p.status || "").toLowerCase() !== "pago")
      .reduce((s, p) => s + Number(p.valor || 0), 0);

    const acessosLiberadosHoje = acessos.filter(
      (a) =>
        a.created_at &&
        new Date(a.created_at) >= inicioHoje &&
        String(a.status || "").toLowerCase() === "liberado"
    ).length;

    const divisaoMap = new Map<string, number>();

    treinos.forEach((t: any) => {
      const divisao = normalizeNome(t.divisao, "Sem divisão");
      divisaoMap.set(divisao, (divisaoMap.get(divisao) || 0) + 1);
    });

    const treinosPorDivisao = [...divisaoMap.entries()]
      .map(([divisao, total]) => ({ divisao, total }))
      .sort((a, b) => b.total - a.total);

    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() - 7);

    const alunosComAcessoRecente = new Set(
      acessos
        .filter((a) => a.created_at && new Date(a.created_at) >= seteDias)
        .map((a) => a.aluno_id)
        .filter(Boolean)
    );

    const alunosRisco = alunos.filter(
      (a) => !alunosComAcessoRecente.has(a.id)
    ).length;

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const novosAlunosMes = alunos.filter(
      (a) => a.created_at && new Date(a.created_at) >= inicioMes
    ).length;

    const frequenciaMedia = Math.round(
      acessos.filter((a) => a.created_at && new Date(a.created_at) >= seteDias)
        .length / 7
    );

    const ticketMedio =
      alunosAtivos > 0 ? faturamentoPago / alunosAtivos : 0;

    const inadimplentes = pagamentos.filter((p) => {
      if (String(p.status || "").toLowerCase() === "pago") return false;
      if (!p.vencimento) return false;
      return new Date(p.vencimento) < hoje;
    }).length;

    const personalMap = new Map<string, number>();

    impressoes.forEach((i) => {
      const nome = normalizeNome(i.personal_nome, "Sem personal");
      personalMap.set(nome, (personalMap.get(nome) || 0) + 1);
    });

    const rankingPersonais: RankingItem[] = [...personalMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const alunoMap = new Map<string, number>();

    impressoes.forEach((i) => {
      const nome = normalizeNome(i.aluno_nome, "Aluno");
      alunoMap.set(nome, (alunoMap.get(nome) || 0) + 1);
    });

    const topAlunos: RankingItem[] = [...alunoMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const exercicioMap = new Map<string, number>();

    impressoes.forEach((i: any) => {
      const lista = Array.isArray(i.exercicios) ? i.exercicios : [];

      lista.forEach((ex: any) => {
        const nome = normalizeNome(ex?.nome || ex?.exercicio, "Exercício");
        exercicioMap.set(nome, (exercicioMap.get(nome) || 0) + 1);
      });
    });

    const topExercicios: RankingItem[] = [...exercicioMap.entries()]
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const horariosMap = new Map<string, number>();

    acessos.forEach((a) => {
      if (!a.created_at) return;
      const hora = horaLabel(a.created_at);
      horariosMap.set(hora, (horariosMap.get(hora) || 0) + 1);
    });

    const horariosMovimento = [...horariosMap.entries()]
      .map(([hora, total]) => ({ hora, total }))
      .sort((a, b) => a.hora.localeCompare(b.hora));

    const diasBase = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const diasMap = new Map<string, number>(diasBase.map((d) => [d, 0]));

    impressoes.forEach((i) => {
      if (!i.created_at) return;
      const dia = diaSemanaPt(i.created_at);
      diasMap.set(dia, (diasMap.get(dia) || 0) + 1);
    });

    const treinosPorDiaSemana = diasBase.map((dia) => ({
      dia,
      total: diasMap.get(dia) || 0,
    }));

    const mesesBase = buildUltimosMeses(6, hoje);

    const faturamentoMap = new Map<string, SerieCompetencia>(
      mesesBase.map((m) => [
        m.key,
        {
          competencia: m.label,
          pago: 0,
          aberto: 0,
        },
      ])
    );

    pagamentos.forEach((p) => {
      let key = "";

      const competenciaRaw = String(p.competencia || "").trim();

      if (/^\d{4}-\d{2}$/.test(competenciaRaw)) {
        key = competenciaRaw;
      } else if (/^\d{2}\/\d{4}$/.test(competenciaRaw)) {
        const [mes, ano] = competenciaRaw.split("/");
        key = `${ano}-${mes}`;
      } else if (p.created_at) {
        const d = new Date(p.created_at);
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!faturamentoMap.has(key)) return;

      const valor = Number(p.valor || 0);
      const status = String(p.status || "").toLowerCase();

      if (status === "pago") {
        faturamentoMap.get(key)!.pago += valor;
      } else {
        faturamentoMap.get(key)!.aberto += valor;
      }
    });

    const faturamentoPorCompetencia = mesesBase.map(
      (m) => faturamentoMap.get(m.key)!
    );

    return NextResponse.json({
      cards: {
        alunos_cadastrados: alunosCadastrados,
        alunos_ativos: alunosAtivos,
        treinos_impressos_hoje: treinosImpressosHoje,
        treinos_personalizados_ativos: treinosPersonalizadosAtivos,
        faturamento_pago: faturamentoPago,
        faturamento_em_aberto: faturamentoEmAberto,
        acessos_liberados_hoje: acessosLiberadosHoje,
        inadimplentes,
        alunos_risco: alunosRisco,
        novos_alunos_mes: novosAlunosMes,
        ticket_medio: ticketMedio,
        frequencia_media: frequenciaMedia,
      },
      ranking_personais: rankingPersonais,
      horarios_movimento: horariosMovimento,
      top_exercicios: topExercicios,
      top_alunos: topAlunos,
      treinos_por_dia_semana: treinosPorDiaSemana,
      faturamento_por_competencia: faturamentoPorCompetencia,
      treinos_por_divisao: treinosPorDivisao,
    });
  } catch (error: any) {
    console.error("Erro em /api/dashboard/resumo:", error);

    return NextResponse.json(
      { error: error?.message || "Erro dashboard" },
      { status: 500 }
    );
  }
}