import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, nome, plano, limite_alunos, ativa")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia) {
      return NextResponse.json(
        { error: academiaError?.message || "Academia não encontrada" },
        { status: 500 }
      );
    }

    const { count, error: countError } = await supabaseServer
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("academia_id", academiaId);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      plano: academia.plano || "",
      limite_alunos: academia.limite_alunos,
      total_alunos: count || 0,
      ativa: academia.ativa,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar resumo dos alunos" },
      { status: 400 }
    );
  }
}