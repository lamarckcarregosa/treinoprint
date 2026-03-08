import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { error } = await supabaseServer
      .from("treinos_modelos")
      .delete()
      .eq("id", id)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir treino" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const semana = String(body.semana || "").trim();
    const dia = String(body.dia || "").trim();
    const nivel = String(body.nivel || "").trim();
    const tipo = String(body.tipo || "").trim();
    const exercicios = Array.isArray(body.exercicios) ? body.exercicios : [];

    if (!semana || !dia || !nivel || !tipo) {
      return NextResponse.json(
        { error: "Semana, dia, nível e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("treinos_modelos")
      .update({
        semana,
        dia,
        nivel,
        tipo,
        exercicios,
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
      { error: error.message || "Erro ao atualizar treino" },
      { status: 400 }
    );
  }
}