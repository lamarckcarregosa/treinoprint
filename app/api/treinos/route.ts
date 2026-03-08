import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const semana = searchParams.get("semana");
    const dia = searchParams.get("dia");
    const nivel = searchParams.get("nivel");
    const tipo = searchParams.get("tipo");

    let query = supabaseServer
      .from("treinos_modelos")
      .select("*")
      .eq("academia_id", academiaId);

    if (semana) query = query.eq("semana", semana);
    if (dia) query = query.eq("dia", dia);
    if (nivel) query = query.eq("nivel", nivel);
    if (tipo) query = query.eq("tipo", tipo);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar treinos" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const semana = String(body.semana || "").trim();
    const dia = String(body.dia || "").trim();
    const nivel = String(body.nivel || "").trim();
    const tipo = String(body.tipo || "").trim();
    const exercicios = Array.isArray(body.exercicios) ? body.exercicios : [];

    if (!semana || !dia || !nivel || !tipo) {
      return NextResponse.json(
        { error: "Semana, dia, nível e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("treinos_modelos")
      .insert([
        {
          academia_id: academiaId,
          semana,
          dia,
          nivel,
          tipo,
          exercicios,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar treino" },
      { status: 400 }
    );
  }
}