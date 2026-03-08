import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const usuario = String(body.usuario || "").trim().toLowerCase();
    const email = String(body.email || "").trim().toLowerCase();
    const senha = String(body.senha || "");
    const tipo = String(body.tipo || "personal").trim().toLowerCase();

    if (!nome || !usuario || !email || !senha || !tipo) {
      return NextResponse.json(
        { error: "Preencha todos os campos" },
        { status: 400 }
      );
    }

    const { data: usuarioExistente, error: errorUsuario } = await supabaseServer
      .from("profiles")
      .select("id, usuario, academia_id")
      .eq("academia_id", academiaId)
      .eq("usuario", usuario)
      .maybeSingle();

    if (errorUsuario) {
      return NextResponse.json(
        { error: "Erro ao validar usuário" },
        { status: 500 }
      );
    }

    if (usuarioExistente) {
      return NextResponse.json(
        { error: "Já existe um usuário com esse login nesta academia" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        academia_id: academiaId,
        usuario,
        nome,
        tipo,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao criar usuário" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Usuário criado com sucesso",
      user: data.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro interno ao criar usuário" },
      { status: 500 }
    );
  }
}