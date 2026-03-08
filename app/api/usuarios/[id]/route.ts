import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const usuario = String(body.usuario || "").trim().toLowerCase();
    const tipo = String(body.tipo || "personal").trim().toLowerCase();
    const ativo = Boolean(body.ativo);

    if (!nome || !usuario || !tipo) {
      return NextResponse.json(
        { error: "Nome, usuário e tipo são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: existente, error: errorExistente } = await supabaseServer
      .from("profiles")
      .select("id, usuario")
      .eq("academia_id", academiaId)
      .eq("usuario", usuario)
      .neq("id", id)
      .maybeSingle();

    if (errorExistente) {
      return NextResponse.json(
        { error: "Erro ao validar usuário" },
        { status: 500 }
      );
    }

    if (existente) {
      return NextResponse.json(
        { error: "Já existe outro usuário com esse login nesta academia" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("profiles")
      .update({
        nome,
        usuario,
        tipo,
        ativo,
      })
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select("id, nome, usuario, tipo, ativo, academia_id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar usuário" },
      { status: 400 }
    );
  }
}