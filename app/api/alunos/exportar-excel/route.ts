import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabaseServer } from "../../../../lib/supabase-server";

function formatData(data?: string | null) {
  if (!data) return "";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("pt-BR");
}

export async function GET(req: NextRequest) {
  try {
    const headerAcademia = req.headers.get("x-academia-id");
    const { searchParams } = new URL(req.url);

    const queryAcademia = searchParams.get("academia_id");
    const status = searchParams.get("status") || "";
    const busca = (searchParams.get("busca") || "").trim().toLowerCase();

    const academiaId = headerAcademia || queryAcademia;

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não informada" },
        { status: 400 }
      );
    }

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, nome")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia) {
      return NextResponse.json(
        { error: academiaError?.message || "Academia não encontrada" },
        { status: 500 }
      );
    }

    let query = supabaseServer
      .from("alunos")
      .select(
        "id, nome, telefone, endereco, data_nascimento, cpf, plano, data_matricula, status, created_at"
      )
      .eq("academia_id", academiaId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query.order("nome", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let alunos = data || [];

    if (busca) {
      alunos = alunos.filter((item) => {
        const nome = (item.nome || "").toLowerCase();
        const telefone = (item.telefone || "").toLowerCase();
        const cpf = (item.cpf || "").toLowerCase();
        const plano = (item.plano || "").toLowerCase();

        return (
          nome.includes(busca) ||
          telefone.includes(busca) ||
          cpf.includes(busca) ||
          plano.includes(busca)
        );
      });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Alunos");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Nome", key: "nome", width: 30 },
      { header: "Telefone", key: "telefone", width: 18 },
      { header: "CPF", key: "cpf", width: 18 },
      { header: "Plano", key: "plano", width: 18 },
      { header: "Status", key: "status", width: 14 },
      { header: "Data matrícula", key: "data_matricula", width: 18 },
      { header: "Data nascimento", key: "data_nascimento", width: 18 },
      { header: "Endereço", key: "endereco", width: 40 },
    ];

    sheet.mergeCells("A1:I1");
    sheet.getCell("A1").value = `Relatório de Alunos - ${academia.nome || "Academia"}`;
    sheet.getCell("A1").font = { bold: true, size: 14 };
    sheet.getCell("A1").alignment = { horizontal: "center" };

    sheet.mergeCells("A2:I2");
    sheet.getCell("A2").value = `Emitido em: ${new Date().toLocaleString("pt-BR")}`;
    sheet.getCell("A2").alignment = { horizontal: "center" };

    sheet.mergeCells("A3:I3");
    sheet.getCell("A3").value = `Total de alunos: ${alunos.length}`;
    sheet.getCell("A3").alignment = { horizontal: "center" };

    const headerRow = sheet.getRow(5);
    headerRow.values = [
      "ID",
      "Nome",
      "Telefone",
      "CPF",
      "Plano",
      "Status",
      "Data matrícula",
      "Data nascimento",
      "Endereço",
    ];
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF111111" },
      };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    alunos.forEach((item) => {
      sheet.addRow({
        id: item.id,
        nome: item.nome || "",
        telefone: item.telefone || "",
        cpf: item.cpf || "",
        plano: item.plano || "",
        status: item.status || "",
        data_matricula: formatData(item.data_matricula),
        data_nascimento: formatData(item.data_nascimento),
        endereco: item.endereco || "",
      });
    });

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 6) {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD9D9D9" } },
            bottom: { style: "thin", color: { argb: "FFD9D9D9" } },
            left: { style: "thin", color: { argb: "FFD9D9D9" } },
            right: { style: "thin", color: { argb: "FFD9D9D9" } },
          };
        });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="alunos.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao exportar alunos" },
      { status: 400 }
    );
  }
}