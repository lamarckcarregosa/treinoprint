import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../lib/supabaseserver";

export async function GET() {

  const supabase = createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("alunos")
    .select("*")
    .order("nome", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}