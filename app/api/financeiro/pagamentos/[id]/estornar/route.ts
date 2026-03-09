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

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .update({
        status: "pendente",
        data_pagamento: null,
        forma_pagamento: null,
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
      { error: error.message || "Erro ao estornar pagamento" },
      { status: 400 }
    );
  }
}