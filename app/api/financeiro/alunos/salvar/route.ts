import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../../lib/getAcademiaIdFromRequest";

type TipoCobranca = "mensal" | "trimestral" | "semestral" | "anual";

function tipoCobrancaValido(valor: string): valor is TipoCobranca {
  return ["mensal", "trimestral", "semestral", "anual"].includes(valor);
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const alunoId = Number(body?.aluno_id);
    const planoCodigo = String(body?.plano_codigo || "").trim() || null;
    const valorMensalidade = Number(body?.valor_mensalidade || 0);
    const tipoCobranca = String(body?.tipo_cobranca || "mensal").trim();
    const vencimentoDia = Number(body?.vencimento_dia || 10);
    const ativo = Boolean(body?.ativo);

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json({ error: "Aluno inválido" }, { status: 400 });
    }

    if (Number.isNaN(valorMensalidade) || valorMensalidade < 0) {
      return NextResponse.json(
        { error: "Valor da mensalidade inválido" },
        { status: 400 }
      );
    }

    if (!tipoCobrancaValido(tipoCobranca)) {
      return NextResponse.json(
        { error: "Tipo de cobrança inválido" },
        { status: 400 }
      );
    }

    if (!vencimentoDia || Number.isNaN(vencimentoDia) || vencimentoDia < 1 || vencimentoDia > 31) {
      return NextResponse.json(
        { error: "Dia de vencimento inválido" },
        { status: 400 }
      );
    }

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id")
      .eq("academia_id", academiaId)
      .eq("id", alunoId)
      .single();

    if (alunoError || !aluno) {
      return NextResponse.json(
        { error: alunoError?.message || "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const { data: existente, error: buscaError } = await supabaseServer
      .from("financeiro_alunos")
      .select("id")
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .maybeSingle();

    if (buscaError) {
      return NextResponse.json({ error: buscaError.message }, { status: 500 });
    }

    const payload = {
      plano_codigo: planoCodigo,
      valor_mensalidade: valorMensalidade,
      tipo_cobranca: tipoCobranca,
      vencimento_dia: vencimentoDia,
      ativo,
    };

    if (existente?.id) {
      const { data, error } = await supabaseServer
        .from("financeiro_alunos")
        .update(payload)
        .eq("academia_id", academiaId)
        .eq("aluno_id", alunoId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        ok: true,
        modo: "update",
        registro: data,
      });
    }

    const { data, error } = await supabaseServer
      .from("financeiro_alunos")
      .insert({
        academia_id: academiaId,
        aluno_id: alunoId,
        ...payload,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      modo: "insert",
      registro: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar financeiro do aluno" },
      { status: 400 }
    );
  }
}