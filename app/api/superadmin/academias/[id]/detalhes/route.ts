import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseServer
      .from("academias")
      .select(
        "id, nome, plano, ativa, telefone, email, endereco, cnpj, logo_url, slug, limite_alunos, created_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar academia" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { data, error } = await supabaseServer
      .from("academias")
      .update({
        nome: body.nome || null,
        plano: body.plano || null,
        ativa: Boolean(body.ativa),
        telefone: body.telefone || null,
        email: body.email || null,
        endereco: body.endereco || null,
        cnpj: body.cnpj || null,
        logo_url: body.logo_url || null,
        limite_alunos:
          body.limite_alunos === "" || body.limite_alunos == null
            ? null
            : Number(body.limite_alunos),
      })
      .eq("id", id)
      .select(
        "id, nome, plano, ativa, telefone, email, endereco, cnpj, logo_url, slug, limite_alunos, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar academia" },
      { status: 400 }
    );
  }
}