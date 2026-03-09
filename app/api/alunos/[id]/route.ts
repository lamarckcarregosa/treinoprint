import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { data, error } = await supabaseServer
      .from("alunos")
      .select(
        "id, nome, telefone, endereco, data_nascimento, cpf, plano, data_matricula, status, foto_url"
      )
      .eq("id", id)
      .eq("academia_id", academiaId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar aluno" },
      { status: 400 }
    );
  }
}