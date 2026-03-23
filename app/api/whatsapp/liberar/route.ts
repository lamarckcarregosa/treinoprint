import { NextRequest, NextResponse } from "next/server";
import { liberarAtendimento } from "@/lib/db/whatsapp";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const { conversa_id, responsavel_id } = body;

    if (!conversa_id || !responsavel_id) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const { data: conversa, error: conversaError } = await supabaseServer
      .from("whatsapp_conversas")
      .select("id, academia_id, responsavel_id")
      .eq("id", conversa_id)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (conversaError) {
      return NextResponse.json(
        { error: conversaError.message },
        { status: 500 }
      );
    }

    if (!conversa) {
      return NextResponse.json(
        { error: "Conversa não encontrada para esta academia" },
        { status: 404 }
      );
    }

    if (conversa.responsavel_id && conversa.responsavel_id !== responsavel_id) {
      return NextResponse.json(
        { error: "Você não pode liberar uma conversa atribuída a outro atendente" },
        { status: 403 }
      );
    }

    await liberarAtendimento(conversa_id);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao liberar atendimento" },
      { status: 400 }
    );
  }
}