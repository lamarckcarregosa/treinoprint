import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("academias")
      .select(
        `
          id,
          nome,
          telefone,
          email,
          endereco,
          cnpj,
          logo_url,
          plano,
          limite_alunos,
          slug,
          ativa,
          mp_connected,
          mp_user_id,
          mp_public_key,
          mp_access_token,
          mp_refresh_token,
          mp_token_expires_at
        `
      )
      .eq("id", academiaId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar academia" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const telefone = String(body.telefone || "").trim();
    const email = String(body.email || "").trim();
    const endereco = String(body.endereco || "").trim();
    const cnpj = String(body.cnpj || "").trim();
    const logo_url = String(body.logo_url || "").trim();

    const payload: Record<string, any> = {
      nome,
      telefone: telefone || null,
      email: email || null,
      endereco: endereco || null,
      cnpj: cnpj || null,
      logo_url: logo_url || null,
    };

    if (!nome) {
      return NextResponse.json(
        { error: "Nome da academia é obrigatório" },
        { status: 400 }
      );
    }

    if ("mp_connected" in body) {
      payload.mp_connected = body.mp_connected === true;
    }

    if ("mp_user_id" in body) {
      payload.mp_user_id = body.mp_user_id || null;
    }

    if ("mp_public_key" in body) {
      payload.mp_public_key = body.mp_public_key || null;
    }

    if ("mp_access_token" in body) {
      payload.mp_access_token = body.mp_access_token || null;
    }

    if ("mp_refresh_token" in body) {
      payload.mp_refresh_token = body.mp_refresh_token || null;
    }

    if ("mp_token_expires_at" in body) {
      payload.mp_token_expires_at = body.mp_token_expires_at || null;
    }

    const { data, error } = await supabaseServer
      .from("academias")
      .update(payload)
      .eq("id", academiaId)
      .select(
        `
          id,
          nome,
          telefone,
          email,
          endereco,
          cnpj,
          logo_url,
          plano,
          limite_alunos,
          slug,
          ativa,
          mp_connected,
          mp_user_id,
          mp_public_key,
          mp_access_token,
          mp_refresh_token,
          mp_token_expires_at
        `
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar academia" },
      { status: 400 }
    );
  }
}