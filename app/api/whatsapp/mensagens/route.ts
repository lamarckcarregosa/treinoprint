import { NextRequest, NextResponse } from "next/server";
import { marcarConversaComoLida } from "@/lib/db/whatsapp";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const conversaId = searchParams.get("conversa_id");

    if (!conversaId) {
      return NextResponse.json(
        { error: "conversa_id é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("whatsapp_mensagens")
      .select("*")
      .eq("conversa_id", conversaId)
      .eq("academia_id", academiaId)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await marcarConversaComoLida(conversaId);

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao listar mensagens" },
      { status: 400 }
    );
  }
}