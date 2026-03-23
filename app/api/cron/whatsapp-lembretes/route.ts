import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendWhatsAppText } from "@/lib/whatsapp";
import {
  listarAutomacoesAtivas,
  jaEnviadoAutomatico,
  registrarEnvioAutomatico,
} from "@/lib/db/whatsapp-automacoes";
import { obterOuCriarConversa } from "@/lib/db/whatsapp";

function limparNumero(numero: string) {
  return String(numero || "").replace(/\D/g, "");
}

function formatarDataBR(data?: string | null) {
  if (!data) return "-";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const d = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

function diffDias(inicio: Date, fim: Date) {
  const ms = fim.getTime() - inicio.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function hojeYmd() {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, "0");
  const d = String(hoje.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function aplicarTemplate(
  template: string | null | undefined,
  fallback: string,
  vars: Record<string, string | number | null | undefined>
) {
  let texto = String(template || "").trim() || fallback;

  for (const [chave, valor] of Object.entries(vars)) {
    texto = texto.replaceAll(`{${chave}}`, String(valor ?? ""));
  }

  return texto;
}

async function salvarMensagemSistema(params: {
  academiaId: string;
  alunoId: number;
  telefone: string;
  nome: string;
  mensagem: string;
  setor?: "recepcao" | "professor" | "financeiro";
}) {
  const conversa = await obterOuCriarConversa({
    academiaId: params.academiaId,
    alunoId: params.alunoId,
    telefone: params.telefone,
    nome: params.nome,
  });

  if (params.setor) {
    await supabaseAdmin
      .from("whatsapp_conversas")
      .update({ setor: params.setor })
      .eq("id", conversa.id);
  }

  await supabaseAdmin.rpc("whatsapp_salvar_mensagem", {
    p_conversa_id: conversa.id,
    p_academia_id: params.academiaId,
    p_aluno_id: params.alunoId,
    p_origem: "sistema",
    p_mensagem: params.mensagem,
  });
}

async function processarInatividade7d(params: {
  academiaId: string;
  templateMensagem?: string | null;
}) {
  const { data: alunos, error } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, telefone, academia_id, ativo")
    .eq("academia_id", params.academiaId)
    .eq("ativo", true);

  if (error) throw new Error(error.message);

  for (const aluno of alunos || []) {
    const telefone = limparNumero(aluno.telefone || "");
    if (!telefone) continue;

    const { data: historico, error: historicoError } = await supabaseAdmin
      .from("historico_impressoes")
      .select("created_at")
      .eq("academia_id", params.academiaId)
      .eq("aluno_id", aluno.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (historicoError) continue;
    if (!historico?.created_at) continue;

    const ultimaAtividade = new Date(historico.created_at);
    const diasSemTreino = diffDias(ultimaAtividade, new Date());

    if (diasSemTreino < 7) continue;

    const referencia = `inatividade_7d:${params.academiaId}:${aluno.id}:${hojeYmd()}`;
    const jaEnviado = await jaEnviadoAutomatico(referencia);
    if (jaEnviado) continue;

    const primeiroNome = String(aluno.nome || "").split(" ")[0] || "aluno";

    const fallback =
      `Olá, ${primeiroNome} 👋\n\n` +
      `Notamos que você está há alguns dias sem registrar treino.\n\n` +
      `Seu treino continua disponível.\n` +
      `Digite 1 para ver seu treino e voltar com tudo 💪`;

    const mensagem = aplicarTemplate(params.templateMensagem, fallback, {
      nome: primeiroNome,
      dias: diasSemTreino,
    });

    try {
      await sendWhatsAppText(telefone, mensagem);

      await registrarEnvioAutomatico({
        academiaId: params.academiaId,
        alunoId: Number(aluno.id),
        telefone,
        tipo: "inatividade_7d",
        referencia,
        mensagem,
      });

      await salvarMensagemSistema({
        academiaId: params.academiaId,
        alunoId: Number(aluno.id),
        telefone,
        nome: aluno.nome || "",
        mensagem,
        setor: "professor",
      });
    } catch (error) {
      console.error("Erro ao enviar lembrete de inatividade:", error);
    }
  }
}

async function processarFinanceiroVence2d(params: {
  academiaId: string;
  templateMensagem?: string | null;
}) {
  const hoje = new Date();

  const { data: pagamentos, error } = await supabaseAdmin
    .from("financeiro_pagamentos")
    .select(`
      id,
      aluno_id,
      competencia,
      valor,
      vencimento,
      status,
      alunos (
        id,
        nome,
        telefone
      )
    `)
    .eq("academia_id", params.academiaId)
    .neq("status", "pago");

  if (error) throw new Error(error.message);

  for (const item of pagamentos || []) {
    if (!item.vencimento || !item.aluno_id) continue;

    const venc = new Date(`${item.vencimento}T00:00:00`);
    const dias = diffDias(hoje, venc);

    if (dias !== 2) continue;

    const aluno: any = Array.isArray(item.alunos) ? item.alunos[0] : item.alunos;
    const telefone = limparNumero(aluno?.telefone || "");
    if (!telefone) continue;

    const referencia = `financeiro_vence_2d:${item.id}`;
    const jaEnviado = await jaEnviadoAutomatico(referencia);
    if (jaEnviado) continue;

    const primeiroNome = String(aluno?.nome || "").split(" ")[0] || "aluno";
    const valor = Number(item.valor || 0).toFixed(2);
    const vencimento = formatarDataBR(item.vencimento);
    const competencia = item.competencia || "mensalidade";

    const fallback =
      `Olá, ${primeiroNome} 👋\n\n` +
      `Sua mensalidade vence em breve:\n\n` +
      `• ${competencia} - R$ ${valor}\n` +
      `• Vencimento: ${vencimento}\n\n` +
      `Digite 6 para receber seu link de pagamento.`;

    const mensagem = aplicarTemplate(params.templateMensagem, fallback, {
      nome: primeiroNome,
      competencia,
      valor,
      vencimento,
      dias: 2,
    });

    try {
      await sendWhatsAppText(telefone, mensagem);

      await registrarEnvioAutomatico({
        academiaId: params.academiaId,
        alunoId: Number(item.aluno_id),
        telefone,
        tipo: "financeiro_vence_2d",
        referencia,
        mensagem,
      });

      await salvarMensagemSistema({
        academiaId: params.academiaId,
        alunoId: Number(item.aluno_id),
        telefone,
        nome: aluno?.nome || "",
        mensagem,
        setor: "financeiro",
      });
    } catch (error) {
      console.error("Erro ao enviar lembrete financeiro 2d:", error);
    }
  }
}

async function processarFinanceiroVencido3d(params: {
  academiaId: string;
  templateMensagem?: string | null;
}) {
  const hoje = new Date();

  const { data: pagamentos, error } = await supabaseAdmin
    .from("financeiro_pagamentos")
    .select(`
      id,
      aluno_id,
      competencia,
      valor,
      vencimento,
      status,
      alunos (
        id,
        nome,
        telefone
      )
    `)
    .eq("academia_id", params.academiaId)
    .neq("status", "pago");

  if (error) throw new Error(error.message);

  for (const item of pagamentos || []) {
    if (!item.vencimento || !item.aluno_id) continue;

    const venc = new Date(`${item.vencimento}T00:00:00`);
    const diasAtraso = diffDias(venc, hoje);

    if (diasAtraso !== 3) continue;

    const aluno: any = Array.isArray(item.alunos) ? item.alunos[0] : item.alunos;
    const telefone = limparNumero(aluno?.telefone || "");
    if (!telefone) continue;

    const referencia = `financeiro_vencido_3d:${item.id}`;
    const jaEnviado = await jaEnviadoAutomatico(referencia);
    if (jaEnviado) continue;

    const primeiroNome = String(aluno?.nome || "").split(" ")[0] || "aluno";
    const valor = Number(item.valor || 0).toFixed(2);
    const vencimento = formatarDataBR(item.vencimento);
    const competencia = item.competencia || "mensalidade";

    const fallback =
      `Olá, ${primeiroNome} 👋\n\n` +
      `Identificamos uma mensalidade em aberto:\n\n` +
      `• ${competencia} - R$ ${valor}\n` +
      `• Vencimento: ${vencimento}\n\n` +
      `Digite 6 para receber seu link de pagamento.`;

    const mensagem = aplicarTemplate(params.templateMensagem, fallback, {
      nome: primeiroNome,
      competencia,
      valor,
      vencimento,
      dias: 3,
    });

    try {
      await sendWhatsAppText(telefone, mensagem);

      await registrarEnvioAutomatico({
        academiaId: params.academiaId,
        alunoId: Number(item.aluno_id),
        telefone,
        tipo: "financeiro_vencido_3d",
        referencia,
        mensagem,
      });

      await salvarMensagemSistema({
        academiaId: params.academiaId,
        alunoId: Number(item.aluno_id),
        telefone,
        nome: aluno?.nome || "",
        mensagem,
        setor: "financeiro",
      });
    } catch (error) {
      console.error("Erro ao enviar lembrete financeiro vencido 3d:", error);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "";
    const authHeader = req.headers.get("authorization") || "";

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const automacoes = await listarAutomacoesAtivas();
    const academiasProcessadas = new Set<string>();

    for (const automacao of automacoes) {
      if (!automacao.academia_id) continue;
      academiasProcessadas.add(automacao.academia_id);

      if (automacao.tipo === "inatividade_7d") {
        await processarInatividade7d({
          academiaId: automacao.academia_id,
          templateMensagem: automacao.template_mensagem,
        });
      }

      if (automacao.tipo === "financeiro_vence_2d") {
        await processarFinanceiroVence2d({
          academiaId: automacao.academia_id,
          templateMensagem: automacao.template_mensagem,
        });
      }

      if (automacao.tipo === "financeiro_vencido_3d") {
        await processarFinanceiroVencido3d({
          academiaId: automacao.academia_id,
          templateMensagem: automacao.template_mensagem,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      academias_processadas: Array.from(academiasProcessadas),
      automacoes_processadas: automacoes.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao processar lembretes" },
      { status: 500 }
    );
  }
}