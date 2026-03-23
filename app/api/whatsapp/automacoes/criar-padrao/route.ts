import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data: existentes, error: errorExistentes } = await supabaseServer
      .from("whatsapp_automacoes")
      .select("tipo")
      .eq("academia_id", academiaId);

    if (errorExistentes) {
      return NextResponse.json(
        { error: errorExistentes.message },
        { status: 500 }
      );
    }

    const tiposExistentes = new Set((existentes || []).map((x: any) => x.tipo));

    const padrao = [
      {
        academia_id: academiaId,
        tipo: "inatividade_7d",
        ativo: true,
        template_mensagem:
          "Olá, {nome} 👋\n\nNotamos que você está há alguns dias sem registrar treino.\n\nDigite 1 para ver seu treino e voltar com tudo 💪",
      },
      {
        academia_id: academiaId,
        tipo: "financeiro_vence_2d",
        ativo: true,
        template_mensagem:
          "Olá, {nome} 👋\n\nSua mensalidade vence em breve.\n\nDigite 6 para receber seu link de pagamento.",
      },
      {
        academia_id: academiaId,
        tipo: "financeiro_vencido_3d",
        ativo: true,
        template_mensagem:
          "Olá, {nome} 👋\n\nIdentificamos uma mensalidade em aberto.\n\nDigite 6 para receber seu link de pagamento.",
      },
    ].filter((item) => !tiposExistentes.has(item.tipo));

    if (padrao.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "As automações padrão já existem para esta academia.",
      });
    }

    const { data, error } = await supabaseServer
      .from("whatsapp_automacoes")
      .insert(padrao)
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      criadas: data || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao criar automações padrão" },
      { status: 400 }
    );
  }
}