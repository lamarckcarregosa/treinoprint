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

    const { data: mensalidadesData, error: mensalidadesError } =
      await supabaseServer.rpc("gerar_mensalidades", {
        p_competencia: competencia,
      });

    if (mensalidadesError) {
      return NextResponse.json(
        { error: mensalidadesError.message },
        { status: 500 }
      );
    }

    const { data: despesasData, error: despesasError } =
      await supabaseServer.rpc("gerar_despesas_fixas", {
        p_competencia: competencia,
      });

    if (despesasError) {
      return NextResponse.json(
        { error: despesasError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mensalidades_geradas: mensalidadesData || 0,
      despesas_fixas_geradas: despesasData || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao gerar dados financeiros" },
      { status: 400 }
    );
  }
}