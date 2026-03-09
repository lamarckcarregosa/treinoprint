import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const competencia = searchParams.get("competencia");

    let query = supabaseServer
      .from("financeiro_pagamentos")
      .select(
        "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento, academia_id"
      )
      .eq("academia_id", academiaId)
      .order("vencimento", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (competencia) {
      query = query.eq("competencia", competencia);
    }

    const { data: pagamentos, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alunoIds = [...new Set((pagamentos || []).map((p) => p.aluno_id))];

    const { data: alunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .in("id", alunoIds.length ? alunoIds : [-1]);

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    const alunosMap = new Map((alunos || []).map((a) => [a.id, a.nome]));

    const resultado = (pagamentos || []).map((item) => ({
      ...item,
      aluno_nome: alunosMap.get(item.aluno_id) || "Aluno",
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar pagamentos" },
      { status: 400 }
    );
  }
}