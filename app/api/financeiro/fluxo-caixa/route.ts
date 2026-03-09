import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const competencia = searchParams.get("competencia") || new Date().toISOString().slice(0, 7);
    const [ano, mes] = competencia.split("-").map(Number);

    const inicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
    const fimDate = new Date(ano, mes, 1);
    const fim = fimDate.toISOString().slice(0, 10);

    const { data: pagamentos, error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, valor, data_pagamento, vencimento, status, aluno_id")
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lt("vencimento", fim)
      .order("vencimento", { ascending: true });

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, descricao, valor, data_lancamento, tipo")
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lt("data_lancamento", fim)
      .order("data_lancamento", { ascending: true });

    if (pagamentosError) {
      return NextResponse.json({ error: pagamentosError.message }, { status: 500 });
    }

    if (despesasError) {
      return NextResponse.json({ error: despesasError.message }, { status: 500 });
    }

    const entradas = (pagamentos || [])
      .filter((p) => p.status === "pago" && p.data_pagamento)
      .map((p) => ({
        tipo: "entrada",
        descricao: "Pagamento de mensalidade",
        valor: Number(p.valor || 0),
        data: p.data_pagamento,
      }));

    const saidas = (despesas || []).map((d) => ({
      tipo: "saida",
      descricao: d.descricao || "Despesa",
      valor: Number(d.valor || 0),
      data: d.data_lancamento,
    }));

    const movimentos = [...entradas, ...saidas].sort((a, b) =>
      String(a.data).localeCompare(String(b.data))
    );

    let saldoAcumulado = 0;

    const lista = movimentos.map((item) => {
      if (item.tipo === "entrada") saldoAcumulado += item.valor;
      else saldoAcumulado -= item.valor;

      return {
        ...item,
        saldo_acumulado: saldoAcumulado,
      };
    });

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar fluxo de caixa" },
      { status: 400 }
    );
  }
}