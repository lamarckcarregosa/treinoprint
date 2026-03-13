import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const alunoId = req.headers.get("x-aluno-id");
    const academiaId = req.headers.get("x-academia-id");

    if (!alunoId || !academiaId) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("app_aluno_exercicios_feitos")
      .select("historico_impressao_id, exercicio_indice, feito")
      .eq("aluno_id", alunoId)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar progresso" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar progresso" },
      { status: 400 }
    );
  }
}