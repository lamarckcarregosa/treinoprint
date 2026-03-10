import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const profileId = req.headers.get("x-profile-id");

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile não informado" },
        { status: 400 }
      );
    }

    // superadmin não precisa de permissões customizadas
    const { data: profile } = await supabaseServer
      .from("profiles")
      .select("tipo")
      .eq("id", profileId)
      .single();

    if (profile?.tipo === "superadmin") {
      return NextResponse.json(null);
    }

    if (!academiaId) {
      return NextResponse.json(null);
    }

    const { data, error } = await supabaseServer
      .from("permissoes_usuarios")
      .select(`
        dashboard,
        alunos,
        personais,
        treinos,
        imprimir,
        pagamentos,
        financeiro,
        sistema,
        alterar_senha,
        superadmin
      `)
      .eq("profile_id", profileId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || null);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar permissões" },
      { status: 400 }
    );
  }
}