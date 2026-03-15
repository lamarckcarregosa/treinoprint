import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const topic = body.type || body.topic;
    const paymentId = body.data?.id || body.id;

    if (!paymentId) {
      return NextResponse.json({ ok: true });
    }

    if (topic && topic !== "payment") {
      return NextResponse.json({ ok: true });
    }

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, mp_access_token")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia?.mp_access_token) {
      return NextResponse.json({ ok: true });
    }

    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${academia.mp_access_token}`,
      },
    });

    const paymentJson = await paymentRes.json();

    if (!paymentRes.ok) {
      return NextResponse.json({ ok: true });
    }

    const externalReference = String(paymentJson.external_reference || "");
    const parts = externalReference.split("|");
    const pagamentoId = Number(parts[1] || 0);

    if (!pagamentoId) {
      return NextResponse.json({ ok: true });
    }

    const status = String(paymentJson.status || "").toLowerCase();
    const approved = status === "approved";

    const formaPagamento = paymentJson.payment_type_id === "bank_transfer"
      ? "mercado_pago_pix"
      : paymentJson.payment_type_id === "credit_card" || paymentJson.payment_type_id === "debit_card"
      ? "mercado_pago_cartao"
      : paymentJson.payment_type_id === "ticket"
      ? "mercado_pago_boleto"
      : "mercado_pago";

    await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        status: approved ? "pago" : "pendente",
        forma_pagamento: approved ? formaPagamento : null,
        data_pagamento: approved ? new Date().toISOString().slice(0, 10) : null,
        gateway: "mercado_pago",
        gateway_status: status,
        gateway_payment_id: String(paymentJson.id || ""),
        data_confirmacao_gateway: approved ? new Date().toISOString() : null,
        payload_gateway: paymentJson,
      })
      .eq("academia_id", academiaId)
      .eq("id", pagamentoId);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}