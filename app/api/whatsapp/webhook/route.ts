import { NextRequest, NextResponse } from "next/server";
import { processarMensagem } from "@/lib/chat/orchestrator";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge || "ok", { status: 200 });
  }

  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const value = body?.entry?.[0]?.changes?.[0]?.value;

    const status = value?.statuses?.[0];
    if (status) {
      console.log("Status WhatsApp:", status);
      return NextResponse.json({ ok: true });
    }

    const message = value?.messages?.[0];

    if (!message) {
      return NextResponse.json({ ok: true });
    }

    const telefone = message.from;
    const texto =
      message?.text?.body ||
      message?.button?.text ||
      message?.interactive?.button_reply?.title ||
      message?.interactive?.list_reply?.title ||
      "";

    console.log("Webhook recebeu mensagem de:", telefone);
    console.log("Texto recebido:", texto);

    if (!telefone || !texto) {
      return NextResponse.json({ ok: true });
    }

    try {
      await processarMensagem({ telefone, texto });
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook do WhatsApp:", error);
    return NextResponse.json({ ok: true });
  }
}