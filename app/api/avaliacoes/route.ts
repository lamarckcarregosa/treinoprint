import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada" },
        { status: 400 }
      );
    }

    const { data: avaliacoes, error: avaliacoesError } = await supabaseServer
      .from("avaliacoes_fisicas")
      .select(`
        id,
        academia_id,
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
        observacoes,
        created_at,
        updated_at
      `)
      .eq("academia_id", academiaId)
      .order("data_avaliacao", { ascending: false });

    if (avaliacoesError) throw avaliacoesError;

    const alunoIds = Array.from(
      new Set((avaliacoes || []).map((item) => item.aluno_id).filter(Boolean))
    );

    let alunosMap = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos, error: alunosError } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      if (alunosError) throw alunosError;

      alunosMap = new Map(
        (alunos || []).map((aluno) => [Number(aluno.id), aluno.nome || "Aluno"])
      );
    }

    const lista = (avaliacoes || []).map((item) => ({
      ...item,
      aluno_nome: alunosMap.get(Number(item.aluno_id)) || `Aluno #${item.aluno_id}`,
    }));

    return NextResponse.json(lista);
  } catch (error: any) {
    console.error("Erro em /api/avaliacoes:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao buscar avaliações" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload = {
      academia_id: academiaId,
      aluno_id: body.aluno_id ?? null,
      data_avaliacao: body.data_avaliacao ?? null,
      peso: body.peso ?? null,
      altura: body.altura ?? null,
      idade: body.idade ?? null,
      percentual_gordura: body.percentual_gordura ?? null,
      massa_magra: body.massa_magra ?? null,
      massa_gorda: body.massa_gorda ?? null,
      taxa_metabolica_basal: body.taxa_metabolica_basal ?? null,
      agua_corporal: body.agua_corporal ?? null,
      gordura_visceral: body.gordura_visceral ?? null,
      peito: body.peito ?? null,
      costas: body.costas ?? null,
      cintura: body.cintura ?? null,
      abdomen: body.abdomen ?? null,
      quadril: body.quadril ?? null,
      gluteo: body.gluteo ?? null,
      braco_esquerdo: body.braco_esquerdo ?? null,
      braco_direito: body.braco_direito ?? null,
      biceps_esquerdo: body.biceps_esquerdo ?? null,
      biceps_direito: body.biceps_direito ?? null,
      triceps_esquerdo: body.triceps_esquerdo ?? null,
      triceps_direito: body.triceps_direito ?? null,
      antebraco_esquerdo: body.antebraco_esquerdo ?? null,
      antebraco_direito: body.antebraco_direito ?? null,
      pulso_esquerdo: body.pulso_esquerdo ?? null,
      pulso_direito: body.pulso_direito ?? null,
      coxa_esquerda: body.coxa_esquerda ?? null,
      coxa_direita: body.coxa_direita ?? null,
      panturrilha_esquerda: body.panturrilha_esquerda ?? null,
      panturrilha_direita: body.panturrilha_direita ?? null,
      foto_frente: body.foto_frente ?? null,
      foto_lado: body.foto_lado ?? null,
      foto_costas: body.foto_costas ?? null,
      objetivo: body.objetivo ?? null,
      observacoes: body.observacoes ?? null,
    };

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro ao salvar avaliação:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao salvar avaliação" },
      { status: 500 }
    );
  }
}