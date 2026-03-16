import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const busca = String(searchParams.get("busca") || "").trim();
    const somenteAtivos = searchParams.get("ativo");

    let query = supabaseServer
      .from("exercicios")
      .select("id, academia_id, nome, grupo_muscular, categoria, observacoes_padrao, ativo, created_at")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (somenteAtivos === "true") {
      query = query.eq("ativo", true);
    }

    if (busca) {
      query = query.ilike("nome", `%${busca}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar exercícios" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar exercícios" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const grupoMuscular = String(body?.grupo_muscular || "").trim() || null;
    const categoria = String(body?.categoria || "").trim() || null;
    const observacoesPadrao =
      String(body?.observacoes_padrao || "").trim() || null;
    const ativo = body?.ativo === false ? false : true;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do exercício é obrigatório" },
        { status: 400 }
      );
    }

    const { data: existente } = await supabaseServer
      .from("exercicios")
      .select("id")
      .eq("academia_id", academiaId)
      .ilike("nome", nome)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: "Já existe um exercício com esse nome" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("exercicios")
      .insert({
        academia_id: academiaId,
        nome,
        grupo_muscular: grupoMuscular,
        categoria,
        observacoes_padrao: observacoesPadrao,
        ativo,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao criar exercício" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      exercicio: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar exercício" },
      { status: 400 }
    );
  }
}