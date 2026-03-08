import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("personals")
      .select("id, nome, academia_id")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar personals" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const nome = String(body.nome || "").trim();

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do personal é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("personals")
      .insert([{ nome, academia_id: academiaId }])
      .select("id, nome, academia_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar personal" },
      { status: 400 }
    );
  }
}