import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não informada" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("academias")
      .select("id, nome, logo_url, telefone, cnpj")
      .eq("id", academiaId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Academia não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar academia" },
      { status: 400 }
    );
  }
}