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

    const { data, error } = await supabaseServer
      .from("permissoes_usuarios")
      .select(
        "dashboard, alunos, personais, treinos, imprimir, pagamentos, financeiro, sistema, superadmin, alterar_senha, avaliacoes"
      )
      .eq("profile_id", profileId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data || {
        dashboard: false,
        alunos: false,
        personais: false,
        treinos: false,
        imprimir: false,
        pagamentos: false,
        financeiro: false,
        sistema: false,
        superadmin: false,
        alterar_senha: false,
        avaliacoes: false,
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar permissões" },
      { status: 400 }
    );
  }
}