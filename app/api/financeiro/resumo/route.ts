import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

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
      .select("id, aluno_id, valor, status, vencimento, data_pagamento")
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim);

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, valor, data_lancamento")
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim);

    if (pagamentosError) {
      return NextResponse.json(
        { error: pagamentosError.message },
        { status: 500 }
      );
    }

    if (despesasError) {
      return NextResponse.json(
        { error: despesasError.message },
        { status: 500 }
      );
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const receitaMes = (pagamentos || [])
      .filter((p) => p.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const emAberto = (pagamentos || [])
      .filter((p) => p.status === "pendente")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);

    const inadimplentes = (pagamentos || []).filter(
      (p) => p.status === "pendente" && p.vencimento < hoje
    );

    const inadimplencia = inadimplentes.reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const despesasMes = (despesas || []).reduce(
      (acc, item) => acc + Number(item.valor || 0),
      0
    );

    const saldo = receitaMes - despesasMes;

    const totalInadimplentes = new Set(
      inadimplentes.map((item) => item.aluno_id)
    ).size;

    return NextResponse.json({
      receitaMes,
      emAberto,
      despesasMes,
      inadimplencia,
      saldo,
      totalInadimplentes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar resumo" },
      { status: 400 }
    );
  }
}