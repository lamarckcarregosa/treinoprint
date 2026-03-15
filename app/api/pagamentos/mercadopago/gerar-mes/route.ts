import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { competencia, academia_id } = await req.json();

    const { data: pagamentos } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("*")
      .eq("academia_id", academia_id)
      .eq("competencia", competencia)
      .eq("status", "pendente")
      .is("link_pagamento", null);

    if (!pagamentos || pagamentos.length === 0) {
      return NextResponse.json({ total: 0 });
    }

    const { data: academia } = await supabaseServer
      .from("academias")
      .select("mp_access_token")
      .eq("id", academia_id)
      .single();

    if (!academia?.mp_access_token) {
      return NextResponse.json(
        { error: "Mercado Pago não conectado" },
        { status: 400 }
      );
    }

    let total = 0;

    for (const pagamento of pagamentos) {
      const mpRes = await fetch(
        "https://api.mercadopago.com/checkout/preferences",
        {
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
        }
      );

      const mpJson = await mpRes.json();

      if (!mpJson.id) continue;

      await supabaseServer
        .from("financeiro_pagamentos")
        .update({
          gateway: "mercado_pago",
          gateway_status: "pending",
          gateway_preference_id: mpJson.id,
          link_pagamento: mpJson.init_point,
        })
        .eq("id", pagamento.id);

      total++;
    }

    return NextResponse.json({
      total_gerado: total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar cobranças" },
      { status: 400 }
    );
  }
}