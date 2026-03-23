import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("whatsapp_automacoes")
      .select("*")
      .eq("academia_id", academiaId)
      .order("tipo", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar automações" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const { id, ativo, template_mensagem } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id da automação é obrigatório" },
        { status: 400 }
      );
    }

    const payload: Record<string, any> = {};
    if (typeof ativo === "boolean") payload.ativo = ativo;
    if (typeof template_mensagem === "string") {
      payload.template_mensagem = template_mensagem.trim() || null;
    }

    const { data, error } = await supabaseServer
      .from("whatsapp_automacoes")
      .update(payload)
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar automação" },
      { status: 400 }
    );
  }
}