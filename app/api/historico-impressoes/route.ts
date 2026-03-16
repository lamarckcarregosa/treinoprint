import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("historico_impressoes")
      .select("*")
      .eq("academia_id", academiaId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar histórico de impressões" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar histórico de impressões" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const alunoId =
      body?.aluno_id !== undefined &&
      body?.aluno_id !== null &&
      String(body.aluno_id).trim() !== ""
        ? Number(body.aluno_id)
        : null;

    const alunoNome = String(body?.aluno_nome || "").trim();
    const personalNome = String(body?.personal_nome || "").trim() || null;
    const semana = String(body?.semana || "").trim() || null;
    const dia = String(body?.dia || "").trim() || null;
    const nivel = String(body?.nivel || "").trim() || null;
    const tipo = String(body?.tipo || "").trim() || null;
    const origem = String(body?.origem || "padrao").trim() || "padrao";
    const codigoTreino = String(body?.codigo_treino || "").trim() || null;
    const exercicios = Array.isArray(body?.exercicios) ? body.exercicios : [];
    const userId =
      body?.user_id !== undefined && body?.user_id !== null
        ? String(body.user_id)
        : null;

    if (!alunoNome) {
      return NextResponse.json(
        { error: "Aluno não informado" },
        { status: 400 }
      );
    }

    if (!Array.isArray(exercicios) || exercicios.length === 0) {
      return NextResponse.json(
        { error: "Nenhum exercício informado" },
        { status: 400 }
      );
    }

    const payload: any = {
      academia_id: academiaId,
      aluno_nome: alunoNome,
      personal_nome: personalNome,
      semana,
      dia,
      nivel,
      tipo,
      origem,
      exercicios,
    };

    // só adiciona se a coluna existir no seu banco
    if (alunoId && !Number.isNaN(alunoId)) {
      payload.aluno_id = alunoId;
    }

    // só adiciona se a coluna existir no seu banco
    if (codigoTreino) {
      payload.codigo_treino = codigoTreino;
    }

    // só adiciona se a coluna existir no seu banco
    if (userId) {
      payload.user_id = userId;
    }

    const { data, error } = await supabaseServer
      .from("historico_impressoes")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao salvar histórico de impressão" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      historico: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar histórico de impressão" },
      { status: 400 }
    );
  }
}