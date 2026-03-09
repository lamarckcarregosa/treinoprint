import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const aluno_id = Number(body.aluno_id);
    const valor_mensalidade = Number(body.valor_mensalidade || 0);
    const vencimento_dia = Number(body.vencimento_dia || 10);
    const ativo = body.ativo !== false;

    if (!aluno_id) {
      return NextResponse.json(
        { error: "Aluno é obrigatório" },
        { status: 400 }
      );
    }

    const { data: existente, error: buscaError } = await supabaseServer
      .from("financeiro_alunos")
      .select("id")
      .eq("academia_id", academiaId)
      .eq("aluno_id", aluno_id)
      .maybeSingle();

    if (buscaError) {
      return NextResponse.json(
        { error: buscaError.message },
        { status: 500 }
      );
    }

    if (existente) {
      const { error: updateError } = await supabaseServer
        .from("financeiro_alunos")
        .update({
          valor_mensalidade,
          vencimento_dia,
          ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existente.id);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await supabaseServer
        .from("financeiro_alunos")
        .insert({
          academia_id: academiaId,
          aluno_id,
          valor_mensalidade,
          vencimento_dia,
          ativo,
        });

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar mensalidade" },
      { status: 400 }
    );
  }
}