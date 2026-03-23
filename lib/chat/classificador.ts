export function classificarMensagem(texto: string) {
  const msg = texto.toLowerCase();

  // financeiro
  if (
    msg.includes("pagar") ||
    msg.includes("pix") ||
    msg.includes("mensalidade") ||
    msg.includes("vencimento") ||
    msg.includes("valor")
  ) {
    return "financeiro";
  }

  // professor
  if (
    msg.includes("treino") ||
    msg.includes("exercicio") ||
    msg.includes("dor") ||
    msg.includes("lesao") ||
    msg.includes("trocar treino")
  ) {
    return "professor";
  }

  // padrão
  return "recepcao";
}