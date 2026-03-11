import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { protegerApi } from "../../../../../lib/protegerApi";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const { id } = await context.params;
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
      .update(payload)
      .eq("id", Number(id))
      .eq("academia_id", academiaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar despesa" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const { id } = await context.params;

    const { error } = await supabaseServer
      .from("financeiro_despesas")
      .delete()
      .eq("id", Number(id))
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir despesa" },
      { status: 400 }
    );
  }
}