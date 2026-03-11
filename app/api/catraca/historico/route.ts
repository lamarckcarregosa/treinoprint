import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "imprimir");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;

    const { data, error } = await supabaseServer
      .from("acessos_catraca")
      .select("id, aluno_id, aluno_nome, codigo_lido, status, motivo, origem, created_at")
      .eq("academia_id", academiaId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar histórico da catraca" },
      { status: 400 }
    );
  }
}