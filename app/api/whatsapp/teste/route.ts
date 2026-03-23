import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";
import { sendWhatsAppText } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    let telefone = String(body.telefone || "").trim();
    const tipo = String(body.tipo || "").trim();

    if (!telefone || !tipo) {
      return NextResponse.json(
        { error: "Telefone e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    // normalização inline
    telefone = telefone.replace(/\D/g, "");
    telefone = telefone.replace(/^0+/, "");

    if (!telefone.startsWith("55")) {
      telefone = "55" + telefone;
    }

    const local = telefone.slice(2);

    // se veio DDD + número sem o 9
    if (local.length === 10) {
      const ddd = local.slice(0, 2);
      const numeroSem9 = local.slice(2);
      telefone = "55" + ddd + "9" + numeroSem9;
    }

    if (telefone.length < 12 || telefone.length > 13) {
      return NextResponse.json(
        { error: "Telefone inválido. Informe com DDD." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("whatsapp_automacoes")
      .select("*")
      .eq("academia_id", academiaId)
      .eq("tipo", tipo)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar automação" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Automação não encontrada" },
        { status: 404 }
      );
    }

    let mensagem = String(data.template_mensagem || "").trim();

    if (!mensagem) {
      return NextResponse.json(
        { error: "Essa automação não possui template de mensagem" },
        { status: 400 }
      );
    }

    // variáveis de teste
    mensagem = mensagem
      .replaceAll("{nome}", "Lamarck")
      .replaceAll("{academia}", "Sua Academia");

    // usa a mesma função que já funciona no restante do sistema
    await sendWhatsAppText(telefone, mensagem);

    return NextResponse.json({
      ok: true,
      telefone_normalizado: telefone,
      mensagem_enviada: mensagem,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao testar mensagem" },
      { status: 400 }
    );
  }
}