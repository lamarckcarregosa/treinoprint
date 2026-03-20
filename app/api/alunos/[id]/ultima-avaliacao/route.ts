import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const alunoId = Number(id);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno inválido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .select("id, aluno_id, data_avaliacao, created_at")
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .order("data_avaliacao", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return NextResponse.json(
        { error: "Aluno não possui avaliação cadastrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar avaliação" },
      { status: 500 }
    );
  }
}