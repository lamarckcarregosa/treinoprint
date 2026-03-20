import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Movimento = {
  id: number | string;
  tipo: "entrada" | "saida";
  origem: "pagamento" | "despesa";
  descricao: string;
  categoria?: string | null;
  aluno_nome?: string | null;
  valor: number;
  data: string;
  status?: string | null;
  forma_pagamento?: string | null;
};

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
        "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento"
      )
      .eq("academia_id", academiaId)
      .eq("status", "pago")
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim)
      .order("data_pagamento", { ascending: true });

    if (pagamentosError) {
      return NextResponse.json(
        { error: pagamentosError.message },
        { status: 500 }
      );
    }

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select(
        "id, descricao, categoria, valor, data_lancamento, data_pagamento, status, observacoes, tipo"
      )
      .eq("academia_id", academiaId)
      .eq("status", "pago")
      .gte("data_pagamento", inicio)
      .lte("data_pagamento", fim)
      .order("data_pagamento", { ascending: true });

    if (despesasError) {
      return NextResponse.json(
        { error: despesasError.message },
        { status: 500 }
      );
    }

    const alunoIds = Array.from(
      new Set(
        (pagamentos || [])
          .map((item) => item.aluno_id)
          .filter((id) => id !== null && id !== undefined)
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
        (alunos || []).map((aluno) => [Number(aluno.id), aluno.nome])
      );
    }

    const movimentosPagamentos: Movimento[] = (pagamentos || []).map((item) => ({
      id: item.id,
      tipo: "entrada",
      origem: "pagamento",
      descricao: `Mensalidade ${item.competencia || ""}`.trim(),
      categoria: "Mensalidade",
      aluno_nome: mapaAlunos.get(Number(item.aluno_id)) || `Aluno #${item.aluno_id}`,
      valor: Number(item.valor || 0),
      data: item.data_pagamento || item.vencimento,
      status: item.status || null,
      forma_pagamento: item.forma_pagamento || null,
    }));

    const movimentosDespesas: Movimento[] = (despesas || []).map((item) => ({
      id: item.id,
      tipo: "saida",
      origem: "despesa",
      descricao: item.descricao || "Despesa",
      categoria: item.categoria || null,
      aluno_nome: null,
      valor: Number(item.valor || 0),
      data: item.data_pagamento || item.data_lancamento,
      status: item.status || null,
      forma_pagamento: null,
    }));

    const movimentos = [...movimentosPagamentos, ...movimentosDespesas].sort(
      (a, b) => String(a.data).localeCompare(String(b.data))
    );

    const totalEntradas = movimentosPagamentos.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const totalSaidas = movimentosDespesas.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const saldo = totalEntradas - totalSaidas;

    return NextResponse.json({
      resumo: {
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        saldo,
      },
      movimentos,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar fluxo de caixa" },
      { status: 400 }
    );
  }
}