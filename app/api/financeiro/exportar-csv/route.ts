import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

function escCsv(valor: unknown) {
  const texto = String(valor ?? "");
  const precisaAspas =
    texto.includes(";") ||
    texto.includes('"') ||
    texto.includes("\n") ||
    texto.includes("\r");

  const limpo = texto.replace(/"/g, '""');
  return precisaAspas ? `"${limpo}"` : limpo;
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (!inicio || !fim) {
      return NextResponse.json(
        { error: "Informe inicio e fim" },
        { status: 400 }
      );
    }

    const { data: pagamentos, error: errorPagamentos } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(
        "id, aluno_id, competencia, valor, vencimento, data_pagamento, status, forma_pagamento"
      )
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim)
      .order("vencimento", { ascending: true });

    if (errorPagamentos) {
      return NextResponse.json(
        { error: errorPagamentos.message },
        { status: 500 }
      );
    }

    const { data: despesas, error: errorDespesas } = await supabaseServer
      .from("financeiro_despesas")
      .select(
        "id, descricao, categoria, valor, data_lancamento, data_pagamento, status, observacoes, tipo"
      )
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim)
      .order("data_lancamento", { ascending: true });

    if (errorDespesas) {
      return NextResponse.json(
        { error: errorDespesas.message },
        { status: 500 }
      );
    }

    const alunoIds = Array.from(
      new Set(
        (pagamentos || [])
          .map((item) => item.aluno_id)
          .filter((id) => id !== null && id !== undefined)
      )
    );

    let mapaAlunos = new Map<number, string>();

    if (alunoIds.length > 0) {
      const { data: alunos, error: errorAlunos } = await supabaseServer
        .from("alunos")
        .select("id, nome")
        .in("id", alunoIds)
        .eq("academia_id", academiaId);

      if (errorAlunos) {
        return NextResponse.json(
          { error: errorAlunos.message },
          { status: 500 }
        );
      }

      mapaAlunos = new Map(
        (alunos || []).map((aluno) => [Number(aluno.id), aluno.nome])
      );
    }

    const linhas: string[] = [];

    linhas.push(
      [
        "tipo",
        "id",
        "nome",
        "competencia",
        "categoria",
        "valor",
        "status",
        "forma_pagamento",
        "tipo_despesa",
        "data_referencia",
        "data_pagamento",
        "observacoes",
      ].join(";")
    );

    for (const item of pagamentos || []) {
      linhas.push(
        [
          escCsv("pagamento"),
          escCsv(item.id),
          escCsv(mapaAlunos.get(Number(item.aluno_id)) || `Aluno #${item.aluno_id}`),
          escCsv(item.competencia || ""),
          escCsv(""),
          escCsv(Number(item.valor || 0).toFixed(2).replace(".", ",")),
          escCsv(item.status || ""),
          escCsv(item.forma_pagamento || ""),
          escCsv(""),
          escCsv(item.vencimento || ""),
          escCsv(item.data_pagamento || ""),
          escCsv(""),
        ].join(";")
      );
    }

    for (const item of despesas || []) {
      linhas.push(
        [
          escCsv("despesa"),
          escCsv(item.id),
          escCsv(item.descricao || ""),
          escCsv(""),
          escCsv(item.categoria || ""),
          escCsv(Number(item.valor || 0).toFixed(2).replace(".", ",")),
          escCsv(item.status || ""),
          escCsv(""),
          escCsv(item.tipo || ""),
          escCsv(item.data_lancamento || ""),
          escCsv(item.data_pagamento || ""),
          escCsv(item.observacoes || ""),
        ].join(";")
      );
    }

    const csv = "\uFEFF" + linhas.join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="financeiro_${inicio}_${fim}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao exportar CSV" },
      { status: 400 }
    );
  }
}