import { supabaseAdmin } from "@/lib/supabase-admin";

export type AutomacaoWhatsApp = {
  id: string;
  academia_id: string;
  tipo: "inatividade_7d" | "financeiro_vence_2d" | "financeiro_vencido_3d";
  ativo: boolean;
  template_mensagem?: string | null;
};

export async function listarAutomacoesAtivas() {
  const { data, error } = await supabaseAdmin
    .from("whatsapp_automacoes")
    .select("*")
    .eq("ativo", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as AutomacaoWhatsApp[];
}

export async function jaEnviadoAutomatico(referencia: string) {
  const { data, error } = await supabaseAdmin
    .from("whatsapp_envios_automaticos")
    .select("id")
    .eq("referencia", referencia)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return !!data;
}

export async function registrarEnvioAutomatico(params: {
  academiaId: string;
  alunoId: number;
  telefone: string;
  tipo: string;
  referencia: string;
  mensagem: string;
  status?: string;
}) {
  const { error } = await supabaseAdmin
    .from("whatsapp_envios_automaticos")
    .insert({
      academia_id: params.academiaId,
      aluno_id: params.alunoId,
      telefone: params.telefone,
      tipo: params.tipo,
      referencia: params.referencia,
      mensagem: params.mensagem,
      status: params.status || "enviado",
    });

  if (error) {
    throw new Error(error.message);
  }
}