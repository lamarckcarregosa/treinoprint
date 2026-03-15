import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const alunoIdHeader =
      req.headers.get("x-app-aluno-id") || req.headers.get("x-aluno-id");

    const academiaIdHeader = req.headers.get("x-academia-id");

    const alunoId = Number(alunoIdHeader);
    const { id } = await context.params;
    const pagamentoId = Number(id);

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno não autenticado" },
        { status: 401 }
      );
    }

    if (!pagamentoId || Number.isNaN(pagamentoId)) {
      return NextResponse.json(
        { error: "Cobrança inválida" },
        { status: 400 }
      );
    }

    let academiaId = academiaIdHeader || "";
    let alunoNome = "Aluno";

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id, academia_id, nome")
      .eq("id", alunoId)
      .single();

    if (alunoError || !aluno) {
      return NextResponse.json(
        { error: alunoError?.message || "Aluno não encontrado" },
        { status: 404 }
      );
    }

    academiaId = academiaId || aluno.academia_id;
    alunoNome = aluno.nome || "Aluno";

    const { data, error } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(`
        id,
        aluno_id,
        competencia,
        valor,
        vencimento,
        data_pagamento,
        status,
        forma_pagamento,
        gateway,
        gateway_status,
        gateway_payment_id,
        gateway_preference_id,
        gateway_external_reference,
        link_pagamento,
        data_confirmacao_gateway
      `)
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .eq("id", pagamentoId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Cobrança não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: data.id,
      aluno_id: data.aluno_id,
      aluno_nome: alunoNome,
      competencia: data.competencia,
      valor: Number(data.valor || 0),
      vencimento: data.vencimento,
      data_pagamento: data.data_pagamento || null,
      status: data.status || "pendente",
      forma_pagamento: data.forma_pagamento || null,
      gateway: data.gateway || null,
      gateway_status: data.gateway_status || null,
      gateway_payment_id: data.gateway_payment_id || null,
      gateway_preference_id: data.gateway_preference_id || null,
      gateway_external_reference: data.gateway_external_reference || null,
      link_pagamento: data.link_pagamento || null,
      data_confirmacao_gateway: data.data_confirmacao_gateway || null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar cobrança" },
      { status: 400 }
    );
  }
}