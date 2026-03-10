import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const { searchParams } = new URL(req.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (!inicio || !fim) {
      return NextResponse.json({ error: "Informe inicio e fim" }, { status: 400 });
    }

    const { data: pagamentos, error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("valor, status, vencimento")
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim);

    if (pagamentosError) {
      return NextResponse.json({ error: pagamentosError.message }, { status: 500 });
    }

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("valor, data_lancamento")
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim);

    if (despesasError) {
      return NextResponse.json({ error: despesasError.message }, { status: 500 });
    }

    const receitaMes = (pagamentos || [])
      .filter((p: any) => p.status === "pago")
      .reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);

    const emAberto = (pagamentos || [])
      .filter((p: any) => p.status === "pendente")
      .reduce((acc: number, item: any) => acc + Number(item.valor || 0), 0);

    const despesasMes = (despesas || []).reduce(
      (acc: number, item: any) => acc + Number(item.valor || 0),
      0
    );

    const inadimplencia = emAberto;
    const saldo = receitaMes - despesasMes;
    const totalInadimplentes = 0;

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