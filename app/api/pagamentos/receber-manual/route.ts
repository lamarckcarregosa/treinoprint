import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const pagamentoId = Number(body?.pagamento_id);
    const formaPagamento = String(body?.forma_pagamento || "").trim();

    const formasPermitidas = ["dinheiro", "cartao_maquina", "pix_manual"];

    if (!pagamentoId || Number.isNaN(pagamentoId)) {
      return NextResponse.json(
        { error: "Pagamento inválido" },
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

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        status: "pago",
        forma_pagamento: formaPagamento,
        data_pagamento: new Date().toISOString().slice(0, 10),

        gateway: null,
        gateway_status: null,
        gateway_payment_id: null,
        gateway_preference_id: null,
        gateway_external_reference: null,
        link_pagamento: null,
        data_confirmacao_gateway: null,
        payload_gateway: null,
      })
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
      { error: error.message || "Erro ao receber pagamento manual" },
      { status: 400 }
    );
  }
}