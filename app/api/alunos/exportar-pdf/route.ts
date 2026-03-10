import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

function formatData(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

function escapeHtml(texto: any) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
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
      .select("id, nome, logo_url, telefone, email, endereco, cnpj")
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
        "id, nome, telefone, endereco, data_nascimento, cpf, plano, data_matricula, status"
      )
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: alunos, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let lista = alunos || [];

    if (busca) {
      lista = lista.filter((item) => {
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

    const linhas = lista
      .map(
        (item) => `
          <tr>
            <td>${item.id}</td>
            <td>${escapeHtml(item.nome || "-")}</td>
            <td>${escapeHtml(item.telefone || "-")}</td>
            <td>${escapeHtml(item.cpf || "-")}</td>
            <td>${escapeHtml(item.plano || "-")}</td>
            <td>${escapeHtml(item.status || "-")}</td>
            <td>${escapeHtml(formatData(item.data_matricula))}</td>
            <td>${escapeHtml(formatData(item.data_nascimento))}</td>
          </tr>
        `
      )
      .join("");

    const hoje = new Date().toLocaleString("pt-BR");

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Relatório de Alunos</title>
          <style>
            * {
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: 28px;
              color: #111;
              background: #fff;
            }
            .topo {
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 24px;
              border-bottom: 2px solid #111;
              padding-bottom: 16px;
            }
            .logo {
              max-height: 72px;
              max-width: 160px;
              object-fit: contain;
            }
            .titulo {
              flex: 1;
            }
            h1 {
              margin: 0 0 8px;
              font-size: 24px;
            }
            .subinfo {
              margin: 2px 0;
              color: #444;
              font-size: 13px;
            }
            .resumo {
              margin: 20px 0;
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 12px;
            }
            .box {
              border: 1px solid #ddd;
              border-radius: 10px;
              padding: 12px;
              background: #fafafa;
              min-height: 66px;
            }
            .box strong {
              display: block;
              font-size: 12px;
              color: #666;
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background: #111;
              color: #fff;
            }
            tr:nth-child(even) {
              background: #f7f7f7;
            }
            .rodape {
              margin-top: 24px;
              text-align: center;
              font-size: 11px;
              color: #666;
            }
            @media print {
              body {
                padding: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="topo">
            ${
              academia.logo_url
                ? `<img src="${escapeHtml(academia.logo_url)}" class="logo" alt="Logo" />`
                : `<div></div>`
            }

            <div class="titulo">
              <h1>Relatório de Alunos</h1>
              <p class="subinfo"><strong>Academia:</strong> ${escapeHtml(
                academia.nome || "-"
              )}</p>
              <p class="subinfo"><strong>Emitido em:</strong> ${escapeHtml(hoje)}</p>
              <p class="subinfo"><strong>Total de alunos listados:</strong> ${lista.length}</p>
            </div>
          </div>

          <div class="resumo">
            <div class="box">
              <strong>Telefone</strong>
              ${escapeHtml(academia.telefone || "-")}
            </div>
            <div class="box">
              <strong>E-mail</strong>
              ${escapeHtml(academia.email || "-")}
            </div>
            <div class="box">
              <strong>CNPJ</strong>
              ${escapeHtml(academia.cnpj || "-")}
            </div>
            <div class="box">
              <strong>Endereço</strong>
              ${escapeHtml(academia.endereco || "-")}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>CPF</th>
                <th>Plano</th>
                <th>Status</th>
                <th>Data matrícula</th>
                <th>Data nascimento</th>
              </tr>
            </thead>
            <tbody>
              ${linhas}
            </tbody>
          </table>

          <div class="rodape">
            TreinoPrint • Relatório gerado automaticamente
          </div>

          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao exportar PDF" },
      { status: 400 }
    );
  }
}