import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const formaPagamento = String(body.forma_pagamento || "pix").trim().toLowerCase();

    const formasValidas = ["pix", "cartao", "dinheiro", "boleto"];
    if (!formasValidas.includes(formaPagamento)) {
      return NextResponse.json(
        { error: "Forma de pagamento inválida" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        status: "pago",
        data_pagamento: new Date().toISOString().slice(0, 10),
        forma_pagamento: formaPagamento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao marcar pagamento como pago" },
      { status: 400 }
    );
  }
}