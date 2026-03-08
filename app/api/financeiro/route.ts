import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("dashboard_financeiro")
      .select("*")
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      data || {
        receita_mes: 0,
        despesas: 0,
        ponto_equilibrio: 0,
        observacoes: "",
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar financeiro" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const receita_mes = Number(body.receita_mes || 0);
    const despesas = Number(body.despesas || 0);
    const ponto_equilibrio = Number(body.ponto_equilibrio || 0);
    const observacoes = String(body.observacoes || "").trim();

    const { data, error } = await supabaseServer
      .from("dashboard_financeiro")
      .upsert(
        {
          academia_id: academiaId,
          receita_mes,
          despesas,
          ponto_equilibrio,
          observacoes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "academia_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar financeiro" },
      { status: 400 }
    );
  }
}