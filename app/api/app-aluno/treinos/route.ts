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
      .from("historico_impressoes")
      .select("id, aluno_nome, personal_nome, semana, dia, nivel, tipo, exercicios, created_at")
      .eq("academia_id", academiaId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar treinos" },
        { status: 500 }
      );
    }

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .eq("id", alunoId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (alunoError) {
      return NextResponse.json(
        { error: alunoError.message || "Erro ao validar aluno" },
        { status: 500 }
      );
    }

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const nomeAluno = String(aluno.nome || "").trim().toLowerCase();

    const lista = (data || []).filter(
      (item) => String(item.aluno_nome || "").trim().toLowerCase() === nomeAluno
    );

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar treinos" },
      { status: 400 }
    );
  }
}