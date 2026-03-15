import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

function hojeISOLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function normalizarTexto(valor: any) {
  return String(valor || "").trim();
}

function capitalizarPrimeira(texto: string) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function normalizarDia(valor: any) {
  const bruto = normalizarTexto(valor).toLowerCase();

  const mapa: Record<string, string> = {
    segunda: "Segunda",
    "terça": "Terça",
    terca: "Terça",
    quarta: "Quarta",
    quinta: "Quinta",
    sexta: "Sexta",
    "sábado": "Sábado",
    sabado: "Sábado",
    domingo: "Domingo",
  };

  return mapa[bruto] || capitalizarPrimeira(normalizarTexto(valor));
}

function normalizarNivel(valor: any) {
  const bruto = normalizarTexto(valor).toLowerCase();

  const mapa: Record<string, string> = {
    iniciante: "Iniciante",
    "intermediário": "Intermediário",
    intermediario: "Intermediário",
    "avançado": "Avançado",
    avancado: "Avançado",
  };

  return mapa[bruto] || capitalizarPrimeira(normalizarTexto(valor));
}

function inicioDoPeriodo(periodo: string) {
  const agora = new Date();
  const dt = new Date(agora);

  if (periodo === "hoje") {
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  if (periodo === "semana") {
    dt.setDate(dt.getDate() - 6);
    dt.setHours(0, 0, 0, 0);
    return dt;
  }

  dt.setDate(1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function fimDoPeriodo(periodo: string) {
  const agora = new Date();
  const dt = new Date(agora);

  if (periodo === "hoje") {
    dt.setHours(23, 59, 59, 999);
    return dt;
  }

  if (periodo === "semana") {
    dt.setHours(23, 59, 59, 999);
    return dt;
  }

  dt.setMonth(dt.getMonth() + 1, 0);
  dt.setHours(23, 59, 59, 999);
  return dt;
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "mes";

    const inicio = inicioDoPeriodo(periodo);
    const fim = fimDoPeriodo(periodo);
    const hojeStr = hojeISOLocal();

    const [
      alunosRes,
      alunosAtivosRes,
      historicoRes,
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
        .from("historico_impressoes")
        .select("id, academia_id, aluno_nome, personal_nome, dia, nivel, tipo, created_at, semana")
        .eq("academia_id", academiaId)
        .order("created_at", { ascending: false }),

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
        .gte("data_pagamento", inicio.toISOString().slice(0, 10))
        .lte("data_pagamento", fim.toISOString().slice(0, 10))
        .order("data_pagamento", { ascending: false }),

      supabaseServer
        .from("financeiro_despesas")
        .select("id, valor, created_at")
        .eq("academia_id", academiaId)
        .gte("created_at", inicio.toISOString())
        .lte("created_at", fim.toISOString()),

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
    if (historicoRes.error) {
      return NextResponse.json({ error: historicoRes.error.message }, { status: 500 });
    }
    if (pagamentosPendentesRes.error) {
      return NextResponse.json({ error: pagamentosPendentesRes.error.message }, { status: 500 });
    }
    if (pagamentosPagosPeriodoRes.error) {
      return NextResponse.json({ error: pagamentosPagosPeriodoRes.error.message }, { status: 500 });
    }
    if (despesasPeriodoRes.error) {
      return NextResponse.json({ error: despesasPeriodoRes.error.message }, { status: 500 });
    }
    if (alunosVencidosRes.error) {
      return NextResponse.json({ error: alunosVencidosRes.error.message }, { status: 500 });
    }

    const alunosCadastrados = alunosRes.count || 0;
    const alunosAtivos = alunosAtivosRes.count || 0;

    const historicoRaw = historicoRes.data || [];
    const pagamentosPendentes = pagamentosPendentesRes.data || [];
    const pagamentosPagosPeriodo = pagamentosPagosPeriodoRes.data || [];
    const despesasPeriodo = despesasPeriodoRes.data || [];
    const alunosVencidosRaw = alunosVencidosRes.data || [];

    const historico = historicoRaw.map((item: any) => {
      const createdAt = new Date(item.created_at);
      const hora = createdAt.getHours();

      return {
        ...item,
        aluno_nome: normalizarTexto(item.aluno_nome) || "Aluno",
        personal_nome: normalizarTexto(item.personal_nome) || "-",
        dia: normalizarDia(item.dia),
        nivel: normalizarNivel(item.nivel),
        tipo: normalizarTexto(item.tipo),
        created_at_date: createdAt,
        hora_label: `${String(hora).padStart(2, "0")}:00`,
      };
    });

    const treinosPeriodo = historico.filter((item: any) => {
      const dt = item.created_at_date;
      return dt >= inicio && dt <= fim;
    });

    const treinosHoje = historico.filter((item: any) => {
      const dt = item.created_at_date;
      const ano = dt.getFullYear();
      const mes = String(dt.getMonth() + 1).padStart(2, "0");
      const dia = String(dt.getDate()).padStart(2, "0");
      return `${ano}-${mes}-${dia}` === hojeStr;
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

    const personalCounter = new Map<string, number>();
    treinosPeriodo.forEach((item: any) => {
      const personal = item.personal_nome || "-";
      if (!personal || personal === "-") return;
      personalCounter.set(personal, (personalCounter.get(personal) || 0) + 1);
    });

    const personalMaisAtivo =
      Array.from(personalCounter.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

    const treinosRecentes = historico.slice(0, 12).map((item: any) => ({
      horario: new Date(item.created_at).toLocaleString("pt-BR"),
      aluno: item.aluno_nome || "Aluno",
      dia: item.dia || "-",
    }));

    const horaCounter = new Map<string, number>();
    treinosPeriodo.forEach((item: any) => {
      const hora = item.hora_label || "00:00";
      horaCounter.set(hora, (horaCounter.get(hora) || 0) + 1);
    });

    const ordemHoras = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    const treinosPorHorario = ordemHoras.map((hora) => ({
      hora,
      total: horaCounter.get(hora) || 0,
    }));

    const rankingPersonal = Array.from(personalCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, total]) => ({
        nome,
        total,
      }));

    const alunoCounter = new Map<string, number>();
    treinosPeriodo.forEach((item: any) => {
      const aluno = item.aluno_nome || "Aluno";
      alunoCounter.set(aluno, (alunoCounter.get(aluno) || 0) + 1);
    });

    const alunosMaisTreinam = Array.from(alunoCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([nome, total]) => ({
        nome,
        total,
      }));

    const diasMaisMovimentados = Array.from(diaCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([dia, total]) => ({
        dia,
        total,
      }));

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
      treinosHoje,
      personalMaisAtivo,
      diaMaisUsado,
      mensalidadesEmAberto,
      inadimplentes,
      treinosPorDia,
      treinosPorNivel,
      treinosRecentes,
      treinosPorHorario,
      rankingPersonal,
      alunosMaisTreinam,
      diasMaisMovimentados,
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