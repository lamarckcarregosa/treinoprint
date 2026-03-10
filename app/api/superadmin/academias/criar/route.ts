import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";

function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const telefone = String(body.telefone || "").trim();
    const email = String(body.email || "").trim();
    const endereco = String(body.endereco || "").trim();
    const cnpj = String(body.cnpj || "").trim();
    const logo_url = String(body.logo_url || "").trim();

    const admin_nome = String(body.admin_nome || "").trim();
    const admin_usuario = String(body.admin_usuario || "").trim();
    const admin_email = String(body.admin_email || "").trim();
    const admin_senha = String(body.admin_senha || "").trim();

    if (!nome || !admin_nome || !admin_usuario || !admin_email || !admin_senha) {
      return NextResponse.json(
        { error: "Preencha academia, nome do admin, usuário, email e senha" },
        { status: 400 }
      );
    }

    const slug = `${slugify(nome)}-${Date.now()}`;

    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .insert({
        nome,
        telefone: telefone || null,
        email: email || null,
        endereco: endereco || null,
        cnpj: cnpj || null,
        logo_url: logo_url || null,
        plano: "starter",
        ativa: true,
        slug,
      })
      .select()
      .single();

    if (academiaError || !academia) {
      return NextResponse.json(
        { error: academiaError?.message || "Erro ao criar academia" },
        { status: 500 }
      );
    }

    const academia_id = academia.id;

    // 1) cria usuário no Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: admin_email,
        password: admin_senha,
        email_confirm: true,
        user_metadata: {
          nome: admin_nome,
          usuario: admin_usuario,
          tipo: "admin",
          academia_id,
        },
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Erro ao criar usuário no Auth" },
        { status: 500 }
      );
    }

    // 2) cria profile vinculado
    const { error: profileError } = await supabaseServer
      .from("profiles")
      .insert({
        id: authData.user.id, // importante se profiles.id referencia auth.users.id
        nome: admin_nome,
        usuario: admin_usuario,
        email: admin_email,
        tipo: "admin",
        ativo: true,
        academia_id,
      });

    if (profileError) {
      // rollback simples do auth para não deixar usuário órfão
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    // personal teste
    const { error: personalError } = await supabaseServer
      .from("personals")
      .insert({
        nome: "Personal teste",
        academia_id,
      });

    if (personalError) {
      return NextResponse.json(
        { error: personalError.message },
        { status: 500 }
      );
    }

    // alunos teste
    const { data: alunos, error: alunosError } = await supabaseServer
      .from("alunos")
      .insert([
        { nome: "Aluno teste 01", academia_id, status: "ativo" },
        { nome: "Aluno teste 02", academia_id, status: "ativo" },
        { nome: "Aluno teste 03", academia_id, status: "ativo" },
      ])
      .select("id, nome");

    if (alunosError || !alunos) {
      return NextResponse.json(
        { error: alunosError?.message || "Erro ao criar alunos teste" },
        { status: 500 }
      );
    }

    // financeiro teste
    const valorMensalidade = 100;
    const diaVencimento = 10;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");

    const competencia = `${ano}-${mes}`;
    const vencimento = `${ano}-${mes}-${String(diaVencimento).padStart(2, "0")}`;

    const { error: financeiroAlunosError } = await supabaseServer
      .from("financeiro_alunos")
      .insert(
        alunos.map((aluno) => ({
          aluno_id: aluno.id,
          valor_mensalidade: valorMensalidade,
          dia_vencimento: diaVencimento,
          ativo: true,
          academia_id,
        }))
      );

    if (financeiroAlunosError) {
      return NextResponse.json(
        { error: financeiroAlunosError.message },
        { status: 500 }
      );
    }

    const { error: pagamentosError } = await supabaseServer
      .from("financeiro_pagamentos")
      .insert(
        alunos.map((aluno) => ({
          aluno_id: aluno.id,
          competencia,
          valor: valorMensalidade,
          vencimento,
          status: "pendente",
          academia_id,
        }))
      );

    if (pagamentosError) {
      return NextResponse.json(
        { error: pagamentosError.message },
        { status: 500 }
      );
    }

    // treinos teste
    const semanaAtual = new Date().toISOString().split("T")[0];

    const treinoMasculino = [
      { nome: "Supino reto com barra", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Supino 45° com barra", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Crucifixo no banco reto", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Cross over", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Tríceps testa no banco", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Tríceps pulley barra W", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Tríceps corda", series: "4", repeticoes: "8", carga: "-" },
    ];

    const treinoFeminino = [
      { nome: "Agachamento hack", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Leg 45°", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Extensora", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Cadeira adutora", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Mesa flexora", series: "4", repeticoes: "8", carga: "-" },
      { nome: "Panturrilha", series: "4", repeticoes: "25", carga: "-" },
    ];

    const { error: treinosError } = await supabaseServer
      .from("treinos_modelos")
      .insert([
        {
          semana: semanaAtual,
          dia: "Segunda",
          nivel: "Iniciante",
          tipo: "Masculino",
          exercicios: treinoMasculino,
          academia_id,
        },
        {
          semana: semanaAtual,
          dia: "Segunda",
          nivel: "Iniciante",
          tipo: "Feminino",
          exercicios: treinoFeminino,
          academia_id,
        },
      ]);

    if (treinosError) {
      return NextResponse.json(
        { error: treinosError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Academia criada com sucesso",
      academia_id,
      auth_user_id: authData.user.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar academia" },
      { status: 500 }
    );
  }
}