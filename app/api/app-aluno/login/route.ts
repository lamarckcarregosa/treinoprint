import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function limparCPF(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

function senhaInicialPorData(data?: string | null) {
  if (!data) return "";

  const match = String(data).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, ano, mes, dia] = match;
  return `${dia}${mes}${ano}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const usuario = limparCPF(body.usuario || "");
    const senha = String(body.senha || "").trim();

    if (!usuario || !senha) {
      return NextResponse.json(
        { error: "Informe CPF e senha" },
        { status: 400 }
      );
    }

    const { data: alunos, error } = await supabaseServer
      .from("alunos")
      .select(
        "id, academia_id, nome, telefone, cpf, plano, status, foto_url, objetivo, peso_meta, data_nascimento, senha_app, senha_app_alterada, app_ativo"
      )
      .eq("cpf", usuario);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao buscar aluno" },
        { status: 500 }
      );
    }

    const lista = Array.isArray(alunos) ? alunos : [];

    if (lista.length === 0) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const aluno = lista[0];

    if (String(aluno.status || "").toLowerCase() === "inativo") {
      return NextResponse.json(
        { error: "Aluno inativo" },
        { status: 403 }
      );
    }

    if (aluno.app_ativo === false) {
      return NextResponse.json(
        { error: "Acesso ao app desativado" },
        { status: 403 }
      );
    }

    const senhaInicial = senhaInicialPorData(aluno.data_nascimento);
    const senhaValida =
      aluno.senha_app && String(aluno.senha_app).trim() !== ""
        ? String(aluno.senha_app)
        : senhaInicial;

    if (senha !== senhaValida) {
      return NextResponse.json(
        { error: "Senha inválida" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      sessao: {
        aluno_id: aluno.id,
        academia_id: aluno.academia_id,
      },
      aluno: {
        id: aluno.id,
        nome: aluno.nome,
        telefone: aluno.telefone,
        cpf: aluno.cpf,
        plano: aluno.plano,
        status: aluno.status,
        foto_url: aluno.foto_url,
        objetivo: aluno.objetivo,
        peso_meta: aluno.peso_meta,
        senha_app_alterada: !!aluno.senha_app_alterada,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao realizar login do aluno" },
      { status: 400 }
    );
  }
}