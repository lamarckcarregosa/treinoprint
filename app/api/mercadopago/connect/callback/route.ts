import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(new URL("/sistema/academia?mp=erro", req.url));
    }

    const clientId = process.env.MP_CLIENT_ID!;
    const clientSecret = process.env.MP_CLIENT_SECRET!;
    const redirectUri = process.env.MP_REDIRECT_URI!;

    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/sistema/academia?mp=erro", req.url));
    }

    const academiaId = state;

    const expiresAt = tokenJson.expires_in
      ? new Date(Date.now() + Number(tokenJson.expires_in) * 1000).toISOString()
      : null;

    const { error } = await supabaseServer
      .from("academias")
      .update({
        mp_connected: true,
        mp_user_id: tokenJson.user_id ? String(tokenJson.user_id) : null,
        mp_public_key: tokenJson.public_key || null,
        mp_access_token: tokenJson.access_token || null,
        mp_refresh_token: tokenJson.refresh_token || null,
        mp_token_expires_at: expiresAt,
      })
      .eq("id", academiaId);

    if (error) {
      return NextResponse.redirect(new URL("/sistema/academia?mp=erro", req.url));
    }

    return NextResponse.redirect(new URL("/sistema/academia?mp=ok", req.url));
  } catch {
    return NextResponse.redirect(new URL("/sistema/academia?mp=erro", req.url));
  }
}