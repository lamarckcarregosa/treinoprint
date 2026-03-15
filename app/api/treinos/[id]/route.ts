import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;

    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json(
        { error: "ID do treino inválido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("treinos_modelos")
      .select("id, semana, dia, nivel, tipo, exercicios")
      .eq("academia_id", academiaId)
      .eq("id", treinoId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Treino não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar treino" },
      { status: 400 }
    );
  }
}