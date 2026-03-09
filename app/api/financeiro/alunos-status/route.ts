import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const hoje = new Date().toISOString().slice(0, 10);

    const { data: alunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    const { data: pagamentos, error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("aluno_id, status, vencimento")
      .eq("academia_id", academiaId);

    if (pagamentosError) {
      return NextResponse.json({ error: pagamentosError.message }, { status: 500 });
    }

    const lista = (alunos || []).map((aluno) => {
      const pagamentosAluno = (pagamentos || []).filter((p) => p.aluno_id === aluno.id);

      const atrasado = pagamentosAluno.some(
        (p) => p.status === "pendente" && p.vencimento < hoje
      );

      const pendente = pagamentosAluno.some(
        (p) => p.status === "pendente" && p.vencimento >= hoje
      );

      let status_financeiro = "sem_lancamento";

      if (atrasado) status_financeiro = "inadimplente";
      else if (pendente) status_financeiro = "pendente";
      else if (pagamentosAluno.length > 0) status_financeiro = "em_dia";

      return {
        id: aluno.id,
        nome: aluno.nome,
        status_financeiro,
      };
    });

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar status financeiro dos alunos" },
      { status: 400 }
    );
  }
}