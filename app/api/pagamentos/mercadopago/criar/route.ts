import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const pagamentoId = body.pagamento_id;

    if (!pagamentoId) {
      return NextResponse.json({ error: "Pagamento não informado" }, { status: 400 });
    }

    const { data: pagamento } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("*")
      .eq("id", pagamentoId)
      .single();

    if (!pagamento) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    const { data: academia } = await supabaseServer
      .from("academias")
      .select("mp_access_token")
      .eq("id", pagamento.academia_id)
      .single();

    if (!academia?.mp_access_token) {
      return NextResponse.json({ error: "Mercado Pago não conectado" }, { status: 400 });
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${academia.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Mensalidade ${pagamento.competencia}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(pagamento.valor),
          },
        ],
        external_reference: String(pagamento.id),
      }),
    });

    const mpJson = await mpRes.json();

    await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        gateway: "mercado_pago",
        gateway_status: "pending",
        gateway_preference_id: mpJson.id,
        link_pagamento: mpJson.init_point,
      })
      .eq("id", pagamentoId);

    return NextResponse.json({
      ok: true,
      link: mpJson.init_point,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar cobrança" },
      { status: 400 }
    );
  }
}