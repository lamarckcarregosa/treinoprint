import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const body = await req.json();

    const aluno_id = Number(body.aluno_id);
    const valor = Number(body.valor_mensalidade || 0);
    const vencimento = Number(body.vencimento_dia || 10);
    const ativo = Boolean(body.ativo);
    const tipo_cobranca = body.tipo_cobranca || "mensal";

    if (!aluno_id) {
      return NextResponse.json(
        { error: "Aluno inválido" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("financeiro_alunos")
      .upsert(
        {
          academia_id: academiaId,
          aluno_id,
          valor_mensalidade: valor,
          vencimento_dia: vencimento,
          ativo,
          tipo_cobranca,
        },
        {
          onConflict: "aluno_id",
        }
      );

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar financeiro do aluno" },
      { status: 400 }
    );
  }
}