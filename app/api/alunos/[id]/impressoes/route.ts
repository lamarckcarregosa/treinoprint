import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("nome")
      .eq("id", id)
      .eq("academia_id", academiaId)
      .single();

    if (alunoError) {
      return NextResponse.json({ error: alunoError.message }, { status: 500 });
    }

    if (!aluno?.nome) {
      return NextResponse.json([]);
    }

    const { data, error } = await supabaseServer
      .from("historico_impressoes")
      .select("id, dia, nivel, personal_nome, created_at")
      .eq("academia_id", academiaId)
      .eq("aluno_nome", aluno.nome)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar impressões do aluno" },
      { status: 400 }
    );
  }
}