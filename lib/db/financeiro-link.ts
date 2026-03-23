import { supabaseAdmin } from "@/lib/supabase-admin";

export type PagamentoLinkAluno = {
  id: number;
  competencia: string;
  valor: number;
  vencimento: string;
  status: string;
  forma_pagamento?: string | null;
  gateway?: string | null;
  gateway_status?: string | null;
  link_pagamento?: string | null;
};

export async function buscarPagamentoAtualComLink(
  alunoId: number,
  academiaId: string
): Promise<PagamentoLinkAluno | null> {
  const { data, error } = await supabaseAdmin
    .from("financeiro_pagamentos")
    .select(`
      id,
      competencia,
      valor,
      vencimento,
      status,
      forma_pagamento,
      gateway,
      gateway_status,
      link_pagamento
    `)
    .eq("academia_id", academiaId)
    .eq("aluno_id", alunoId)
    .neq("status", "pago")
    .order("vencimento", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: Number(data.id),
    competencia: data.competencia || "",
    valor: Number(data.valor || 0),
    vencimento: data.vencimento || "",
    status: data.status || "pendente",
    forma_pagamento: data.forma_pagamento || null,
    gateway: data.gateway || null,
    gateway_status: data.gateway_status || null,
    link_pagamento: data.link_pagamento || null,
  };
}