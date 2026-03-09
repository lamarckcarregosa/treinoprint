import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const hoje = new Date().toISOString().slice(0, 10);

    const { data: pagamentos, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, aluno_id, valor, vencimento, competencia, status")
      .eq("academia_id", academiaId)
      .eq("status", "pendente")
      .lt("vencimento", hoje)
      .order("vencimento", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const alunoIds = [...new Set((pagamentos || []).map((p) => p.aluno_id))];

    const { data: alunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("id, nome, telefone")
      .in("id", alunoIds.length ? alunoIds : [-1]);

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    const alunosMap = new Map(
      (alunos || []).map((a) => [
        a.id,
        {
          nome: a.nome,
          telefone: a.telefone || "",
        },
      ])
    );

    const agrupado: Record<
      number,
      {
        aluno_id: number;
        aluno_nome: string;
        telefone: string;
        total_em_aberto: number;
        qtd_parcelas: number;
        maior_dias_atraso: number;
        itens: {
          id: number;
          competencia: string;
          valor: number;
          vencimento: string;
          dias_atraso: number;
        }[];
      }
    > = {};

    for (const item of pagamentos || []) {
      const diasAtraso = Math.floor(
        (new Date().getTime() - new Date(item.vencimento).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const alunoInfo = alunosMap.get(item.aluno_id);

      if (!agrupado[item.aluno_id]) {
        agrupado[item.aluno_id] = {
          aluno_id: item.aluno_id,
          aluno_nome: alunoInfo?.nome || "Aluno",
          telefone: alunoInfo?.telefone || "",
          total_em_aberto: 0,
          qtd_parcelas: 0,
          maior_dias_atraso: 0,
          itens: [],
        };
      }

      agrupado[item.aluno_id].total_em_aberto += Number(item.valor || 0);
      agrupado[item.aluno_id].qtd_parcelas += 1;
      agrupado[item.aluno_id].maior_dias_atraso = Math.max(
        agrupado[item.aluno_id].maior_dias_atraso,
        diasAtraso
      );

      agrupado[item.aluno_id].itens.push({
        id: item.id,
        competencia: item.competencia,
        valor: Number(item.valor || 0),
        vencimento: item.vencimento,
        dias_atraso: diasAtraso,
      });
    }

    return NextResponse.json(Object.values(agrupado));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar inadimplentes" },
      { status: 400 }
    );
  }
}