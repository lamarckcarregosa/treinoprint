import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const alunoId = req.headers.get("x-aluno-id");
    const academiaId = req.headers.get("x-academia-id");
    const { id } = await params;

    if (!alunoId || !academiaId) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .select("*")
      .eq("id", id)
      .eq("aluno_id", alunoId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar avaliação" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Avaliação não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar avaliação" },
      { status: 400 }
    );
  }
}