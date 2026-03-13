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
      .from("avaliacoes_fisicas")
      .select("*")
      .eq("aluno_id", alunoId)
      .eq("academia_id", academiaId)
      .order("data_avaliacao", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar avaliações" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar avaliações" },
      { status: 400 }
    );
  }
}