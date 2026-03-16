import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const alunoId = Number(searchParams.get("aluno_id") || 0);
    const codigoTreino = String(searchParams.get("codigo_treino") || "").trim();
    const diaSemana = String(searchParams.get("dia_semana") || "").trim();

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno inválido" },
        { status: 400 }
      );
    }

    let query = supabaseServer
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
      .eq("aluno_id", alunoId)
      .eq("ativo", true);

    if (codigoTreino) {
      query = query.eq("codigo_treino", codigoTreino);
    }

    if (diaSemana) {
      query = query.eq("dia_semana", diaSemana);
    }

    query = query
      .order("ordem", { ascending: true })
      .order("updated_at", { ascending: false })
      .limit(1);

    const { data, error } = await query.maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar treino personalizado" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(null);
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
      .eq("treino_id", data.id)
      .order("ordem", { ascending: true });

    if (itensError) {
      return NextResponse.json(
        { error: itensError.message || "Erro ao buscar itens do treino" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...data,
      itens: (itens || []).map((item: any) => ({
        id: item.id,
        exercicio_id: item.exercicio_id,
        nome: item.nome_exercicio_snapshot,
        series: item.series || "",
        repeticoes: item.repeticoes || "",
        carga: item.carga || "",
        descanso: item.descanso || "",
        obs: item.observacoes || "",
        ordem: item.ordem || 0,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar treino personalizado" },
      { status: 400 }
    );
  }
}