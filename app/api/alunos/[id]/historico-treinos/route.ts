import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {

    // pega o id direto da URL
    const url = new URL(req.url);
    const partes = url.pathname.split("/");

    const alunoId = parseInt(partes[3]); 
    // /api/alunos/11/historico-treinos
    // index 0 1 2   3   4

    if (isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno inválido", recebido: partes[3] },
        { status: 400 }
      );
    }

    const limit = parseInt(url.searchParams.get("limit") || "6");

    const { data, error } = await supabaseServer
      .from("historico_impressoes")
      .select("*")
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data || []);

  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Erro interno" },
      { status: 500 }
    );
  }
}