import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data, error } = await supabaseServer
      .from("alunos")
      .select(
        "id, nome, telefone, endereco, data_nascimento, cpf, plano, data_matricula, status, foto_url, created_at"
      )
      .eq("academia_id", academiaId)
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar alunos" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const telefone = String(body.telefone || "").trim();
    const endereco = String(body.endereco || "").trim();
    const cpf = String(body.cpf || "").trim();
    const plano = String(body.plano || "").trim();
    const status = String(body.status || "ativo").trim();
    const foto_url = String(body.foto_url || "").trim();

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

    // 1) busca limite da academia
    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select("id, nome, plano, limite_alunos, ativa")
      .eq("id", academiaId)
      .single();

    if (academiaError || !academia) {
      return NextResponse.json(
        { error: academiaError?.message || "Academia não encontrada" },
        { status: 500 }
      );
    }

    // 2) bloqueia academia inativa
    if (academia.ativa === false) {
      return NextResponse.json(
        { error: "Academia bloqueada. Cadastro de alunos indisponível." },
        { status: 403 }
      );
    }

    // 3) conta quantos alunos já existem
    const { count, error: countError } = await supabaseServer
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("academia_id", academiaId);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    // 4) valida limite
    if (
      academia.limite_alunos != null &&
      Number(academia.limite_alunos) > 0 &&
      Number(count || 0) >= Number(academia.limite_alunos)
    ) {
      return NextResponse.json(
        {
          error: `Limite de alunos do plano atingido (${academia.limite_alunos}). Atualize o plano para cadastrar mais alunos.`,
        },
        { status: 400 }
      );
    }

    // 5) cadastra aluno
    const { data, error } = await supabaseServer
      .from("alunos")
      .insert({
        nome,
        telefone: telefone || null,
        endereco: endereco || null,
        cpf: cpf || null,
        plano: plano || null,
        status: status || "ativo",
        foto_url: foto_url || null,
        data_nascimento,
        data_matricula,
        academia_id: academiaId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao cadastrar aluno" },
      { status: 400 }
    );
  }
}
