import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { protegerApi } from "../../../lib/protegerApi";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "superadmin");
    if (!auth.ok) return auth.response;

    const [
      academiasRes,
      alunosRes,
      usuariosRes,
      personaisRes,
    ] = await Promise.all([
      supabaseServer.from("academias").select("id, plano, ativa", { count: "exact" }),
      supabaseServer.from("alunos").select("id", { count: "exact", head: true }),
      supabaseServer.from("profiles").select("id", { count: "exact", head: true }),
      supabaseServer.from("personals").select("id", { count: "exact", head: true }),
    ]);

    if (academiasRes.error) {
      return NextResponse.json({ error: academiasRes.error.message }, { status: 500 });
    }

    const academias = academiasRes.data || [];
    const academiasAtivas = academias.filter((a: any) => a.ativa).length;
    const academiasInativas = academias.filter((a: any) => !a.ativa).length;

    const planosCounter = new Map<string, number>();
    academias.forEach((item: any) => {
      const plano = item.plano || "sem plano";
      planosCounter.set(plano, (planosCounter.get(plano) || 0) + 1);
    });

    const academiasPorPlano = Array.from(planosCounter.entries()).map(([plano, total]) => ({
      plano,
      total,
    }));

    return NextResponse.json({
      totalAcademias: academias.length,
      academiasAtivas,
      academiasInativas,
      totalAlunos: alunosRes.count || 0,
      totalUsuarios: usuariosRes.count || 0,
      totalPersonais: personaisRes.count || 0,
      academiasPorPlano,
      academiasRecentes: [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard superadmin" },
      { status: 400 }
    );
  }
}