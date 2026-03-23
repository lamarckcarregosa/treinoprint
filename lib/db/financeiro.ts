import { supabaseAdmin } from "@/lib/supabase-admin";

export type FinanceiroItem = {
  id: number;
  competencia: string | null;
  valor: number | null;
  vencimento: string | null;
  status: string | null;
};

export async function buscarMensalidadesAbertas(
  alunoId: number,
  academiaId: string
): Promise<FinanceiroItem[]> {
  const { data, error } = await supabaseAdmin
    .from("financeiro_pagamentos")
    .select("id, competencia, valor, vencimento, status")
    .eq("aluno_id", alunoId)
    .eq("academia_id", academiaId)
    .in("status", ["aberto", "atrasado", "pendente", "em_aberto", "vencido"])
    .order("vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao buscar financeiro:", error.message);
    return [];
  }

  return (data as FinanceiroItem[]) || [];
}