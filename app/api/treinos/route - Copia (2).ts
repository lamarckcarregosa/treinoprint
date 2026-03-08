import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔴 server only
);

async function getUserIdFromAuthHeader(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function GET(req: Request) {
  const user_id = await getUserIdFromAuthHeader(req);
  if (!user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("treinos")
    .select("id,nome")
    .eq("user_id", user_id)
    .order("id", { ascending: false });

const { data: treinos } = await supabase
  .from("treinos_modelos")
  .select("*")
  .eq("academia_id", profile.academia_id)
  .eq("semana", semana)
  .eq("dia", dia)
  .eq("nivel", nivel)
  .eq("tipo", tipo);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const user_id = await getUserIdFromAuthHeader(req);
  if (!user_id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const nome = String(body?.nome || "").trim();
  if (!nome) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("treinos")
    .insert([{ nome, user_id }])
    .select("id,nome")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}