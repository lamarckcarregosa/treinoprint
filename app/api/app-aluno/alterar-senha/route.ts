import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

function senhaInicialPorData(data?: string | null) {
  if (!data) return "";

  const match = String(data).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, ano, mes, dia] = match;
  return `${dia}${mes}${ano}`;
}

export async function POST(req: NextRequest) {
  try {
    const alunoId = req.headers.get("x-aluno-id");
    const academiaId = req.headers.get("x-academia-id");

    if (!alunoId || !academiaId) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const senhaAtual = String(body.senha_atual || "").trim();
    const novaSenha = String(body.nova_senha || "").trim();
    const confirmarSenha = String(body.confirmar_senha || "").trim();

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return NextResponse.json(
        { error: "Preencha todos os campos" },
        { status: 400 }
      );
    }

    if (novaSenha.length < 4) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 4 caracteres" },
        { status: 400 }
      );
    }

    if (novaSenha !== confirmarSenha) {
      return NextResponse.json(
        { error: "Confirmação de senha não confere" },
        { status: 400 }
      );
    }

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id, academia_id, data_nascimento, senha_app")
      .eq("id", alunoId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    if (alunoError) {
      return NextResponse.json(
        { error: alunoError.message },
        { status: 500 }
      );
    }

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const senhaInicial = senhaInicialPorData(aluno.data_nascimento);
    const senhaValidaAtual =
      aluno.senha_app && String(aluno.senha_app).trim() !== ""
        ? String(aluno.senha_app)
        : senhaInicial;

    if (senhaAtual !== senhaValidaAtual) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabaseServer
      .from("alunos")
      .update({
        senha_app: novaSenha,
        senha_app_alterada: true,
      })
      .eq("id", alunoId)
      .eq("academia_id", academiaId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao alterar senha" },
      { status: 400 }
    );
  }
}