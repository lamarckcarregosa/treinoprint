import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("academias")
      .select("id, nome, slug, logo_url, ativa")
      .order("nome", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      academias: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar academias" },
      { status: 400 }
    );
  }
}