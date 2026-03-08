import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const {
      aluno_nome,
      personal_nome,
      semana,
      dia,
      nivel,
      tipo,
      exercicios,
      user_id,
    } = body;

    const { data, error } = await supabaseServer
      .from("historico_impressoes")
      .insert([
        {
          academia_id: academiaId,
          aluno_nome,
          personal_nome,
          semana,
          dia,
          nivel,
          tipo,
          exercicios,
          user_id,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar impressão" },
      { status: 400 }
    );
  }
}