import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const competencia = String(body.competencia || "").trim();

    if (!competencia || !/^\d{4}-\d{2}$/.test(competencia)) {
      return NextResponse.json(
        { error: "Competência inválida. Use o formato YYYY-MM" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer.rpc("gerar_mensalidades", {
      p_competencia: competencia,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "Mensalidades geradas com sucesso",
      total: data || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar mensalidades" },
      { status: 400 }
    );
  }
}