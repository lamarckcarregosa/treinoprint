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

    const { data: pagamento, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(
        "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento"
      )
      .eq("academia_id", academiaId)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pagamento) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    const { data: aluno } = await supabaseServer
      .from("alunos")
      .select("nome")
      .eq("id", pagamento.aluno_id)
      .eq("academia_id", academiaId)
      .single();

    return NextResponse.json({
      ...pagamento,
      aluno_nome: aluno?.nome || "Aluno",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar comprovante" },
      { status: 400 }
    );
  }
}