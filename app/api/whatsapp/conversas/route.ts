import { NextRequest, NextResponse } from "next/server";
import { listarConversas } from "@/lib/db/whatsapp";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { searchParams } = new URL(req.url);

    const setor = searchParams.get("setor") || "todos";
    const status = searchParams.get("status") || "todos";

    const data = await listarConversas({
      academiaId,
      setor,
      status,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao listar conversas" },
      { status: 400 }
    );
  }
}