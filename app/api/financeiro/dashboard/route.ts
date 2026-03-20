import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

function ym(date: string | null | undefined) {
  if (!date) return "";
  return String(date).slice(0, 7);
}

function monthLabel(ymValue: string) {
  const [y, m] = ymValue.split("-");
  const meses = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  const mi = Number(m) - 1;
  if (!y || Number.isNaN(mi) || mi < 0 || mi > 11) return ymValue;
  return `${meses[mi]}/${String(y).slice(2)}`;
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (!inicio || !fim) {
      return NextResponse.json(
        { error: "Informe inicio e fim" },
        { status: 400 }
      );
    }

    const hoje = new Date();
    const mesAtual = hoje.toISOString().slice(0, 7);

    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    const inicioMesAtual = new Date(ano, mes, 1).toISOString().slice(0, 10);
    const fimMesAtual = new Date(ano, mes + 1, 0).toISOString().slice(0, 10);

    const inicioMesAnterior = new Date(ano, mes - 1, 1)
      .toISOString()
      .slice(0, 10);
    const fimMesAnterior = new Date(ano, mes, 0).toISOString().slice(0, 10);

    const [
      pagamentosPeriodoRes,
      despesasPeriodoRes,
      pagamentosMesAtualRes,
      pagamentosMesAnteriorRes,
      despesasMesAtualRes,
      despesasMesAnteriorRes,
      pagamentosInadimplentesRes,
      despesasPendentesRes,
    ] = await Promise.all([
      supabaseServer
        .from("financeiro_pagamentos")
        .select(
          "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento"
        )
        .eq("academia_id", academiaId)
        .gte("vencimento", inicio)
        .lte("vencimento", fim),

      supabaseServer
        .from("financeiro_despesas")
        .select(
          "id, descricao, categoria, valor, data_lancamento, data_pagamento, status, tipo"
        )
        .eq("academia_id", academiaId)
        .gte("data_lancamento", inicio)
        .lte("data_lancamento", fim),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("valor, status, data_pagamento")
        .eq("academia_id", academiaId)
        .eq("status", "pago")
        .gte("data_pagamento", inicioMesAtual)
        .lte("data_pagamento", fimMesAtual),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("valor, status, data_pagamento")
        .eq("academia_id", academiaId)
        .eq("status", "pago")
        .gte("data_pagamento", inicioMesAnterior)
        .lte("data_pagamento", fimMesAnterior),

      supabaseServer
        .from("financeiro_despesas")
        .select("valor, status, data_pagamento")
        .eq("academia_id", academiaId)
        .eq("status", "pago")
        .gte("data_pagamento", inicioMesAtual)
        .lte("data_pagamento", fimMesAtual),

      supabaseServer
        .from("financeiro_despesas")
        .select("valor, status, data_pagamento")
        .eq("academia_id", academiaId)
        .eq("status", "pago")
        .gte("data_pagamento", inicioMesAnterior)
        .lte("data_pagamento", fimMesAnterior),

      supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, competencia, valor, vencimento, status")
        .eq("academia_id", academiaId)
        .neq("status", "pago")
        .lt("vencimento", hoje.toISOString().slice(0, 10)),

      supabaseServer
        .from("financeiro_despesas")
        .select(
          "id, descricao, categoria, valor, data_lancamento, status, tipo"
        )
        .eq("academia_id", academiaId)
        .neq("status", "pago")
        .gte("data_lancamento", inicio)
        .lte("data_lancamento", fim)
        .order("data_lancamento", { ascending: false }),
    ]);

    const possibleErrors = [
      pagamentosPeriodoRes.error,
      despesasPeriodoRes.error,
      pagamentosMesAtualRes.error,
      pagamentosMesAnteriorRes.error,
      despesasMesAtualRes.error,
      despesasMesAnteriorRes.error,
      pagamentosInadimplentesRes.error,
      despesasPendentesRes.error,
    ].filter(Boolean);

    if (possibleErrors.length > 0) {
      return NextResponse.json(
        { error: possibleErrors[0]?.message || "Erro ao carregar dashboard financeiro" },
        { status: 500 }
      );
    }

    const pagamentosPeriodo = pagamentosPeriodoRes.data || [];
    const despesasPeriodo = despesasPeriodoRes.data || [];
    const pagamentosMesAtual = pagamentosMesAtualRes.data || [];
    const pagamentosMesAnterior = pagamentosMesAnteriorRes.data || [];
    const despesasMesAtual = despesasMesAtualRes.data || [];
    const despesasMesAnterior = despesasMesAnteriorRes.data || [];
    const pagamentosInadimplentes = pagamentosInadimplentesRes.data || [];
    const despesasPendentes = despesasPendentesRes.data || [];

    const alunoIds = Array.from(
      new Set(
        [...pagamentosPeriodo, ...pagamentosInadimplentes]
          .map((item: any) => item.aluno_id)
          .filter(Boolean)
      )
    );

    let mapaAlunos = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos, error: alunosError } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      if (alunosError) {
        return NextResponse.json(
          { error: alunosError.message },
          { status: 500 }
        );
      }

      mapaAlunos = new Map(
        (alunos || []).map((aluno) => [Number(aluno.id), String(aluno.nome || "")])
      );
    }

    const receitaTotal = pagamentosPeriodo
      .filter((item: any) => item.status === "pago")
      .reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);

    const despesasTotal = despesasPeriodo
      .filter((item: any) => item.status === "pago")
      .reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);

    const emAberto = pagamentosPeriodo
      .filter((item: any) => item.status !== "pago")
      .reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);

    const inadimplencia = pagamentosInadimplentes.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const totalPagamentos = pagamentosPeriodo.filter(
      (item: any) => item.status === "pago"
    ).length;

    const totalDespesas = despesasPeriodo.length;

    const despesasPendentesCount = despesasPendentes.length;
    const valorDespesasPendentes = despesasPendentes.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const receitaMesAtual = pagamentosMesAtual.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const receitaMesAnterior = pagamentosMesAnterior.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const despesasMesAtualTotal = despesasMesAtual.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const despesasMesAnteriorTotal = despesasMesAnterior.reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const formasPagamento = pagamentosPeriodo
      .filter((item: any) => item.status === "pago")
      .reduce(
        (acc: Record<string, number>, item: any) => {
          const forma = String(item.forma_pagamento || "").toLowerCase();

          if (forma.includes("pix")) acc.pix += Number(item.valor || 0);
          else if (forma.includes("cart")) acc.cartao += Number(item.valor || 0);
          else if (forma.includes("boleto")) acc.boleto += Number(item.valor || 0);
          else if (forma.includes("dinheiro")) acc.dinheiro += Number(item.valor || 0);
          else acc.dinheiro += Number(item.valor || 0);

          return acc;
        },
        { pix: 0, cartao: 0, dinheiro: 0, boleto: 0 }
      );

    const mensalMap = new Map<
      string,
      { mes: string; receita: number; despesa: number; saldo: number }
    >();

    for (const item of pagamentosPeriodo) {
      const chave = ym(item.data_pagamento || item.vencimento || item.competencia);
      if (!chave) continue;

      if (!mensalMap.has(chave)) {
        mensalMap.set(chave, {
          mes: monthLabel(chave),
          receita: 0,
          despesa: 0,
          saldo: 0,
        });
      }

      if (item.status === "pago") {
        const atual = mensalMap.get(chave)!;
        atual.receita += Number(item.valor || 0);
      }
    }

    for (const item of despesasPeriodo) {
      const chave = ym(item.data_pagamento || item.data_lancamento);
      if (!chave) continue;

      if (!mensalMap.has(chave)) {
        mensalMap.set(chave, {
          mes: monthLabel(chave),
          receita: 0,
          despesa: 0,
          saldo: 0,
        });
      }

      if (item.status === "pago") {
        const atual = mensalMap.get(chave)!;
        atual.despesa += Number(item.valor || 0);
      }
    }

    const mensal = Array.from(mensalMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, value]) => ({
        ...value,
        saldo: value.receita - value.despesa,
      }));

    const categoriasMap = new Map<string, number>();
    for (const item of despesasPeriodo) {
      const categoria = String(item.categoria || "Sem categoria");
      categoriasMap.set(
        categoria,
        (categoriasMap.get(categoria) || 0) + Number(item.valor || 0)
      );
    }

    const categoriasDespesas = Array.from(categoriasMap.entries())
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const topAlunosMap = new Map<string, number>();
    for (const item of pagamentosPeriodo) {
      if (item.status !== "pago") continue;
      const nome = mapaAlunos.get(Number(item.aluno_id)) || `Aluno #${item.aluno_id}`;
      topAlunosMap.set(
        nome,
        (topAlunosMap.get(nome) || 0) + Number(item.valor || 0)
      );
    }

    const topAlunos = Array.from(topAlunosMap.entries())
      .map(([aluno_nome, valor]) => ({ aluno_nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10);

    const inadMap = new Map<string, number>();
    for (const item of pagamentosInadimplentes) {
      const comp = String(item.competencia || ym(item.vencimento) || mesAtual);
      inadMap.set(comp, (inadMap.get(comp) || 0) + Number(item.valor || 0));
    }

    const inadimplenciaPorCompetencia = Array.from(inadMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([competencia, valor]) => ({
        competencia,
        valor,
      }));

    const despesasPendentesLista = despesasPendentes.slice(0, 20).map((item: any) => ({
      id: Number(item.id),
      descricao: String(item.descricao || "Despesa"),
      categoria: item.categoria || null,
      valor: Number(item.valor || 0),
      data_lancamento: String(item.data_lancamento || ""),
      tipo: item.tipo || null,
    }));

    return NextResponse.json({
      resumo: {
        receitaTotal,
        despesasTotal,
        saldo: receitaTotal - despesasTotal,
        emAberto,
        inadimplencia,
        totalPagamentos,
        totalDespesas,
        receitaMesAtual,
        receitaMesAnterior,
        despesasMesAtual: despesasMesAtualTotal,
        despesasMesAnterior: despesasMesAnteriorTotal,
        despesasPendentes: despesasPendentesCount,
        valorDespesasPendentes,
      },
      formasPagamento,
      mensal,
      categoriasDespesas,
      topAlunos,
      inadimplenciaPorCompetencia,
      despesasPendentesLista,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard financeiro" },
      { status: 400 }
    );
  }
}