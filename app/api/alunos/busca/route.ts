import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const q = String(searchParams.get("q") || "").trim();
    const exact = String(searchParams.get("exact") || "") === "1";

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    if (!q) {
      return NextResponse.json([]);
    }

    let query = supabaseServer
      .from("alunos")
      .select("id, nome")
      .eq("academia_id", academiaId)
      .limit(20);

    if (exact && /^\d+$/.test(q)) {
      query = query.eq("id", Number(q));
    } else {
      query = query.ilike("nome", `%${q}%`).order("nome");
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}