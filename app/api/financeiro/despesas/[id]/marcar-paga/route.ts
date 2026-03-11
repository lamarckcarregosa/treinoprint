import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../../lib/supabase-server";
import { protegerApi } from "../../../../../../lib/protegerApi";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await protegerApi(req, "financeiro");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const { id } = await context.params;

    const { data, error } = await supabaseServer
      .from("financeiro_despesas")
      .update({
        status: "pago",
        data_pagamento: new Date().toISOString().slice(0, 10),
      })
      .eq("id", Number(id))
      .eq("academia_id", academiaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao marcar despesa como paga" },
      { status: 400 }
    );
  }
}