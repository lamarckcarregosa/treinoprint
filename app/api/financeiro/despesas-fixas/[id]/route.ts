import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const descricao = String(body.descricao || "").trim();
    const categoria = String(body.categoria || "").trim();
    const valor = Number(body.valor || 0);
    const dia_vencimento = Number(body.dia_vencimento || 5);
    const ativo = body.ativo !== false;

    if (!descricao || !valor) {
      return NextResponse.json(
        { error: "Descrição e valor são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("financeiro_despesas_fixas")
      .update({
        descricao,
        categoria,
        valor,
        dia_vencimento,
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar despesa fixa" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { error } = await supabaseServer
      .from("financeiro_despesas_fixas")
      .delete()
      .eq("id", id)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir despesa fixa" },
      { status: 400 }
    );
  }
}