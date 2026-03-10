import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "pagamentos");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const competencia = searchParams.get("competencia");

    let query = supabaseServer
      .from("financeiro_pagamentos")
      .select("id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento")
      .eq("academia_id", academiaId)
      .order("vencimento", { ascending: true });

    if (status) query = query.eq("status", status);
    if (competencia) query = query.eq("competencia", competencia);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alunoIds = [...new Set((data || []).map((item: any) => item.aluno_id))];

    let alunosMap = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      alunosMap = new Map((alunos || []).map((a: any) => [a.id, a.nome]));
    }

    const lista = (data || []).map((item: any) => ({
      ...item,
      aluno_nome: alunosMap.get(item.aluno_id) || "Aluno",
    }));

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar pagamentos" },
      { status: 400 }
    );
  }
}