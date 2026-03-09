import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("financeiro_despesas_fixas")
      .select("*")
      .eq("academia_id", academiaId)
      .order("descricao", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar despesas fixas" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const descricao = String(body.descricao || "").trim();
    const categoria = String(body.categoria || "").trim();
    const valor = Number(body.valor || 0);
    const dia_vencimento = Number(body.dia_vencimento || 5);

    if (!descricao || !valor) {
      return NextResponse.json(
        { error: "Descrição e valor são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("financeiro_despesas_fixas")
      .insert({
        academia_id: academiaId,
        descricao,
        categoria,
        valor,
        dia_vencimento,
        ativo: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar despesa fixa" },
      { status: 400 }
    );
  }
}