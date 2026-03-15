import { NextRequest, NextResponse } from "next/server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const clientId = process.env.MP_CLIENT_ID;
    const redirectUri = process.env.MP_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Credenciais Mercado Pago não configuradas" },
        { status: 500 }
      );
    }

    const state = encodeURIComponent(academiaId);

    const url =
      `https://auth.mercadopago.com.br/authorization` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&response_type=code` +
      `&platform_id=mp` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}`;

    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao iniciar conexão Mercado Pago" },
      { status: 400 }
    );
  }
}