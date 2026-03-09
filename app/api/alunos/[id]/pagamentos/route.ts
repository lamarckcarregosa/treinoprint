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

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento")
      .eq("academia_id", academiaId)
      .eq("aluno_id", id)
      .order("vencimento", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar pagamentos do aluno" },
      { status: 400 }
    );
  }
}