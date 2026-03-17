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

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const alunoId = searchParams.get("aluno_id");
    const ativo = searchParams.get("ativo");

    let query = supabaseServer
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
      .eq("academia_id", academiaId)
      .order("ordem", { ascending: true })
      .order("created_at", { ascending: false });

    if (alunoId) {
      query = query.eq("aluno_id", Number(alunoId));
    }

    if (ativo === "true") {
      query = query.eq("ativo", true);
    }

    if (ativo === "false") {
      query = query.eq("ativo", false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar treinos personalizados" },
        { status: 400 }
      );
    }

    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro inesperado ao carregar treinos" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const aluno_id = Number(body.aluno_id);

    if (!aluno_id || Number.isNaN(aluno_id)) {
      return NextResponse.json(
        { error: "aluno_id é obrigatório" },
        { status: 400 }
      );
    }

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

    const treinoInsert = {
      academia_id: academiaId,
      aluno_id,
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

    const { data: treino, error: treinoError } = await supabaseServer
      .from("treinos_personalizados")
      .insert(treinoInsert)
      .select()
      .single();

    if (treinoError || !treino) {
      return NextResponse.json(
        { error: treinoError?.message || "Erro ao criar treino personalizado" },
        { status: 400 }
      );
    }

    const itensInsert = itens.map((item, index) => ({
      treino_id: treino.id,
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
      await supabaseServer
        .from("treinos_personalizados")
        .delete()
        .eq("id", treino.id);

      return NextResponse.json(
        { error: itensError.message || "Erro ao salvar itens do treino" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      treino,
      itens: itensSalvos || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro inesperado ao criar treino" },
      { status: 500 }
    );
  }
}