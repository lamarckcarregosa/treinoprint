import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("academias")
      .select("id, nome, slug, logo_url")
      .eq("id", academiaId)
      .single();

    if (error) {
      console.error("Erro /api/minha-academia:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro /api/minha-academia:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao buscar academia" },
      { status: 400 }
    );
  }
}