import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const competencia = searchParams.get("competencia");

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
        link_pagamento,
        alunos (
          nome,
          telefone,
          cpf
        )
      `)
      .eq("academia_id", academiaId)
      .order("vencimento", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    if (competencia) {
      query = query.eq("competencia", competencia);
    }

    const { data, error } = await query;

    if (error) throw error;

    const lista = (data || []).map((item: any) => ({
      id: item.id,
      aluno_id: item.aluno_id,
      aluno_nome: Array.isArray(item.alunos)
        ? item.alunos[0]?.nome || "Aluno"
        : item.alunos?.nome || "Aluno",
      aluno_telefone: Array.isArray(item.alunos)
        ? item.alunos[0]?.telefone || null
        : item.alunos?.telefone || null,
      aluno_cpf: Array.isArray(item.alunos)
        ? item.alunos[0]?.cpf || null
        : item.alunos?.cpf || null,
      competencia: item.competencia,
      valor: item.valor,
      vencimento: item.vencimento,
      data_pagamento: item.data_pagamento,
      status: item.status,
      forma_pagamento: item.forma_pagamento,
      gateway: item.gateway,
      gateway_status: item.gateway_status,
      link_pagamento: item.link_pagamento,
    }));

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar pagamentos" },
      { status: 500 }
    );
  }
}