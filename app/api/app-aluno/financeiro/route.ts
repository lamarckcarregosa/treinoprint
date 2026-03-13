import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const alunoId = req.headers.get("x-aluno-id");
    const academiaId = req.headers.get("x-academia-id");

    if (!alunoId || !academiaId) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(
        "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento"
      )
      .eq("aluno_id", alunoId)
      .eq("academia_id", academiaId)
      .order("vencimento", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar financeiro" },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar financeiro" },
      { status: 400 }
    );
  }
}