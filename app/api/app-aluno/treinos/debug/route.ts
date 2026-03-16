import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const alunoIdHeader =
      req.headers.get("x-app-aluno-id") || req.headers.get("x-aluno-id");

    const academiaIdHeader = req.headers.get("x-academia-id");

    const alunoId = Number(alunoIdHeader);

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const { data: aluno } = await supabaseServer
      .from("alunos")
      .select("id, nome, academia_id")
      .eq("id", alunoId)
      .single();

    const academiaId = academiaIdHeader || aluno?.academia_id;

    const { data: personalizado } = await supabaseServer
      .from("treinos_personalizados")
      .select("id, titulo, dia_semana, updated_at, created_at, ativo")
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .eq("ativo", true)
      .order("updated_at", { ascending: false })
      .limit(5);

    const { data: historicoPorId } = await supabaseServer
      .from("historico_impressoes")
      .select("id, aluno_id, aluno_nome, dia, nivel, tipo, origem, created_at")
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: historicoPorNome } = await supabaseServer
      .from("historico_impressoes")
      .select("id, aluno_id, aluno_nome, dia, nivel, tipo, origem, created_at")
      .eq("academia_id", academiaId)
      .eq("aluno_nome", aluno?.nome || "")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      aluno,
      academia_id_usado: academiaId,
      personalizados: personalizado || [],
      historico_por_id: historicoPorId || [],
      historico_por_nome: historicoPorNome || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro no debug" },
      { status: 400 }
    );
  }
}