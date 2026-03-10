import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const id = body.id ? Number(body.id) : null;
    const nome = String(body.nome || "").trim();
    const codigo = String(body.codigo || "").trim().toLowerCase();
    const valor = Number(body.valor || 0);
    const tipo_cobranca = String(body.tipo_cobranca || "mensal").trim();
    const limite_alunos =
      body.limite_alunos === "" || body.limite_alunos == null
        ? null
        : Number(body.limite_alunos);
    const ativo = Boolean(body.ativo);

    if (!nome || !codigo) {
      return NextResponse.json(
        { error: "Nome e código são obrigatórios" },
        { status: 400 }
      );
    }

    if (id) {
      const { error } = await supabaseServer
        .from("planos")
        .update({
          nome,
          codigo,
          valor,
          tipo_cobranca,
          limite_alunos,
          ativo,
        })
        .eq("id", id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabaseServer.from("planos").insert({
        nome,
        codigo,
        valor,
        tipo_cobranca,
        limite_alunos,
        ativo,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar plano" },
      { status: 400 }
    );
  }
}