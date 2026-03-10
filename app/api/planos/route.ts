import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("planos")
      .select("id, nome, codigo, valor, tipo_cobranca, limite_alunos, ativo")
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar planos" },
      { status: 400 }
    );
  }
}