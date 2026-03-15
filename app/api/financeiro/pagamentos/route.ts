import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const status = (searchParams.get("status") || "").trim();
    const competencia = (searchParams.get("competencia") || "").trim();

    let query = supabaseServer
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
        link_pagamento
      `)
      .eq("academia_id", academiaId)
      .order("vencimento", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (competencia) {
      query = query.eq("competencia", competencia);
    }

    const { data: pagamentos, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const lista = Array.isArray(pagamentos) ? pagamentos : [];

    const alunoIds = Array.from(
      new Set(
        lista
          .map((item: any) => Number(item.aluno_id))
          .filter(Boolean)
      )
    );

    let alunosMapa = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos, error: alunosError } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .eq("academia_id", academiaId)
        .in("id", alunoIds);

      if (alunosError) {
        return NextResponse.json({ error: alunosError.message }, { status: 500 });
      }

      alunosMapa = new Map(
        (alunos || []).map((aluno: any) => [Number(aluno.id), aluno.nome || "Aluno"])
      );
    }

    const resultado = lista.map((item: any) => ({
      id: item.id,
      aluno_id: item.aluno_id,
      aluno_nome: alunosMapa.get(Number(item.aluno_id)) || "Aluno",
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
      { error: error.message || "Erro ao carregar pagamentos" },
      { status: 400 }
    );
  }
}