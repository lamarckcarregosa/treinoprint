import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("id, academia_id, nome")
      .eq("id", id)
      .eq("academia_id", academiaId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado nesta academia" },
        { status: 404 }
      );
    }

    const { error } = await supabaseServer.auth.admin.updateUserById(id, {
      password: "123456",
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao resetar senha" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Senha resetada para 123456",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao resetar senha" },
      { status: 400 }
    );
  }
}