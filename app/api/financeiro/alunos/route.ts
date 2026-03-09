import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data: alunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    const { data: financeiro, error: financeiroError } = await supabaseServer
      .from("financeiro_alunos")
      .select("id, aluno_id, valor_mensalidade, vencimento_dia, ativo")
      .eq("academia_id", academiaId);

    if (financeiroError) {
      return NextResponse.json({ error: financeiroError.message }, { status: 500 });
    }

    const financeiroMap = new Map(
      (financeiro || []).map((item) => [item.aluno_id, item])
    );

    const lista = (alunos || []).map((aluno) => {
      const conf = financeiroMap.get(aluno.id);

      return {
        id: conf?.id || null,
        aluno_id: aluno.id,
        nome: aluno.nome,
        valor_mensalidade: Number(conf?.valor_mensalidade || 0),
        vencimento_dia: Number(conf?.vencimento_dia || 10),
        ativo: conf?.ativo ?? true,
      };
    });

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar financeiro dos alunos" },
      { status: 400 }
    );
  }
}