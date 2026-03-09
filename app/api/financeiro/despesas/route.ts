import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("financeiro_despesas")
      .select("*")
      .eq("academia_id", academiaId)
      .order("data_lancamento", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar despesas" },
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
    const data_lancamento = String(body.data_lancamento || "").trim();
    const observacoes = String(body.observacoes || "").trim();

    if (!descricao || !valor || !data_lancamento) {
      return NextResponse.json(
        { error: "Descrição, valor e data são obrigatórios" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("financeiro_despesas")
      .insert([
        {
          academia_id: academiaId,
          descricao,
          categoria,
          valor,
          data_lancamento,
          observacoes,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar despesa" },
      { status: 400 }
    );
  }
}