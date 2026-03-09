import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {

  const academiaId = getAcademiaIdFromRequest(req);

  const { data: resumo } = await supabaseServer
    .from("dashboard_financeiro")
    .select("*")
    .eq("academia_id", academiaId)
    .single();

  if (!resumo) {
    return NextResponse.json(
      { error: "Resumo não encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(resumo);
}