import { NextRequest, NextResponse } from "next/server";
import { enviarMensagemManual } from "@/lib/db/whatsapp";
import { sendWhatsAppText } from "@/lib/whatsapp";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const {
      conversa_id,
      aluno_id,
      telefone,
      mensagem,
      responsavel_id,
      responsavel_nome,
      usuario_tipo,
    } = body;

    if (
      !conversa_id ||
      !telefone ||
      !mensagem ||
      !responsavel_id ||
      !responsavel_nome
    ) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    const { data: conversa, error: conversaError } = await supabaseServer
      .from("whatsapp_conversas")
      .select("id, academia_id, setor, responsavel_id")
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
        { error: "Esta conversa está atribuída a outro atendente" },
        { status: 403 }
      );
    }

    const origem =
      usuario_tipo === "personal" || conversa.setor === "professor"
        ? "professor"
        : "recepcao";

    await sendWhatsAppText(telefone, mensagem);

    await enviarMensagemManual({
      conversaId: conversa_id,
      academiaId,
      alunoId: aluno_id || null,
      telefone,
      mensagem,
      origem,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao responder mensagem" },
      { status: 400 }
    );
  }
}