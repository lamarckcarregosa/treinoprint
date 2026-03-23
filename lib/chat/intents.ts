import { openai } from "@/lib/openai";

export type IntentResult = {
  intent:
    | "saudacao"
    | "ver_treino"
    | "treino_hoje"
    | "trocar_treino"
    | "consultar_mensalidade"
    | "gerar_pagamento"
    | "falar_com_atendente"
    | "falar_com_professor"
    | "horario_funcionamento"
    | "localizacao"
    | "dor_ou_lesao"
    | "cancelamento"
    | "reclamacao"
    | "erro_cadastro"
    | "duvida_geral";
  confianca: number;
  precisa_handoff: boolean;
  motivo_handoff: string | null;
  resposta_curta: string | null;
};

export async function classificarIntent(params: {
  mensagem: string;
  contexto?: {
    nome?: string | null;
    alunoAtivo?: boolean | null;
    possuiPendencia?: boolean | null;
  };
}): Promise<IntentResult> {
  const mensagem = (params.mensagem || "").trim().toLowerCase();

  if (["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(mensagem)) {
    return {
      intent: "saudacao",
      confianca: 0.99,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }

  if (
    mensagem.includes("treino") &&
    (mensagem.includes("hoje") ||
      mensagem.includes("manda") ||
      mensagem.includes("enviar") ||
      mensagem.includes("meu"))
  ) {
    return {
      intent: "ver_treino",
      confianca: 0.95,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }

  if (
    mensagem.includes("mensalidade") ||
    mensagem.includes("devo") ||
    mensagem.includes("vencimento") ||
    mensagem.includes("pagar") ||
    mensagem.includes("pagamento")
  ) {
    return {
      intent: "consultar_mensalidade",
      confianca: 0.93,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }

  if (
    mensagem.includes("professor") ||
    mensagem.includes("personal") ||
    mensagem.includes("instrutor")
  ) {
    return {
      intent: "falar_com_professor",
      confianca: 0.95,
      precisa_handoff: true,
      motivo_handoff: "falar_com_professor",
      resposta_curta: null,
    };
  }

  if (
    mensagem.includes("dor") ||
    mensagem.includes("lesão") ||
    mensagem.includes("lesao") ||
    mensagem.includes("machuquei") ||
    mensagem.includes("joelho") ||
    mensagem.includes("ombro") ||
    mensagem.includes("coluna")
  ) {
    return {
      intent: "dor_ou_lesao",
      confianca: 0.98,
      precisa_handoff: true,
      motivo_handoff: "dor_ou_lesao",
      resposta_curta: null,
    };
  }

  if (
    mensagem === "1" ||
    mensagem.includes("ver treino") ||
    mensagem.includes("treino de hoje")
  ) {
    return {
      intent: "ver_treino",
      confianca: 0.99,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }

  if (
    mensagem === "2" ||
    mensagem.includes("consultar mensalidade") ||
    mensagem.includes("ver mensalidade")
  ) {
    return {
      intent: "consultar_mensalidade",
      confianca: 0.99,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }

  if (mensagem === "3") {
    return {
      intent: "falar_com_professor",
      confianca: 0.99,
      precisa_handoff: true,
      motivo_handoff: "falar_com_professor",
      resposta_curta: null,
    };
  }

  if (mensagem === "4") {
    return {
      intent: "falar_com_atendente",
      confianca: 0.99,
      precisa_handoff: true,
      motivo_handoff: "falar_com_atendente",
      resposta_curta: null,
    };
  }

  const prompt = `
Você é o classificador do chatbot TreinoPrint.

Classifique a mensagem do aluno em UMA das intents abaixo:

saudacao
ver_treino
treino_hoje
trocar_treino
consultar_mensalidade
gerar_pagamento
falar_com_atendente
falar_com_professor
horario_funcionamento
localizacao
dor_ou_lesao
cancelamento
reclamacao
erro_cadastro
duvida_geral

Regras:
- dor, lesão, incômodo físico, joelho, ombro, coluna => dor_ou_lesao
- cancelar, desistir, trancar => cancelamento
- cobrança errada, cadastro errado, dado errado => erro_cadastro
- reclamação direta => reclamacao
- "me manda meu treino", "qual meu treino", "treino de hoje" => ver_treino
- "quanto devo", "mensalidade", "vencimento" => consultar_mensalidade
- "quero pagar", "me manda o pix", "gerar pagamento" => gerar_pagamento
- "falar com recepção", "falar com atendente" => falar_com_atendente
- "falar com professor", "falar com personal" => falar_com_professor

Responda SOMENTE em JSON válido com:
{
  "intent": "duvida_geral",
  "confianca": 0.80,
  "precisa_handoff": false,
  "motivo_handoff": null,
  "resposta_curta": null
}
`;

  try {
    const response = await openai.responses.create({
      model: "gpt-5",
      input: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: JSON.stringify(params),
        },
      ],
    });

    const text = response.output_text?.trim();

    if (!text) {
      throw new Error("Resposta vazia da OpenAI");
    }

    return JSON.parse(text) as IntentResult;
  } catch (error) {
    console.error("Erro ao classificar intent com OpenAI:", error);

    return {
      intent: "duvida_geral",
      confianca: 0.5,
      precisa_handoff: false,
      motivo_handoff: null,
      resposta_curta: null,
    };
  }
}