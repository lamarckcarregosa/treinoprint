import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

export async function GET() {
  try {
    const [
      academiasRes,
      academiasAtivasRes,
      academiasInativasRes,
      alunosRes,
      usuariosRes,
      personaisRes,
      academiasRecentesRes,
    ] = await Promise.all([
      supabaseServer
        .from("academias")
        .select("id, nome, plano, ativa, created_at", { count: "exact" }),

      supabaseServer
        .from("academias")
        .select("id", { count: "exact", head: true })
        .eq("ativa", true),

      supabaseServer
        .from("academias")
        .select("id", { count: "exact", head: true })
        .eq("ativa", false),

      supabaseServer
        .from("alunos")
        .select("id", { count: "exact", head: true }),

      supabaseServer
        .from("profiles")
        .select("id", { count: "exact", head: true }),

      supabaseServer
        .from("personals")
        .select("id", { count: "exact", head: true }),

      supabaseServer
        .from("academias")
        .select("id, nome, plano, ativa, created_at, telefone, email")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (academiasRes.error) {
      return NextResponse.json({ error: academiasRes.error.message }, { status: 500 });
    }
    if (academiasAtivasRes.error) {
      return NextResponse.json({ error: academiasAtivasRes.error.message }, { status: 500 });
    }
    if (academiasInativasRes.error) {
      return NextResponse.json({ error: academiasInativasRes.error.message }, { status: 500 });
    }
    if (alunosRes.error) {
      return NextResponse.json({ error: alunosRes.error.message }, { status: 500 });
    }
    if (usuariosRes.error) {
      return NextResponse.json({ error: usuariosRes.error.message }, { status: 500 });
    }
    if (personaisRes.error) {
      return NextResponse.json({ error: personaisRes.error.message }, { status: 500 });
    }
    if (academiasRecentesRes.error) {
      return NextResponse.json({ error: academiasRecentesRes.error.message }, { status: 500 });
    }

    const academias = academiasRes.data || [];

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
      totalAcademias: academiasRes.count || academias.length || 0,
      academiasAtivas: academiasAtivasRes.count || 0,
      academiasInativas: academiasInativasRes.count || 0,
      totalAlunos: alunosRes.count || 0,
      totalUsuarios: usuariosRes.count || 0,
      totalPersonais: personaisRes.count || 0,
      academiasPorPlano,
      academiasRecentes: academiasRecentesRes.data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard superadmin" },
      { status: 400 }
    );
  }
}