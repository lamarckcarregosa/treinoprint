function limparNumero(numero: string) {
  return String(numero || "").replace(/\D/g, "");
}

export async function sendWhatsAppText(to: string, body: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID não definido.");
  }

  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN não definido.");
  }

  const toDigits = limparNumero(to);

  console.log("Enviando WhatsApp para:", toDigits);

  const url = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toDigits,
      type: "text",
      text: { body },
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Erro ao enviar WhatsApp: ${JSON.stringify(data)}`);
  }

  console.log("WhatsApp enviado com sucesso:", data);

  return data;
}