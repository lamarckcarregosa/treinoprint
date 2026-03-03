import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // server only
);
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const semana = searchParams.get("semana") || "";
    const dia = searchParams.get("dia") || "";
    const nivel = searchParams.get("nivel") || "";
    const tipo = searchParams.get("tipo") || "";

    let query = supabase
      .from("treinos_modelos")
      .select("id, semana, dia, nivel, tipo, exercicios, created_at, updated_at");

    // ✅ aplica filtros SOMENTE se vierem na querystring
    if (semana) query = query.eq("semana", semana);
    if (dia) query = query.eq("dia", dia);
    if (nivel) query = query.eq("nivel", nivel);
    if (tipo) query = query.eq("tipo", tipo);

    // opcional: ordenar para pegar o mais recente primeiro (se você quiser)
    const { data, error } = await query.order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: "Erro inesperado" }, { status: 500 });
  }
}