import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

function getCompetenciaAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "CRON_SECRET não configurado" },
        { status: 500 }
      );
    }

    if (authHeader !== expected) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const competencia = getCompetenciaAtual();

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

    const { data: despesasFixasData, error: despesasFixasError } =
      await supabaseServer.rpc("gerar_despesas_fixas", {
        p_competencia: competencia,
      });

    if (despesasFixasError) {
      return NextResponse.json(
        { error: despesasFixasError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      competencia,
      mensalidades_geradas: mensalidadesData || 0,
      despesas_fixas_geradas: despesasFixasData || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro no cron financeiro" },
      { status: 400 }
    );
  }
}