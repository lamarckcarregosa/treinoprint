import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const telefone = String(body.telefone || "").trim();
    const cref = String(body.cref || "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("personals")
      .update({
        nome,
        telefone,
        cref,
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
      { error: error.message || "Erro ao atualizar personal" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { error } = await supabaseServer
      .from("personals")
      .delete()
      .eq("id", id)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir personal" },
      { status: 400 }
    );
  }
}