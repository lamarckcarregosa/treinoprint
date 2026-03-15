import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const alunoIdHeader =
      req.headers.get("x-app-aluno-id") || req.headers.get("x-aluno-id");

    const academiaIdHeader = req.headers.get("x-academia-id");

    const alunoId = Number(alunoIdHeader);

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno não autenticado" },
        { status: 401 }
      );
    }

    let academiaId = academiaIdHeader || "";

    if (!academiaId) {
      const { data: aluno, error: alunoError } = await supabaseServer
        .from("alunos")
        .select("id, academia_id")
        .eq("id", alunoId)
        .single();

      if (alunoError || !aluno) {
        return NextResponse.json(
          { error: alunoError?.message || "Aluno não encontrado" },
          { status: 404 }
        );
      }

      academiaId = aluno.academia_id;
    }

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(
        `
          id,
          competencia,
          valor,
          vencimento,
          data_pagamento,
          status,
          forma_pagamento,
          gateway,
          gateway_status,
          link_pagamento
        `
      )
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .order("vencimento", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao carregar financeiro" },
        { status: 500 }
      );
    }

    const lista = Array.isArray(data) ? data : [];

    const resultado = lista.map((item: any) => ({
      id: item.id,
      competencia: item.competencia,
      valor: Number(item.valor || 0),
      vencimento: item.vencimento,
      data_pagamento: item.data_pagamento || null,
      status: item.status || "pendente",
      forma_pagamento: item.forma_pagamento || null,
      gateway: item.gateway || null,
      gateway_status: item.gateway_status || null,
      link_pagamento: item.link_pagamento || null,
    }));

    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar financeiro" },
      { status: 400 }
    );
  }
}