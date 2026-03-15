import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const alunoId = req.headers.get("x-app-aluno-id");

    if (!alunoId) {
      return NextResponse.json({ error: "Aluno não autenticado" }, { status: 401 });
    }

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id, academia_id")
      .eq("id", Number(alunoId))
      .single();

    if (alunoError || !aluno) {
      return NextResponse.json({ error: "Aluno não encontrado" }, { status: 404 });
    }

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, competencia, valor, vencimento, status, forma_pagamento, link_pagamento")
      .eq("academia_id", aluno.academia_id)
      .eq("aluno_id", aluno.id)
      .order("vencimento", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar cobranças" },
      { status: 400 }
    );
  }
}