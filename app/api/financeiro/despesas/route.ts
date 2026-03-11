import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;

    const { data, error } = await supabaseServer
      .from("financeiro_despesas")
      .select(`
        id,
        descricao,
        categoria,
        valor,
        data_lancamento,
        observacoes,
        tipo,
        status,
        data_pagamento,
        created_at
      `)
      .eq("academia_id", academiaId)
      .order("data_lancamento", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar despesas" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const body = await req.json();

    const {
      descricao,
      categoria,
      valor,
      data_lancamento,
      observacoes,
      tipo,
      status,
      data_pagamento,
    } = body || {};

    if (!descricao || !valor || !data_lancamento) {
      return NextResponse.json(
        { error: "Descrição, valor e data são obrigatórios" },
        { status: 400 }
      );
    }

    const payload = {
      academia_id: academiaId,
      descricao: String(descricao).trim(),
      categoria: categoria ? String(categoria).trim() : null,
      valor: Number(valor || 0),
      data_lancamento,
      observacoes: observacoes ? String(observacoes).trim() : null,
      tipo: tipo ? String(tipo).trim() : "variavel",
      status: status ? String(status).trim() : "pendente",
      data_pagamento: data_pagamento || null,
    };

    const { data, error } = await supabaseServer
      .from("financeiro_despesas")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar despesa" },
      { status: 400 }
    );
  }
}