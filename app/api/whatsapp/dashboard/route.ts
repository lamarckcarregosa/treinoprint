import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

function inicioDoDiaIso() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  return hoje.toISOString();
}

function diasAtrasIso(qtd: number) {
  const d = new Date();
  d.setDate(d.getDate() - qtd);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const hojeIso = inicioDoDiaIso();
    const seteDiasIso = diasAtrasIso(7);
    const trintaDiasIso = diasAtrasIso(30);

    const [
      conversasAbertasRes,
      conversasAtendimentoRes,
      mensagensHojeRes,
      mensagens7dRes,
      mensagens30dRes,
      automacoes7dRes,
      setoresRes,
    ] = await Promise.all([
      supabaseServer
        .from("whatsapp_conversas")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .eq("status", "aberta"),

      supabaseServer
        .from("whatsapp_conversas")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .eq("status", "em_atendimento"),

      supabaseServer
        .from("whatsapp_mensagens")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .gte("created_at", hojeIso),

      supabaseServer
        .from("whatsapp_mensagens")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .gte("created_at", seteDiasIso),

      supabaseServer
        .from("whatsapp_mensagens")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .gte("created_at", trintaDiasIso),

      supabaseServer
        .from("whatsapp_envios_automaticos")
        .select("id", { count: "exact", head: true })
        .eq("academia_id", academiaId)
        .gte("created_at", seteDiasIso),

      supabaseServer
        .from("whatsapp_conversas")
        .select("setor")
        .eq("academia_id", academiaId),
    ]);

    const setoresLista = setoresRes.data || [];

    const porSetor = {
      recepcao: setoresLista.filter((x: any) => x.setor === "recepcao").length,
      professor: setoresLista.filter((x: any) => x.setor === "professor").length,
      financeiro: setoresLista.filter((x: any) => x.setor === "financeiro").length,
    };

    return NextResponse.json({
      conversas_abertas: conversasAbertasRes.count || 0,
      conversas_em_atendimento: conversasAtendimentoRes.count || 0,
      mensagens_hoje: mensagensHojeRes.count || 0,
      mensagens_7_dias: mensagens7dRes.count || 0,
      mensagens_30_dias: mensagens30dRes.count || 0,
      automacoes_enviadas_7_dias: automacoes7dRes.count || 0,
      por_setor: porSetor,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar dashboard WhatsApp" },
      { status: 400 }
    );
  }
}