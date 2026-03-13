import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { data, error } = await supabaseServer
      .from("alunos")
      .select(
        "id, nome, telefone, endereco, data_nascimento, cpf, plano, data_matricula, status, foto_url, objetivo, peso_meta"
      )
      .eq("id", id)
      .eq("academia_id", academiaId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar aluno" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const telefone = String(body.telefone || "").trim();
    const endereco = String(body.endereco || "").trim();
    const cpf = String(body.cpf || "").trim();
    const plano = String(body.plano || "").trim();
    const status = String(body.status || "ativo").trim();
    const foto_url = String(body.foto_url || "").trim();
    const objetivo = String(body.objetivo || "").trim();

    const peso_meta =
      body.peso_meta !== null &&
      body.peso_meta !== undefined &&
      String(body.peso_meta).trim() !== ""
        ? Number(body.peso_meta)
        : null;

    const data_nascimento =
      body.data_nascimento && String(body.data_nascimento).trim() !== ""
        ? String(body.data_nascimento)
        : null;

    const data_matricula =
      body.data_matricula && String(body.data_matricula).trim() !== ""
        ? String(body.data_matricula)
        : null;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("alunos")
      .update({
        nome,
        telefone: telefone || null,
        endereco: endereco || null,
        cpf: cpf || null,
        plano: plano || null,
        status: status || "ativo",
        foto_url: foto_url || null,
        objetivo: objetivo || null,
        peso_meta,
        data_nascimento,
        data_matricula,
      })
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar aluno" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { error } = await supabaseServer
      .from("alunos")
      .delete()
      .eq("id", id)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir aluno" },
      { status: 400 }
    );
  }
}