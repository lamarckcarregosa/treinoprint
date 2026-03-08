import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("academias")
      .select("id, nome, slug")
      .order("nome", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Erro ao buscar academias", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ academias: data || [] });
  } catch {
    return NextResponse.json(
      { error: "Erro interno ao buscar academias" },
      { status: 500 }
    );
  }
}