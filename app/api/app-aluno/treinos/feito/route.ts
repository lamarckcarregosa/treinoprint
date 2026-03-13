import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const alunoId = req.headers.get("x-aluno-id");
    const academiaId = req.headers.get("x-academia-id");

    if (!alunoId || !academiaId) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const historico_impressao_id = Number(body.historico_impressao_id);
    const exercicio_indice = Number(body.exercicio_indice);
    const feito = body.feito !== false;

    if (!historico_impressao_id && historico_impressao_id !== 0) {
      return NextResponse.json(
        { error: "Treino não informado" },
        { status: 400 }
      );
    }

    if (Number.isNaN(exercicio_indice)) {
      return NextResponse.json(
        { error: "Exercício não informado" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("app_aluno_exercicios_feitos")
      .upsert(
        {
          academia_id: academiaId,
          aluno_id: Number(alunoId),
          historico_impressao_id,
          exercicio_indice,
          feito,
        },
        {
          onConflict:
            "academia_id,aluno_id,historico_impressao_id,exercicio_indice",
        }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao salvar progresso" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao marcar exercício" },
      { status: 400 }
    );
  }
}