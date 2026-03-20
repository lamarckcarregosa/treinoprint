import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    if (!academiaId) {
      return NextResponse.json(
        { error: "Academia não identificada." },
        { status: 400 }
      );
    }

    const [alunosRes, acessosRes, avaliacoesRes, pagamentosRes, impressoesRes] =
      await Promise.all([
        supabaseServer
          .from("alunos")
          .select("id, nome, status, plano, telefone")
          .eq("academia_id", academiaId)
          .order("nome"),

        supabaseServer
          .from("acessos_catraca")
          .select("aluno_id, created_at, status")
          .eq("academia_id", academiaId),

        supabaseServer
          .from("avaliacoes_fisicas")
          .select("aluno_id, created_at")
          .eq("academia_id", academiaId),

        supabaseServer
          .from("financeiro_pagamentos")
          .select("aluno_id, status, vencimento")
          .eq("academia_id", academiaId),

        supabaseServer
          .from("historico_impressoes")
          .select("aluno_id, created_at")
          .eq("academia_id", academiaId),
      ]);

    if (alunosRes.error) throw alunosRes.error;
    if (acessosRes.error) throw acessosRes.error;
    if (avaliacoesRes.error) throw avaliacoesRes.error;
    if (pagamentosRes.error) throw pagamentosRes.error;
    if (impressoesRes.error) throw impressoesRes.error;

    const alunos = alunosRes.data || [];
    const acessos = acessosRes.data || [];
    const avaliacoes = avaliacoesRes.data || [];
    const pagamentos = pagamentosRes.data || [];
    const impressoes = impressoesRes.data || [];

    const seteDias = new Date();
    seteDias.setDate(seteDias.getDate() - 7);

    const alunosResumo = alunos.map((aluno) => {
      const acessosAluno = acessos
        .filter((a) => a.aluno_id === aluno.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const avaliacoesAluno = avaliacoes
        .filter((a) => a.aluno_id === aluno.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      const pagamentosAluno = pagamentos.filter((p) => p.aluno_id === aluno.id);

      const impressoesAluno = impressoes
        .filter((i) => i.aluno_id === aluno.id)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      let financeiro: "em_dia" | "pendente" | "vencido" = "em_dia";

      if (
        pagamentosAluno.some(
          (p) => String(p.status || "").toLowerCase() === "vencido"
        )
      ) {
        financeiro = "vencido";
      } else if (
        pagamentosAluno.some(
          (p) => String(p.status || "").toLowerCase() !== "pago"
        )
      ) {
        financeiro = "pendente";
      }

      const ultimoAcesso = acessosAluno[0]?.created_at || null;
      const risco = ultimoAcesso
        ? new Date(ultimoAcesso) < seteDias
        : true;

      return {
        id: aluno.id,
        nome: aluno.nome,
        status: aluno.status,
        plano: aluno.plano,
        telefone: aluno.telefone,
        ultimo_acesso: ultimoAcesso,
        ultima_avaliacao: avaliacoesAluno[0]?.created_at || null,
        ultimo_treino: impressoesAluno[0]?.created_at || null,
        financeiro,
        risco,
      };
    });

    return NextResponse.json({
      alunos: alunosResumo,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar alunos" },
      { status: 500 }
    );
  }
}