import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

type TipoUsuario = "admin" | "superadmin" | "personal" | "recepcao" | "";

type Alerta = {
  id: string;
  titulo: string;
  descricao: string;
  nivel: "danger" | "warning" | "info";
  modulo: "financeiro" | "treinos" | "alunos" | "sistema";
  href?: string;
  perfis: TipoUsuario[];
  mostrarPopup?: boolean;
  total?: number;
};

export async function GET(req: NextRequest) {
  try {
    let academiaId = "";

    try {
      academiaId = getAcademiaIdFromRequest(req);
    } catch {
      return NextResponse.json([]);
    }

    const tipo = String(
      req.nextUrl.searchParams.get("tipo") || ""
    ) as TipoUsuario;

    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const quinzeDiasAtras = new Date();
    quinzeDiasAtras.setDate(quinzeDiasAtras.getDate() - 15);

    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30);

    const alertas: Alerta[] = [];

    // =========================
    // DADOS DA ACADEMIA
    // =========================
    const { data: academia, error: academiaError } = await supabaseServer
      .from("academias")
      .select(
        "id, nome, limite_alunos, mp_connected, chave_pix, ativa, plano, mp_access_token"
      )
      .eq("id", academiaId)
      .single();

    if (academiaError) {
      return NextResponse.json({ error: academiaError.message }, { status: 500 });
    }

    // =========================
    // ALUNOS
    // =========================
    const { data: alunosAtivos, error: alunosError } = await supabaseServer
      .from("alunos")
      .select("id, nome, ativo, created_at, telefone, cpf, status")
      .eq("academia_id", academiaId)
      .eq("ativo", true);

    if (alunosError) {
      return NextResponse.json({ error: alunosError.message }, { status: 500 });
    }

    const totalAlunosAtivos = alunosAtivos?.length || 0;

    if (academia?.limite_alunos && totalAlunosAtivos > 0) {
      const porcentagem = (totalAlunosAtivos / academia.limite_alunos) * 100;

      if (porcentagem >= 90) {
        alertas.push({
          id: "limite-alunos-quase-atingido",
          titulo: "Limite de alunos quase atingido",
          descricao: `${totalAlunosAtivos} de ${academia.limite_alunos} alunos cadastrados.`,
          nivel: porcentagem >= 100 ? "danger" : "warning",
          modulo: "sistema",
          href: "/sistema",
          perfis: ["admin", "superadmin"],
          mostrarPopup: porcentagem >= 100,
          total: totalAlunosAtivos,
        });
      }
    }

    const alunosSemTelefoneOuCpf = (alunosAtivos || []).filter(
      (aluno) => !String(aluno.telefone || "").trim() || !String(aluno.cpf || "").trim()
    );

    if (alunosSemTelefoneOuCpf.length > 0) {
      alertas.push({
        id: "cadastros-incompletos",
        titulo: "Cadastros incompletos",
        descricao: `${alunosSemTelefoneOuCpf.length} aluno(s) sem telefone ou CPF completo.`,
        nivel: "info",
        modulo: "alunos",
        href: "/alunos",
        perfis: ["admin", "superadmin", "recepcao"],
        total: alunosSemTelefoneOuCpf.length,
      });
    }

    const alunosSemAcesso = (alunosAtivos || []).filter((aluno) => {
      if (!aluno.created_at) return false;
      return new Date(aluno.created_at).getTime() < quinzeDiasAtras.getTime();
    });

    if (alunosSemAcesso.length > 0) {
      alertas.push({
        id: "alunos-sem-acesso-recente",
        titulo: "Alunos sem acesso recente",
        descricao: `${alunosSemAcesso.length} aluno(s) estão sem acesso recente.`,
        nivel: alunosSemAcesso.length >= 10 ? "warning" : "info",
        modulo: "alunos",
        href: "/alunos",
        perfis: ["admin", "superadmin", "personal", "recepcao"],
        total: alunosSemAcesso.length,
      });
    }

    if (alunosSemAcesso.length >= 20) {
      alertas.push({
        id: "muitos-alunos-inativos",
        titulo: "Muitos alunos inativos",
        descricao: `A academia tem ${alunosSemAcesso.length} aluno(s) sem acesso recente.`,
        nivel: "warning",
        modulo: "alunos",
        href: "/alunos",
        perfis: ["admin", "superadmin"],
        total: alunosSemAcesso.length,
      });
    }

    // =========================
    // PAGAMENTOS
    // =========================
    const { data: mensalidadesPendentes, error: mensalidadesError } =
      await supabaseServer
        .from("financeiro_pagamentos")
        .select("id, aluno_id, vencimento, status, valor, competencia")
        .eq("academia_id", academiaId)
        .neq("status", "pago");

    if (mensalidadesError) {
      return NextResponse.json({ error: mensalidadesError.message }, { status: 500 });
    }

    const mensalidadesVencidas =
      mensalidadesPendentes?.filter(
        (m) => String(m.vencimento || "") < hojeStr
      ) || [];

    const mensalidadesHoje =
      mensalidadesPendentes?.filter(
        (m) => String(m.vencimento || "") === hojeStr
      ) || [];

    if (mensalidadesVencidas.length > 0) {
      alertas.push({
        id: "mensalidades-vencidas",
        titulo: "Mensalidades vencidas",
        descricao: `Existem ${mensalidadesVencidas.length} mensalidade(s) vencida(s).`,
        nivel: mensalidadesVencidas.length >= 10 ? "danger" : "warning",
        modulo: "financeiro",
        href: "/pagamentos",
        perfis: ["admin", "superadmin", "recepcao"],
        mostrarPopup: mensalidadesVencidas.length >= 5,
        total: mensalidadesVencidas.length,
      });
    }

    if (mensalidadesHoje.length > 0) {
      alertas.push({
        id: "mensalidades-vencendo-hoje",
        titulo: "Mensalidades vencendo hoje",
        descricao: `Existem ${mensalidadesHoje.length} mensalidade(s) vencendo hoje.`,
        nivel: "warning",
        modulo: "financeiro",
        href: "/pagamentos",
        perfis: ["admin", "superadmin", "recepcao"],
        total: mensalidadesHoje.length,
      });
    }

    if (mensalidadesVencidas.length > 0) {
      const alunoIdsInadimplentes = new Set(
        mensalidadesVencidas.map((m) => Number(m.aluno_id))
      );

      alertas.push({
        id: "alunos-inadimplentes",
        titulo: "Alunos inadimplentes",
        descricao: `${alunoIdsInadimplentes.size} aluno(s) estão com mensalidade vencida.`,
        nivel: alunoIdsInadimplentes.size >= 10 ? "danger" : "warning",
        modulo: "financeiro",
        href: "/pagamentos",
        perfis: ["admin", "superadmin", "recepcao"],
        total: alunoIdsInadimplentes.size,
      });
    }

    // =========================
    // DESPESAS
    // =========================
    const { data: despesasPendentes, error: despesasError } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, descricao, valor, data_lancamento, status, tipo")
      .eq("academia_id", academiaId)
      .neq("status", "pago");

    if (despesasError) {
      return NextResponse.json({ error: despesasError.message }, { status: 500 });
    }

    const totalDespesasPendentes = despesasPendentes?.length || 0;

    const totalDespesasHoje =
      despesasPendentes?.filter(
        (d) => String(d.data_lancamento || "") <= hojeStr
      ).length || 0;

    if (totalDespesasHoje > 0) {
      alertas.push({
        id: "contas-a-pagar-hoje",
        titulo: "Contas a pagar",
        descricao: `Você tem ${totalDespesasHoje} conta(s) com vencimento hoje ou anterior.`,
        nivel: totalDespesasHoje >= 3 ? "danger" : "warning",
        modulo: "financeiro",
        href: "/financeiro/despesas",
        perfis: ["admin", "superadmin"],
        mostrarPopup: true,
        total: totalDespesasHoje,
      });
    }

    if (totalDespesasPendentes > 0) {
      alertas.push({
        id: "despesas-pendentes",
        titulo: "Despesas pendentes",
        descricao: `Existem ${totalDespesasPendentes} despesa(s) pendente(s).`,
        nivel: totalDespesasPendentes >= 10 ? "warning" : "info",
        modulo: "financeiro",
        href: "/financeiro/despesas",
        perfis: ["admin", "superadmin"],
        total: totalDespesasPendentes,
      });
    }

    // =========================
    // TREINOS
    // =========================
    const { data: treinosAtivos, error: treinosError } = await supabaseServer
      .from("treinos_personalizados")
      .select("id, aluno_id, updated_at, ativo")
      .eq("academia_id", academiaId)
      .eq("ativo", true);

    if (treinosError) {
      return NextResponse.json({ error: treinosError.message }, { status: 500 });
    }

    const treinosDesatualizados =
      treinosAtivos?.filter(
        (t) =>
          t.updated_at &&
          new Date(t.updated_at).getTime() < seteDiasAtras.getTime()
      ) || [];

    if (treinosDesatualizados.length > 0) {
      alertas.push({
        id: "treinos-desatualizados",
        titulo: "Treinos sem atualização",
        descricao: `Há ${treinosDesatualizados.length} treino(s) sem atualização há mais de 7 dias.`,
        nivel: treinosDesatualizados.length >= 10 ? "danger" : "warning",
        modulo: "treinos",
        href: "/treinos-personalizados",
        perfis: ["admin", "superadmin", "personal"],
        mostrarPopup: treinosDesatualizados.length >= 5,
        total: treinosDesatualizados.length,
      });
    }

    const alunoIdsComTreinoAtivo = new Set(
      (treinosAtivos || []).map((t) => Number(t.aluno_id))
    );

    const alunosSemTreino = (alunosAtivos || []).filter(
      (aluno) => !alunoIdsComTreinoAtivo.has(Number(aluno.id))
    );

    if (alunosSemTreino.length > 0) {
      alertas.push({
        id: "alunos-sem-treino-ativo",
        titulo: "Alunos sem treino ativo",
        descricao: `Existem ${alunosSemTreino.length} aluno(s) sem treino ativo.`,
        nivel: alunosSemTreino.length >= 10 ? "danger" : "warning",
        modulo: "treinos",
        href: "/treinos-personalizados",
        perfis: ["admin", "superadmin", "personal"],
        total: alunosSemTreino.length,
      });
    }

    if (treinosDesatualizados.length >= 15) {
      alertas.push({
        id: "revisao-massa-treinos",
        titulo: "Revisão de treinos necessária",
        descricao: `Há muitos treinos para revisar: ${treinosDesatualizados.length} em atraso.`,
        nivel: "warning",
        modulo: "treinos",
        href: "/treinos-personalizados",
        perfis: ["admin", "superadmin", "personal"],
        total: treinosDesatualizados.length,
      });
    }

    // =========================
    // AVALIAÇÕES / REVISÃO GERAL
    // Como não vimos tabela completa aqui, usamos um alerta mais simples
    // baseado em alunos ativos sem revisão longa de treino
    // =========================
    const alunosSemRevisaoLonga = treinosAtivos?.filter(
      (t) =>
        t.updated_at &&
        new Date(t.updated_at).getTime() < trintaDiasAtras.getTime()
    ) || [];

    if (alunosSemRevisaoLonga.length > 0) {
      alertas.push({
        id: "treinos-muito-antigos",
        titulo: "Treinos muito antigos",
        descricao: `${alunosSemRevisaoLonga.length} treino(s) estão sem revisão há mais de 30 dias.`,
        nivel: "warning",
        modulo: "treinos",
        href: "/treinos-personalizados",
        perfis: ["admin", "superadmin", "personal"],
        total: alunosSemRevisaoLonga.length,
      });
    }

    // =========================
    // SISTEMA
    // =========================
    if (!academia?.mp_connected) {
      alertas.push({
        id: "mercado-pago-desconectado",
        titulo: "Mercado Pago não conectado",
        descricao: "Configure o Mercado Pago para cobranças online.",
        nivel: "warning",
        modulo: "sistema",
        href: "/financeiro",
        perfis: ["admin", "superadmin"],
        mostrarPopup: true,
      });
    }

    if (!String(academia?.chave_pix || "").trim()) {
      alertas.push({
        id: "pix-nao-configurado",
        titulo: "PIX não configurado",
        descricao: "Cadastre uma chave PIX para facilitar cobranças.",
        nivel: "info",
        modulo: "sistema",
        href: "/financeiro",
        perfis: ["admin", "superadmin"],
      });
    }

    if (!academia?.ativa) {
      alertas.push({
        id: "academia-inativa",
        titulo: "Academia inativa",
        descricao: "A academia está marcada como inativa no sistema.",
        nivel: "danger",
        modulo: "sistema",
        href: "/sistema",
        perfis: ["admin", "superadmin"],
        mostrarPopup: true,
      });
    }

    // =========================
    // FILTRO POR PERFIL
    // Admin e superadmin veem tudo
    // =========================
    const filtrados =
      tipo === "admin" || tipo === "superadmin"
        ? alertas
        : alertas.filter((alerta) => alerta.perfis.includes(tipo));

    return NextResponse.json(filtrados);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar alertas" },
      { status: 400 }
    );
  }
}