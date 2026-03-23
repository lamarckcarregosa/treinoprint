import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const authResult = await supabaseServer.auth.getUser();

    console.log("auth.getUser() =>", authResult);

    const {
      data: { user },
      error: authError,
    } = authResult;

    if (authError) {
      return NextResponse.json(
        { error: `Auth error: ${authError.message}` },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, nome, usuario, tipo, ativo, academia_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: `Profile error: ${profileError.message}` },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: `Perfil não encontrado para user.id=${user.id}` },
        { status: 404 }
      );
    }

    if (!profile.academia_id) {
      return NextResponse.json(
        { error: "academia_id não informado no perfil" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: profile.id,
      nome: profile.nome,
      usuario: profile.usuario,
      tipo: profile.tipo,
      ativo: profile.ativo,
      academia_id: profile.academia_id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar usuário" },
      { status: 400 }
    );
  }
}