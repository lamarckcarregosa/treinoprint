import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type ItemTreinoPayload = {
  exercicio_id?: number | null;
  nome?: string;
  nome_exercicio_snapshot?: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  descanso?: string;
  observacoes?: string;
  ordem?: number;
};

async function obterOuCriarExercicio({
  academiaId,
  nome,
}: {
  academiaId: string;
  nome: string;
}) {
  const nomeLimpo = String(nome || "").replace(/\s+/g, " ").trim();

  if (!nomeLimpo) {
    throw new Error("Nome do exercício não informado");
  }

  const { data: lista, error: buscaError } = await supabaseServer
    .from("exercicios")
    .select("id, nome")
    .eq("academia_id", academiaId);

  if (buscaError) {
    throw new Error(buscaError.message || "Erro ao buscar exercício");
  }

  const existente = (lista || []).find(
    (item: any) =>
      String(item.nome || "").replace(/\s+/g, " ").trim().toLowerCase() ===
      nomeLimpo.toLowerCase()
  );

  if (existente?.id) {
    return Number(existente.id);
  }

  const { data: criado, error: insertError } = await supabaseServer
    .from("exercicios")
    .insert({
      academia_id: academiaId,
      nome: nomeLimpo,
    })
    .select("id")
    .single();

  if (insertError || !criado?.id) {
    throw new Error(
      insertError?.message || "Erro ao criar exercício na biblioteca"
    );
  }

  return Number(criado.id);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "Treino inválido" }, { status: 400 });
    }

    const { data: treino, error: treinoError } = await supabaseServer
      .from("treinos_personalizados")
      .select(`
        id,
        academia_id,
        aluno_id,
        personal_id,
        personal_nome,
        titulo,
        objetivo,
        observacoes,
        codigo_treino,
        dia_semana,
        ordem,
        ativo,
        created_at,
        updated_at
      `)
      .eq("academia_id", academiaId)
      .eq("id", treinoId)
      .single();

    if (treinoError || !treino) {
      return NextResponse.json(
        { error: treinoError?.message || "Treino não encontrado" },
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
        ordem,
        created_at
      `)
      .eq("treino_id", treinoId)
      .order("ordem", { ascending: true });

    if (itensError) {
      return NextResponse.json(
        { error: itensError.message || "Erro ao carregar itens do treino" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...treino,
      itens: itens || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar treino personalizado" },
      { status: 400 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const treinoId = Number(id);
    const body = await req.json();

    const alunoId = Number(body?.aluno_id);
    const personalId = body?.personal_id ? Number(body.personal_id) : null;
    const personalNome = String(body?.personal_nome || "").trim() || null;
    const titulo = String(body?.titulo || "").trim() || null;
    const objetivo = String(body?.objetivo || "").trim() || null;
    const observacoes = String(body?.observacoes || "").trim() || null;
    const codigoTreino = String(body?.codigo_treino || "").trim() || null;
    const diaSemana = String(body?.dia_semana || "").trim() || null;
    const ordem = Number(body?.ordem || 0);
    const ativo = body?.ativo === false ? false : true;
    const itens = Array.isArray(body?.itens)
      ? (body.itens as ItemTreinoPayload[])
      : [];

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "Treino inválido" }, { status: 400 });
    }

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json({ error: "Aluno inválido" }, { status: 400 });
    }

    if (itens.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um exercício ao treino" },
        { status: 400 }
      );
    }

    const { data: treinoAtual, error: treinoAtualError } = await supabaseServer
      .from("treinos_personalizados")
      .select("id")
      .eq("academia_id", academiaId)
      .eq("id", treinoId)
      .single();

    if (treinoAtualError || !treinoAtual) {
      return NextResponse.json(
        { error: treinoAtualError?.message || "Treino não encontrado" },
        { status: 404 }
      );
    }

    const { data: treino, error: treinoError } = await supabaseServer
      .from("treinos_personalizados")
      .update({
        aluno_id: alunoId,
        personal_id: personalId,
        personal_nome: personalNome,
        titulo,
        objetivo,
        observacoes,
        codigo_treino: codigoTreino,
        dia_semana: diaSemana,
        ordem,
        ativo,
        updated_at: new Date().toISOString(),
      })
      .eq("academia_id", academiaId)
      .eq("id", treinoId)
      .select()
      .single();

    if (treinoError || !treino) {
      return NextResponse.json(
        { error: treinoError?.message || "Erro ao atualizar treino" },
        { status: 500 }
      );
    }

    const itensPayload = [];

    for (let index = 0; index < itens.length; index++) {
      const item = itens[index];

      const nomeExercicio = String(
        item.nome_exercicio_snapshot || item.nome || ""
      )
        .replace(/\s+/g, " ")
        .trim();

      if (!nomeExercicio) {
        return NextResponse.json(
          { error: `O exercício da linha ${index + 1} está sem nome` },
          { status: 400 }
        );
      }

      let exercicioId = item.exercicio_id ? Number(item.exercicio_id) : null;

      if (!exercicioId || Number.isNaN(exercicioId)) {
        exercicioId = await obterOuCriarExercicio({
          academiaId,
          nome: nomeExercicio,
        });
      }

      if (!exercicioId || Number.isNaN(exercicioId)) {
        return NextResponse.json(
          {
            error: `Não foi possível gerar o exercício_id para "${nomeExercicio}"`,
          },
          { status: 400 }
        );
      }

      itensPayload.push({
        treino_id: treinoId,
        exercicio_id: exercicioId,
        nome_exercicio_snapshot: nomeExercicio,
        series: String(item.series || "").trim() || null,
        repeticoes: String(item.repeticoes || "").trim() || null,
        carga: String(item.carga || "").trim() || null,
        descanso: String(item.descanso || "").trim() || null,
        observacoes: String(item.observacoes || "").trim() || null,
        ordem: Number(item.ordem ?? index + 1),
      });
    }

    const { error: deleteError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .delete()
      .eq("treino_id", treinoId);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message || "Erro ao atualizar itens do treino" },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabaseServer
      .from("treinos_personalizados_itens")
      .insert(itensPayload);

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message || "Erro ao salvar itens do treino" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      id: treinoId,
      treino,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar treino personalizado" },
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
    const treinoId = Number(id);

    if (!treinoId || Number.isNaN(treinoId)) {
      return NextResponse.json({ error: "Treino inválido" }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from("treinos_personalizados")
      .delete()
      .eq("academia_id", academiaId)
      .eq("id", treinoId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao excluir treino personalizado" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir treino personalizado" },
      { status: 400 }
    );
  }
}