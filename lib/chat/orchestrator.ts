import { sendWhatsAppText } from "@/lib/whatsapp";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buscarAlunoPorTelefone } from "@/lib/db/alunos";
import { buscarTreinoDoAluno } from "@/lib/db/treinos";
import { buscarMensalidadesAbertas } from "@/lib/db/financeiro";
import { buscarPagamentoAtualComLink } from "@/lib/db/financeiro-link";
import {
  obterOuCriarConversa,
  salvarMensagemAluno,
  atualizarSetorConversa,
} from "@/lib/db/whatsapp";
import { classificarMensagem } from "@/lib/chat/classificador";

type ProcessMessageParams = {
  telefone: string;
  texto: string;
};

export async function processarMensagem({
  telefone,
  texto,
}: ProcessMessageParams) {
  const telefoneResposta = limparNumero(telefone);
  const msg = normalizarTexto(texto);

  console.log("Telefone para resposta:", telefoneResposta);

  const aluno = await buscarAlunoPorTelefone(telefoneResposta);

  if (!aluno) {
    await sendWhatsAppText(
      telefoneResposta,
      "Olá 👋\n\nNão encontrei seu cadastro por este número.\n\nProcure a recepção da sua academia para atualizar seu telefone."
    );
    return;
  }

  const nome = primeiroNome(aluno.nome);
  const academiaId = aluno.academia_id;

  console.log("Aluno encontrado:", aluno.nome);
  console.log("Academia ID:", academiaId);

  const conversa = await obterOuCriarConversa({
    academiaId,
    alunoId: aluno.id,
    telefone: telefoneResposta,
    nome: aluno.nome,
  });

  await salvarMensagemAluno({
    conversaId: conversa.id,
    academiaId,
    alunoId: aluno.id,
    mensagem: texto,
  });

  const setor = classificarMensagem(texto) as
    | "recepcao"
    | "professor"
    | "financeiro";

  await atualizarSetorConversa(conversa.id, setor);

  console.log("Conversa ID:", conversa.id);
  console.log("Setor definido:", setor);

  let resposta = "";

  if (ehSaudacao(msg) || msg === "menu" || msg === "0") {
    resposta = menuPrincipal(nome);
  } else if (
    msg === "1" ||
    contemAlgum(msg, [
      "treino",
      "meu treino",
      "treino de hoje",
      "ver treino",
      "manda meu treino",
    ])
  ) {
    const treino = await buscarTreinoDoAluno(aluno.id, academiaId);
    console.log("Treino encontrado no WhatsApp:", JSON.stringify(treino, null, 2));
    resposta = treino
      ? montarRespostaTreino(nome, treino)
      : respostaSemTreino(nome);
  } else if (
    msg === "2" ||
    contemAlgum(msg, [
      "financeiro",
      "mensalidade",
      "vencimento",
      "pagar",
      "pagamento",
      "pix",
      "quanto devo",
      "debito",
      "débito",
      "valor",
    ])
  ) {
    const itens = await buscarMensalidadesAbertas(aluno.id, academiaId);
    resposta = montarRespostaFinanceiro(nome, itens);
  } else if (
    msg === "3" ||
    contemAlgum(msg, [
      "horario",
      "horário",
      "horarios",
      "horários",
      "funcionamento",
    ])
  ) {
    resposta = respostaHorarios(nome);
  } else if (
    msg === "4" ||
    contemAlgum(msg, [
      "professor",
      "personal",
      "instrutor",
      "duvida",
      "dúvida",
      "dor",
      "lesao",
      "lesão",
      "desconforto",
      "trocar treino",
      "troca treino",
    ])
  ) {
    resposta = respostaProfessor(nome);
  } else if (
    msg === "5" ||
    contemAlgum(msg, [
      "recepcao",
      "recepção",
      "atendente",
      "planos",
      "matricula",
      "matrícula",
      "localizacao",
      "localização",
      "endereco",
      "endereço",
    ])
  ) {
    resposta = respostaRecepcao(nome);
  } else if (
    msg === "6" ||
    contemAlgum(msg, [
      "link de pagamento",
      "abrir link",
      "quero pagar",
      "pagar agora",
      "segunda via",
      "segunda via pagamento",
      "link pix",
    ])
  ) {
    resposta = await processarSolicitacaoLinkPagamento(
      aluno.id,
      academiaId,
      nome
    );
  } else {
    resposta = respostaFallback(nome);
  }

  await sendWhatsAppText(telefoneResposta, resposta);

  await supabaseAdmin.rpc("whatsapp_salvar_mensagem", {
    p_conversa_id: conversa.id,
    p_academia_id: academiaId,
    p_aluno_id: aluno.id,
    p_origem: "bot",
    p_mensagem: resposta,
  });
}

