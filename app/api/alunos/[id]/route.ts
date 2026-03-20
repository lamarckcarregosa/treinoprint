import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const alunoId = Number(id);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno inválido." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("alunos")
      .select(`
        id,
        nome,
        telefone,
        cpf,
        endereco,
        data_nascimento,
        plano,
        data_matricula,
        status,
        foto_url,
        objetivo,
        peso_meta,
        sexo,
        created_at
      `)
      .eq("academia_id", academiaId)
      .eq("id", alunoId)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar aluno" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await context.params;
    const alunoId = Number(id);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Aluno inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const payload = {
      nome: body.nome ?? null,
      telefone: body.telefone ?? null,
      cpf: body.cpf ?? null,
      endereco: body.endereco ?? null,
      data_nascimento: body.data_nascimento ?? null,
      plano: body.plano ?? null,
      data_matricula: body.data_matricula ?? null,
      status: body.status ?? "ativo",
      foto_url: body.foto_url ?? null,
      objetivo: body.objetivo ?? null,
      peso_meta: body.peso_meta ?? null,
      sexo: body.sexo ?? null,
    };

    const { data, error } = await supabaseServer
      .from("alunos")
      .update(payload)
      .eq("academia_id", academiaId)
      .eq("id", alunoId)
      .select(`
        id,
        nome,
        telefone,
        cpf,
        endereco,
        data_nascimento,
        plano,
        data_matricula,
        status,
        foto_url,
        objetivo,
        peso_meta,
        created_at
      `)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao atualizar aluno" },
      { status: 500 }
    );
  }
}