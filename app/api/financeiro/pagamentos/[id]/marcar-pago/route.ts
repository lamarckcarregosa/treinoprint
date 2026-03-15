import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../../lib/getAcademiaIdFromRequest";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const body = await req.json();

    const pagamentoId = Number(id);
    const formaPagamento = String(body?.forma_pagamento || "").trim();

    const formasPermitidas = [
      "dinheiro",
      "cartao_maquina",
      "pix_manual",
      "pix",
      "cartao",
      "boleto",
      "mercado_pago_pix",
      "mercado_pago_cartao",
      "mercado_pago_boleto",
    ];

    if (!pagamentoId || Number.isNaN(pagamentoId)) {
      return NextResponse.json(
        { error: "ID do pagamento inválido" },
        { status: 400 }
      );
    }

    if (!formaPagamento) {
      return NextResponse.json(
        { error: "Forma de pagamento não informada" },
        { status: 400 }
      );
    }

    if (!formasPermitidas.includes(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida" },
        { status: 400 }
      );
    }

    const { data: pagamento, error: pagamentoError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, status, gateway")
      .eq("academia_id", academiaId)
      .eq("id", pagamentoId)
      .single();

    if (pagamentoError || !pagamento) {
      return NextResponse.json(
        { error: pagamentoError?.message || "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    const pagamentoManual = [
      "dinheiro",
      "cartao_maquina",
      "pix_manual",
      "pix",
      "cartao",
      "boleto",
    ].includes(formaPagamento);

    const payload: Record<string, any> = {
      status: "pago",
      forma_pagamento: formaPagamento,
      data_pagamento: new Date().toISOString().slice(0, 10),
    };

    if (pagamentoManual) {
      payload.gateway = null;
      payload.gateway_status = null;
      payload.gateway_payment_id = null;
      payload.gateway_preference_id = null;
      payload.gateway_external_reference = null;
      payload.link_pagamento = null;
      payload.data_confirmacao_gateway = null;
      payload.payload_gateway = null;
    }

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .update(payload)
      .eq("academia_id", academiaId)
      .eq("id", pagamentoId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      pagamento: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao marcar pagamento como pago" },
      { status: 400 }
    );
  }
}