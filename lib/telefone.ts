export function limparTelefone(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

export function normalizarTelefoneBR(valor: string) {
  let digits = limparTelefone(valor);

  if (!digits) return "";

  digits = digits.replace(/^0+/, "");

  // 11 dígitos sem DDI: DDD + 9 + número
  if (digits.length === 11) {
    digits = `55${digits}`;
  }

  // 10 dígitos sem DDI: DDD + número sem 9
  if (digits.length === 10) {
    digits = `55${digits.slice(0, 2)}9${digits.slice(2)}`;
  }

  // 12 dígitos com 55 mas sem o 9
  if (digits.length === 12 && digits.startsWith("55")) {
    digits = digits.slice(0, 4) + "9" + digits.slice(4);
  }

  return digits;
}

export function telefoneBRValido(valor: string) {
  const digits = normalizarTelefoneBR(valor);
  return /^55\d{2}9\d{8}$/.test(digits);
}

export function formatarTelefoneDigitacao(valor: string) {
  const digits = limparTelefone(valor).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatarTelefoneExibicao(valor?: string | null) {
  const digits = limparTelefone(valor || "");

  if (digits.startsWith("55") && digits.length === 13) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return valor || "-";
}