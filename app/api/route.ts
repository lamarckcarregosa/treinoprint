import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const hoje = new Date().toISOString().slice(0, 10);

    // =========================
    // CONTAS A PAGAR HOJE
    // =========================
    const { data: despesasHoje } = await supabaseServer
      .from("financeiro_despesas")
      .select("id, descricao, valor, data_lancamento, status")
      .eq("academia_id", academiaId)
      .lte("data_lancamento", hoje)
      .neq("status", "pago");

    // =========================
    // MENSALIDADES VENCIDAS
    // =========================
    const { data: mensalidadesVencidas } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, aluno_id, valor, vencimento, status")
      .eq("academia_id", academiaId)
      .lt("vencimento", hoje)
      .neq("status", "pago");

    // =========================
    // TREINOS DESATUALIZADOS (7 dias)
    // =========================
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 7);

    const { data: treinosAntigos } = await supabaseServer
      .from("treinos_personalizados")
      .select("id, aluno_id, updated_at")
      .eq("academia_id", academiaId)
      .eq("ativo", true)
      .lt("updated_at", dataLimite.toISOString());

    // =========================
    // ALUNOS INATIVOS (simulado)
    // =========================
    const { data: alunos } = await supabaseServer
      .from("alunos")
      .select("id, nome, created_at")
      .eq("academia_id", academiaId)
      .eq("ativo", true);

    const alunosInativos =
      alunos?.filter((a) => {
        const dias =
          (Date.now() - new Date(a.created_at).getTime()) /
          (1000 * 60 * 60 * 24);
        return dias > 15;
      }) || [];

    // =========================
    // RESPOSTA FINAL
    // =========================
    return NextResponse.json({
      contasHoje: despesasHoje?.length || 0,
      mensalidadesVencidas: mensalidadesVencidas?.length || 0,
      treinosDesatualizados: treinosAntigos?.length || 0,
      alunosInativos: alunosInativos.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar alertas" },
      { status: 400 }
    );
  }
}