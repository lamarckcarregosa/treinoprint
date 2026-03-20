import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const avaliacaoId = Number(id);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    if (!avaliacaoId || Number.isNaN(avaliacaoId)) {
      return NextResponse.json(
        { error: "Avaliação inválida." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .select(`
        id,
        aluno_id,
        data_avaliacao,
        peso,
        altura,
        idade,
        percentual_gordura,
        massa_magra,
        massa_gorda,
        taxa_metabolica_basal,
        agua_corporal,
        gordura_visceral,
        peito,
        costas,
        cintura,
        abdomen,
        quadril,
        gluteo,
        braco_esquerdo,
        braco_direito,
        biceps_esquerdo,
        biceps_direito,
        triceps_esquerdo,
        triceps_direito,
        antebraco_esquerdo,
        antebraco_direito,
        pulso_esquerdo,
        pulso_direito,
        coxa_esquerda,
        coxa_direita,
        panturrilha_esquerda,
        panturrilha_direita,
        foto_frente,
        foto_lado,
        foto_costas,
        objetivo,
        created_at
      `)
      .eq("academia_id", academiaId)
      .eq("id", avaliacaoId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar avaliação" },
      { status: 500 }
    );
  }
}