import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    if (!inicio || !fim) {
      return NextResponse.json({ error: "Informe inicio e fim" }, { status: 400 });
    }

    const { data: pagamentos, error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .select(`
        id,
        competencia,
        valor,
        vencimento,
        data_pagamento,
        status,
        aluno:alunos(nome)
      `)
      .eq("academia_id", academiaId)
      .gte("vencimento", inicio)
      .lte("vencimento", fim);

    if (pagamentosError) throw pagamentosError;

    const { data: despesas, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, descricao, categoria, valor, tipo, data_lancamento, observacoes")
      .eq("academia_id", academiaId)
      .gte("data_lancamento", inicio)
      .lte("data_lancamento", fim);

    if (despesasError) throw despesasError;

    const workbook = new ExcelJS.Workbook();

    const ws1 = workbook.addWorksheet("Pagamentos");
    ws1.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Aluno", key: "aluno", width: 30 },
      { header: "Competência", key: "competencia", width: 15 },
      { header: "Valor", key: "valor", width: 14 },
      { header: "Vencimento", key: "vencimento", width: 15 },
      { header: "Data Pagamento", key: "data_pagamento", width: 18 },
      { header: "Status", key: "status", width: 12 },
    ];

    (pagamentos || []).forEach((item: any) =>
      ws1.addRow({
        id: item.id,
        aluno: item.aluno?.nome ?? "",
        competencia: item.competencia ?? "",
        valor: Number(item.valor ?? 0),
        vencimento: item.vencimento ?? "",
        data_pagamento: item.data_pagamento ?? "",
        status: item.status ?? "",
      })
    );

    const ws2 = workbook.addWorksheet("Despesas");
    ws2.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Descrição", key: "descricao", width: 30 },
      { header: "Categoria", key: "categoria", width: 20 },
      { header: "Valor", key: "valor", width: 14 },
      { header: "Tipo", key: "tipo", width: 15 },
      { header: "Data", key: "data_lancamento", width: 15 },
      { header: "Observações", key: "observacoes", width: 40 },
    ];

    (despesas || []).forEach((item) =>
      ws2.addRow({
        ...item,
        valor: Number(item.valor ?? 0),
      })
    );

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="financeiro-${inicio}-a-${fim}.xlsx"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao exportar Excel" },
      { status: 400 }
    );
  }
}