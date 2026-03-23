import { sendWhatsAppText } from "@/lib/whatsapp";
import { buscarAlunoPorTelefone } from "@/lib/db/alunos";
import { buscarTreinoDoDia } from "@/lib/db/treinos";
import { buscarMensalidadesAbertas } from "@/lib/db/financeiro";

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
    const treino = await buscarTreinoDoDia(aluno.id, academiaId);
    resposta = treino ? montarRespostaTreino(nome, treino) : respostaSemTreino(nome);
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
    contemAlgum(msg, ["professor", "personal", "instrutor", "dor", "lesao", "lesão"])
  ) {
    resposta = respostaProfessor(nome);
  } else if (
    msg === "5" ||
    contemAlgum(msg, ["recepcao", "recepção", "atendente", "planos", "matricula", "matrícula"])
  ) {
    resposta = respostaRecepcao(nome);
  } else {
    resposta = respostaFallback(nome);
  }

  await sendWhatsAppText(telefoneResposta, resposta);
}

/* helpers */

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
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

/* respostas */

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
    nome: string;
    treino_exercicios?: Array<{
      exercicio_nome?: string | null;
      nome?: string | null;
      series?: string | null;
      repeticoes?: string | null;
      carga?: string | null;
    }>;
  }
) {
  const exercicios = treino.treino_exercicios || [];

  if (!exercicios.length) {
    return (
      `💪 ${nome}, encontrei seu treino *${treino.nome}*, mas ele ainda não possui exercícios cadastrados.\n\n` +
      "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
    );
  }

  const linhas = exercicios
    .slice(0, 8)
    .map((ex) => {
      const nomeEx = ex.exercicio_nome || ex.nome || "Exercício";
      const sr =
        ex.series && ex.repeticoes ? ` — ${ex.series}x${ex.repeticoes}` : "";
      const carga = ex.carga ? ` | carga: ${ex.carga}` : "";
      return `• ${nomeEx}${sr}${carga}`;
    })
    .join("\n");

  return (
    `💪 ${nome}, seu treino de hoje é *${treino.nome}*:\n\n` +
    `${linhas}\n\n` +
    "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
  );
}

function respostaSemTreino(nome: string) {
  return (
    `💪 ${nome}, não encontrei treino ativo para hoje.\n\n` +
    "Digite:\n4️⃣ Falar com professor\n0️⃣ Menu"
  );
}

function montarRespostaFinanceiro(
  nome: string,
  itens: Array<{
    competencia?: string | null;
    valor?: number | null;
    vencimento?: string | null;
  }>
) {
  if (!itens.length) {
    return (
      `💰 ${nome}, você está em dia com a academia ✅\n\n` +
      "Digite:\n0️⃣ Menu"
    );
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
    "Digite:\n5️⃣ Falar com recepção\n0️⃣ Menu"
  );
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