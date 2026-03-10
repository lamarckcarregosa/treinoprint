import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../../lib/supabase-server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const ativa = Boolean(body.ativa);

    const { data, error } = await supabaseServer
      .from("academias")
      .update({ ativa })
      .eq("id", id)
      .select("id, nome, ativa")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar status da academia" },
      { status: 400 }
    );
  }
}