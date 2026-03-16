import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();
    const { id } = await context.params;

    const exercicioId = Number(id);
    const nome = String(body?.nome || "").trim();
    const grupoMuscular = String(body?.grupo_muscular || "").trim() || null;
    const categoria = String(body?.categoria || "").trim() || null;
    const observacoesPadrao =
      String(body?.observacoes_padrao || "").trim() || null;
    const ativo = body?.ativo === false ? false : true;

    if (!exercicioId || Number.isNaN(exercicioId)) {
      return NextResponse.json(
        { error: "Exercício inválido" },
        { status: 400 }
      );
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do exercício é obrigatório" },
        { status: 400 }
      );
    }

    const { data: atual } = await supabaseServer
      .from("exercicios")
      .select("id")
      .eq("academia_id", academiaId)
      .eq("id", exercicioId)
      .maybeSingle();

    if (!atual) {
      return NextResponse.json(
        { error: "Exercício não encontrado" },
        { status: 404 }
      );
    }

    const { data, error } = await supabaseServer
      .from("exercicios")
      .update({
        nome,
        grupo_muscular: grupoMuscular,
        categoria,
        observacoes_padrao: observacoesPadrao,
        ativo,
      })
      .eq("academia_id", academiaId)
      .eq("id", exercicioId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao atualizar exercício" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      exercicio: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar exercício" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;

    const exercicioId = Number(id);

    if (!exercicioId || Number.isNaN(exercicioId)) {
      return NextResponse.json(
        { error: "Exercício inválido" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("exercicios")
      .delete()
      .eq("academia_id", academiaId)
      .eq("id", exercicioId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao excluir exercício" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir exercício" },
      { status: 400 }
    );
  }
}