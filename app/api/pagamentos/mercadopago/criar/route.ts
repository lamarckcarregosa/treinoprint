import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();
    const pagamentoId = Number(body.pagamento_id);

    if (!pagamentoId) {
      return NextResponse.json({ error: "Pagamento inválido" }, { status: 400 });
    }

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, nome, mp_connected, mp_access_token")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia?.mp_access_token) {
      return NextResponse.json(
        { error: "Mercado Pago não conectado para esta academia" },
        { status: 400 }
      );
    }

    const { data: pagamento, error: pagamentoError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, aluno_id, competencia, valor, vencimento, status")
      .eq("academia_id", academiaId)
      .eq("id", pagamentoId)
      .single();

    if (pagamentoError || !pagamento) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 });
    }

    const { data: aluno } = await supabaseServer
      .from("alunos")
      .select("id, nome")
      .eq("academia_id", academiaId)
      .eq("id", pagamento.aluno_id)
      .single();

    const externalReference = `${academiaId}|${pagamento.id}|${pagamento.aluno_id}`;

    const preferenceRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${academia.mp_access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            title: `Mensalidade ${pagamento.competencia} - ${academia.nome}`,
            quantity: 1,
            currency_id: "BRL",
            unit_price: Number(pagamento.valor || 0),
          },
        ],
        payer: {
          name: aluno?.nome || "Aluno",
        },
        external_reference: externalReference,
        notification_url: `${process.env.APP_BASE_URL}/api/pagamentos/mercadopago/webhook?academia_id=${academiaId}`,
        back_urls: {
          success: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=success`,
          failure: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=failure`,
          pending: `${process.env.APP_BASE_URL}/app-aluno/financeiro?status=pending`,
        },
        auto_return: "approved",
      }),
    });

    const preferenceJson = await preferenceRes.json();

    if (!preferenceRes.ok) {
      return NextResponse.json(
        { error: preferenceJson.message || "Erro ao criar cobrança Mercado Pago" },
        { status: 500 }
      );
    }

    const { error: updateError } = await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        gateway: "mercado_pago",
        gateway_status: "pending",
        gateway_preference_id: preferenceJson.id || null,
        gateway_external_reference: externalReference,
        link_pagamento: preferenceJson.init_point || null,
      })
      .eq("academia_id", academiaId)
      .eq("id", pagamentoId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      preference_id: preferenceJson.id,
      init_point: preferenceJson.init_point,
      sandbox_init_point: preferenceJson.sandbox_init_point,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar cobrança" },
      { status: 400 }
    );
  }
}