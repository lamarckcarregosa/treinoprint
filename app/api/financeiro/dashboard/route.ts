import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

function mesLabel(competencia: string) {
  const [ano, mes] = competencia.split("-");
  return `${mes}/${ano}`;
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

    const { data: pagamentos, error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(
        "id, aluno_id, valor, status, vencimento, data_pagamento, competencia, forma_pagamento"
      )
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim);

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, descricao, categoria, valor, data_lancamento")
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim);

    if (pagamentosError) {
      return NextResponse.json({ error: pagamentosError.message }, { status: 500 });
    }

    if (despesasError) {
      return NextResponse.json({ error: despesasError.message }, { status: 500 });
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const pagos = (pagamentos || []).filter((p) => p.status === "pago");
    const pendentes = (pagamentos || []).filter((p) => p.status === "pendente");
    const atrasados = pendentes.filter((p) => p.vencimento < hoje);

    const receitaTotal = pagos.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const emAberto = pendentes.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const inadimplencia = atrasados.reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const despesasTotal = (despesas || []).reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );
    const saldo = receitaTotal - despesasTotal;

    const formasPagamento = {
      pix: pagos
        .filter((p) => p.forma_pagamento === "pix")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
      cartao: pagos
        .filter((p) => p.forma_pagamento === "cartao")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
      dinheiro: pagos
        .filter((p) => p.forma_pagamento === "dinheiro")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
      boleto: pagos
        .filter((p) => p.forma_pagamento === "boleto")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    };

    const mensalMap: Record<
      string,
      { mes: string; receita: number; despesa: number; saldo: number }
    > = {};

    for (const item of pagamentos || []) {
      const chave = item.competencia || "Sem mês";
      if (!mensalMap[chave]) {
        mensalMap[chave] = {
          mes: chave === "Sem mês" ? chave : mesLabel(chave),
          receita: 0,
          despesa: 0,
          saldo: 0,
        };
      }

      if (item.status === "pago") {
        mensalMap[chave].receita += Number(item.valor || 0);
      }
    }

    for (const item of despesas || []) {
      const dt = item.data_lancamento;
      const chave = dt ? dt.slice(0, 7) : "Sem mês";

      if (!mensalMap[chave]) {
        mensalMap[chave] = {
          mes: chave === "Sem mês" ? chave : mesLabel(chave),
          receita: 0,
          despesa: 0,
          saldo: 0,
        };
      }

      mensalMap[chave].despesa += Number(item.valor || 0);
    }

    const mensal = Object.entries(mensalMap)
      .map(([chave, item]) => ({
        chave,
        mes: item.mes,
        receita: item.receita,
        despesa: item.despesa,
        saldo: item.receita - item.despesa,
      }))
      .sort((a, b) => a.chave.localeCompare(b.chave))
      .map(({ chave, ...rest }) => rest);

    const categoriasMap: Record<string, number> = {};
    for (const item of despesas || []) {
      const categoria = item.categoria || "Sem categoria";
      categoriasMap[categoria] = (categoriasMap[categoria] || 0) + Number(item.valor || 0);
    }

    const categoriasDespesas = Object.entries(categoriasMap)
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    const alunoIds = [...new Set(pagos.map((p) => p.aluno_id))];

    const { data: alunos } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .in("id", alunoIds.length ? alunoIds : [-1]);

    const alunosMap = new Map((alunos || []).map((a) => [a.id, a.nome]));

    const topAlunosMap: Record<number, number> = {};
    for (const item of pagos) {
      topAlunosMap[item.aluno_id] = (topAlunosMap[item.aluno_id] || 0) + Number(item.valor || 0);
    }

    const topAlunos = Object.entries(topAlunosMap)
      .map(([alunoId, valor]) => ({
        aluno_nome: alunosMap.get(Number(alunoId)) || "Aluno",
        valor,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);

    return NextResponse.json({
      resumo: {
        receitaTotal,
        despesasTotal,
        saldo,
        emAberto,
        inadimplencia,
        totalPagamentos: pagos.length,
        totalDespesas: (despesas || []).length,
      },
      formasPagamento,
      mensal,
      categoriasDespesas,
      topAlunos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard financeiro" },
      { status: 400 }
    );
  }
}