import { supabaseAdmin } from "@/lib/supabase-admin";

export type WhatsAppConversa = {
  id: string;
  academia_id: string;
  aluno_id?: number | null;
  telefone: string;
  nome_contato?: string | null;
  setor: "recepcao" | "professor" | "financeiro";
  status: "aberta" | "em_atendimento" | "encerrada";
  ultima_mensagem?: string | null;
  ultima_mensagem_em?: string | null;
  nao_lidas: number;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  atribuido_em?: string | null;
  created_at?: string;
};

export type WhatsAppMensagem = {
  id: string;
  conversa_id: string;
  academia_id: string;
  aluno_id?: number | null;
  origem: "aluno" | "bot" | "recepcao" | "professor" | "sistema";
  mensagem: string;
  lida: boolean;
  created_at: string;
};

export async function listarConversas(params: {
  academiaId: string;
  setor?: string;
  status?: string;
}) {
  let query = supabaseAdmin
    .from("whatsapp_conversas")
    .select("*")
    .eq("academia_id", params.academiaId)
    .order("ultima_mensagem_em", { ascending: false });

  if (params.setor && params.setor !== "todos") {
    query = query.eq("setor", params.setor);
  }

  if (params.status && params.status !== "todos") {
    query = query.eq("status", params.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as WhatsAppConversa[];
}

export async function listarMensagens(conversaId: string) {
  const { data, error } = await supabaseAdmin
    .from("whatsapp_mensagens")
    .select("*")
    .eq("conversa_id", conversaId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as WhatsAppMensagem[];
}

export async function enviarMensagemManual(params: {
  conversaId: string;
  academiaId: string;
  alunoId?: number | null;
  telefone: string;
  mensagem: string;
  origem: "recepcao" | "professor";
}) {
  const { error } = await supabaseAdmin.rpc("whatsapp_salvar_mensagem", {
    p_conversa_id: params.conversaId,
    p_academia_id: params.academiaId,
    p_aluno_id: params.alunoId || null,
    p_origem: params.origem,
    p_mensagem: params.mensagem,
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

export async function marcarConversaComoLida(conversaId: string) {
  const { error } = await supabaseAdmin.rpc("whatsapp_marcar_lidas", {
    p_conversa_id: conversaId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function obterOuCriarConversa(params: {
  academiaId: string;
  alunoId?: number | null;
  telefone: string;
  nome?: string | null;
}) {
  const { data, error } = await supabaseAdmin.rpc(
    "whatsapp_obter_ou_criar_conversa",
    {
      p_academia_id: params.academiaId,
      p_aluno_id: params.alunoId || null,
      p_telefone: params.telefone,
      p_nome_contato: params.nome || null,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as WhatsAppConversa;
}

export async function salvarMensagemAluno(params: {
  conversaId: string;
  academiaId: string;
  alunoId?: number | null;
  mensagem: string;
}) {
  const { error } = await supabaseAdmin.rpc("whatsapp_salvar_mensagem", {
    p_conversa_id: params.conversaId,
    p_academia_id: params.academiaId,
    p_aluno_id: params.alunoId || null,
    p_origem: "aluno",
    p_mensagem: params.mensagem,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function atualizarSetorConversa(
  conversaId: string,
  setor: "recepcao" | "professor" | "financeiro"
) {
  const { error } = await supabaseAdmin
    .from("whatsapp_conversas")
    .update({ setor })
    .eq("id", conversaId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function atribuirAtendente(params: {
  conversaId: string;
  responsavelId: string;
  responsavelNome: string;
}) {
  const { error } = await supabaseAdmin.rpc("whatsapp_atribuir_atendente", {
    p_conversa_id: params.conversaId,
    p_responsavel_id: params.responsavelId,
    p_responsavel_nome: params.responsavelNome,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function liberarAtendimento(conversaId: string) {
  const { error } = await supabaseAdmin.rpc("whatsapp_liberar_atendimento", {
    p_conversa_id: conversaId,
  });

  if (error) {
    throw new Error(error.message);
  }
}