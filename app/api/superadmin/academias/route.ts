import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from("academias")
      .select(
        "id, nome, slug, logo_url, plano, ativa, telefone, email, endereco, cnpj, limite_alunos, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar academias" },
      { status: 400 }
    );
  }
}