/* =========================
   HELPERS
   ========================= */

function limparNumero(numero: string) {
  return String(numero || "").replace(/\D/g, "");
}

function normalizarTexto(texto: string) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function contemAlgum(texto: string, termos: string[]) {
  return termos.some((termo) => texto.includes(normalizarTexto(termo)));
}

function ehSaudacao(texto: string) {
  return contemAlgum(texto, [
    "oi",
    "ola",
    "bom dia",
    "boa tarde",
    "boa noite",
    "opa",
    "e ai",
    "eai",
  ]);
}

function primeiroNome(nome: string) {
  return String(nome || "").trim().split(" ")[0] || "aluno";
}

function formatarDataBR(data?: string | null) {
  if (!data) return "-";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const d = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

/* =========================
   RESPOSTAS
   ========================= */

function menuPrincipal(nome: string) {
  return (
    `Olá, ${nome} 👋\n\n` +
    "Bem-vindo ao atendimento automático da academia 💪\n\n" +
    "1️⃣ Ver treino\n" +
    "2️⃣ Financeiro\n" +
    "3️⃣ Horários\n" +
    "4️⃣ Falar com professor\n" +
    "5️⃣ Recepção\n" +
    "0️⃣ Menu"
  );
}

function montarRespostaTreino(
  nome: string,
  treino: {
    titulo?: string | null;
    nome?: string | null;
    dia?: string | null;
    exercicios?: Array<{
      nome?: string | null;
      exercicio_nome?: string | null;
      series?: string | null;
      repeticoes?: string | null;
      carga?: string | null;
      descanso?: string | null;
      obs?: string | null;
      observacoes?: string | null;
    }>;
  }
) {
  const tituloTreino =
    treino.titulo || treino.nome || treino.dia || "Treino atual";

  const exercicios = Array.isArray(treino.exercicios) ? treino.exercicios : [];

  if (!exercicios.length) {
    return (
      `💪 ${nome}, encontrei seu treino *${tituloTreino}*, mas ele ainda não possui exercícios cadastrados.\n\n` +
      "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
    );
  }

  const linhas = exercicios
    .slice(0, 8)
    .map((ex, index) => {
      const nomeEx = ex.nome || ex.exercicio_nome || `Exercício ${index + 1}`;
      const sr =
        ex.series && ex.repeticoes ? ` — ${ex.series}x${ex.repeticoes}` : "";
      const carga = ex.carga ? ` | carga: ${ex.carga}` : "";
      const descanso = ex.descanso ? ` | descanso: ${ex.descanso}` : "";
      return `• ${nomeEx}${sr}${carga}${descanso}`;
    })
    .join("\n");

  return (
    `💪 ${nome}, seu treino é *${tituloTreino}*:\n\n` +
    `${linhas}\n\n` +
    "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
  );
}

function respostaSemTreino(nome: string) {
  return (
    `💪 ${nome}, não encontrei treino ativo para você no momento.\n\n` +
    "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
  );
}

function montarRespostaFinanceiro(
  nome: string,
  itens: Array<{
    id?: number | null;
    competencia?: string | null;
    valor?: number | null;
    vencimento?: string | null;
  }>
) {
  if (!itens.length) {
    return `💰 ${nome}, você está em dia com a academia ✅\n\nDigite:\n0️⃣ Menu`;
  }

  const total = itens.reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const linhas = itens
    .slice(0, 5)
    .map((item) => {
      const comp = item.competencia || "mensalidade";
      const val = Number(item.valor || 0).toFixed(2);
      const venc = formatarDataBR(item.vencimento);
      return `• ${comp}: R$ ${val} (venc. ${venc})`;
    })
    .join("\n");

  return (
    `💰 ${nome}, você possui ${itens.length} mensalidade(s) em aberto.\n` +
    `Total: R$ ${total.toFixed(2)}\n\n` +
    `${linhas}\n\n` +
    "Digite:\n" +
    "6️⃣ Solicitar link de pagamento\n" +
    "5️⃣ Falar com recepção\n" +
    "0️⃣ Menu"
  );
}

async function processarSolicitacaoLinkPagamento(
  alunoId: number,
  academiaId: string,
  nome: string
) {
  try {
    const pagamento = await buscarPagamentoAtualComLink(alunoId, academiaId);

    if (!pagamento) {
      return (
        `💰 ${nome}, você não possui mensalidades em aberto no momento.\n\n` +
        "Digite:\n0️⃣ Menu"
      );
    }

    if (!pagamento.link_pagamento) {
      return (
        `💳 ${nome}, encontrei sua mensalidade *${pagamento.competencia}* no valor de R$ ${pagamento.valor.toFixed(
          2
        )}, mas sua academia ainda não gerou uma cobrança online para ela.\n\n` +
        "Digite:\n5️⃣ Falar com recepção\n0️⃣ Menu"
      );
    }

    const venc = formatarDataBR(pagamento.vencimento);

    return (
      `💳 ${nome}, segue seu link de pagamento:\n\n` +
      `${pagamento.link_pagamento}\n\n` +
      `Competência: ${pagamento.competencia}\n` +
      `Valor: R$ ${pagamento.valor.toFixed(2)}\n` +
      `Vencimento: ${venc}\n` +
      `${pagamento.gateway ? `Gateway: ${pagamento.gateway}\n` : ""}` +
      `${
        pagamento.gateway_status
          ? `Status online: ${pagamento.gateway_status}\n`
          : ""
      }\n` +
      "Após o pagamento, a confirmação pode levar alguns instantes.\n\n" +
      "Digite:\n0️⃣ Menu"
    );
  } catch (error) {
    console.error("Erro ao buscar link de pagamento:", error);

    return (
      `💳 ${nome}, não consegui recuperar seu link de pagamento agora.\n\n` +
      "Digite:\n5️⃣ Falar com recepção\n0️⃣ Menu"
    );
  }
}

function respostaHorarios(nome: string) {
  return (
    `🕐 ${nome}, horário de funcionamento:\n\n` +
    "Segunda a sexta: 05h às 22h\n" +
    "Sábado: 08h às 14h\n" +
    "Domingo: Fechado\n\n" +
    "Digite:\n5️⃣ Falar com recepção\n0️⃣ Menu"
  );
}

function respostaProfessor(nome: string) {
  return (
    `👨‍🏫 ${nome}, seu atendimento foi encaminhado ao professor.\n\n` +
    "Se quiser agilizar, envie também sua dúvida ou o exercício relacionado."
  );
}

function respostaRecepcao(nome: string) {
  return (
    `🏢 ${nome}, sua solicitação foi encaminhada para a recepção.\n\n` +
    "Em breve continuam com você por aqui."
  );
}

function respostaFallback(nome: string) {
  return (
    `🤖 ${nome}, posso te ajudar com:\n\n` +
    "1️⃣ Treino\n" +
    "2️⃣ Financeiro\n" +
    "3️⃣ Horários\n" +
    "4️⃣ Professor\n" +
    "5️⃣ Recepção\n" +
    "0️⃣ Menu"
  );
}