import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { protegerApi } from "@/lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "alunos");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;

    const { data, error } = await supabaseServer
      .from("alunos")
      .select("*")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar alunos" },
      { status: 400 }
    );
  }
}