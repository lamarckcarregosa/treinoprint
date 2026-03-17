import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

type ItemPayload = {
  exercicio_id?: number | null;
  nome_exercicio_snapshot?: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
  ordem?: number;
};

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { data: treino, error: treinoError } = await supabaseServer
      .from("treinos_personalizados")
      .select(`
        id,
        aluno_id,
        personal_nome,
        titulo,
        objetivo,
        observacoes,
        codigo_treino,
        dia_semana,
        ordem,
        ativo,
        nivel,
        divisao,
        frequencia_semana,
        origem_geracao,
        semana_periodizacao,
        created_at,
        updated_at
      `)
      .eq("id", treinoId)
      .eq("academia_id", academiaId)
      .single();

    if (treinoError || !treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    const { data: itens, error: itensError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .select(`
        id,
        treino_id,
        exercicio_id,
        nome_exercicio_snapshot,
        series,
        repeticoes,
        carga,
        descanso,
        observacoes,
        ordem
      `)
      .eq("treino_id", treinoId)
      .order("ordem", { ascending: true });

    if (itensError) {
      return NextResponse.json(
        { error: itensError.message || "Erro ao carregar itens do treino" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ...treino,
      itens: Array.isArray(itens) ? itens : [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro inesperado ao carregar treino" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body = await req.json();
    const itens: ItemPayload[] = Array.isArray(body.itens) ? body.itens : [];

    if (itens.length === 0) {
      return NextResponse.json(
        { error: "Informe pelo menos um exercício" },
        { status: 400 }
      );
    }

    const itemSemNome = itens.find(
      (item) => !String(item.nome_exercicio_snapshot || "").trim()
    );

    if (itemSemNome) {
      return NextResponse.json(
        { error: "Todos os itens precisam ter nome_exercicio_snapshot" },
        { status: 400 }
      );
    }

    const { data: treinoExistente, error: treinoExistenteError } =
      await supabaseServer
        .from("treinos_personalizados")
        .select("id")
        .eq("id", treinoId)
        .eq("academia_id", academiaId)
        .single();

    if (treinoExistenteError || !treinoExistente) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    const updatePayload = {
      personal_nome: body.personal_nome || null,
      titulo: body.titulo || null,
      objetivo: body.objetivo || null,
      observacoes: body.observacoes || null,
      codigo_treino: body.codigo_treino || null,
      dia_semana: body.dia_semana || null,
      ordem: Number(body.ordem || 0),
      ativo: body.ativo !== false,

      nivel: body.nivel || null,
      divisao: body.divisao || null,
      frequencia_semana: body.frequencia_semana
        ? Number(body.frequencia_semana)
        : null,
      origem_geracao: body.origem_geracao || null,
      semana_periodizacao: body.semana_periodizacao
        ? Number(body.semana_periodizacao)
        : null,
    };

    const { data: treinoAtualizado, error: updateError } = await supabaseServer
      .from("treinos_personalizados")
      .update(updatePayload)
      .eq("id", treinoId)
      .eq("academia_id", academiaId)
      .select()
      .single();

    if (updateError || !treinoAtualizado) {
      return NextResponse.json(
        { error: updateError?.message || "Erro ao atualizar treino" },
        { status: 400 }
      );
    }

    const { error: deleteItensError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .delete()
      .eq("treino_id", treinoId);

    if (deleteItensError) {
      return NextResponse.json(
        { error: deleteItensError.message || "Erro ao limpar itens antigos" },
        { status: 400 }
      );
    }

    const itensInsert = itens.map((item, index) => ({
      treino_id: treinoId,
      exercicio_id: item.exercicio_id ? Number(item.exercicio_id) : null,
      nome_exercicio_snapshot: String(item.nome_exercicio_snapshot || "").trim(),
      series: item.series || "",
      repeticoes: item.repeticoes || "",
      carga: item.carga || "",
      descanso: item.descanso || "",
      observacoes: item.observacoes || "",
      ordem: Number(item.ordem || index + 1),
    }));

    const { data: itensSalvos, error: itensError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .insert(itensInsert)
      .select();

    if (itensError) {
      return NextResponse.json(
        { error: itensError.message || "Erro ao salvar itens do treino" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      treino: treinoAtualizado,
      itens: itensSalvos || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro inesperado ao atualizar treino" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { data: treino, error: treinoError } = await supabaseServer
      .from("treinos_personalizados")
      .select("id")
      .eq("id", treinoId)
      .eq("academia_id", academiaId)
      .single();

    if (treinoError || !treino) {
      return NextResponse.json(
        { error: "Treino não encontrado" },
        { status: 404 }
      );
    }

    const { error: itensError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .delete()
      .eq("treino_id", treinoId);

    if (itensError) {
      return NextResponse.json(
        { error: itensError.message || "Erro ao excluir itens do treino" },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabaseServer
      .from("treinos_personalizados")
      .delete()
      .eq("id", treinoId)
      .eq("academia_id", academiaId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Erro ao excluir treino" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro inesperado ao excluir treino" },
      { status: 500 }
    );
  }
}