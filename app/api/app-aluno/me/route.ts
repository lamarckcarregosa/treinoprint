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

    const { data: aluno, error } = await supabaseServer
      .from("alunos")
      .select(
        "id, nome, telefone, cpf, plano, status, foto_url, objetivo, peso_meta, senha_app_alterada, app_ativo"
      )
      .eq("id", alunoId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar aluno" },
        { status: 500 }
      );
    }

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(aluno);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar aluno" },
      { status: 400 }
    );
  }
}