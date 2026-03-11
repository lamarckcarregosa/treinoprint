import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";

const SEGUNDOS_BLOQUEIO_REPETICAO = 20;

export async function POST(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "imprimir");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const body = await req.json();

    const codigo = String(body?.codigo || "").trim();

    if (!codigo) {
      return NextResponse.json(
        { error: "Código não informado" },
        { status: 400 }
      );
    }

    let aluno: any = null;

    if (/^\d+$/.test(codigo)) {
      const { data } = await supabaseServer
        .from("alunos")
        .select("id, nome, status, foto_url")
        .eq("academia_id", academiaId)
        .eq("id", Number(codigo))
        .maybeSingle();

      aluno = data;
    }

    if (!aluno) {
      const { data } = await supabaseServer
        .from("alunos")
        .select("id, nome, status, foto_url")
        .eq("academia_id", academiaId)
        .ilike("nome", codigo)
        .maybeSingle();

      aluno = data;
    }

    if (!aluno) {
      await supabaseServer.from("acessos_catraca").insert({
        academia_id: academiaId,
        codigo_lido: codigo,
        status: "negado",
        motivo: "Aluno não encontrado",
        origem: "qr",
      });

      return NextResponse.json({
        liberado: false,
        aluno: null,
        foto: null,
        motivo: "Aluno não encontrado",
      });
    }

    let fotoUrl = aluno.foto_url || null;

    if (fotoUrl && !String(fotoUrl).startsWith("http")) {
      const { data } = supabaseServer.storage
        .from("alunos")
        .getPublicUrl(fotoUrl);

      fotoUrl = data.publicUrl;
    }

    if ((aluno.status || "").toLowerCase() !== "ativo") {
      await supabaseServer.from("acessos_catraca").insert({
        academia_id: academiaId,
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        codigo_lido: codigo,
        status: "negado",
        motivo: "Aluno inativo",
        origem: "qr",
      });

      return NextResponse.json({
        liberado: false,
        aluno: aluno.nome,
        foto: fotoUrl,
        motivo: "Aluno inativo",
      });
    }

    const { data: ultimoAcesso } = await supabaseServer
      .from("acessos_catraca")
      .select("id, created_at, status")
      .eq("academia_id", academiaId)
      .eq("aluno_id", aluno.id)
      .eq("status", "liberado")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimoAcesso?.created_at) {
      const agora = Date.now();
      const ultimo = new Date(ultimoAcesso.created_at).getTime();
      const diferencaSegundos = Math.floor((agora - ultimo) / 1000);

      if (diferencaSegundos < SEGUNDOS_BLOQUEIO_REPETICAO) {
        const motivo = `Aguarde ${SEGUNDOS_BLOQUEIO_REPETICAO}s para novo acesso`;

        await supabaseServer.from("acessos_catraca").insert({
          academia_id: academiaId,
          aluno_id: aluno.id,
          aluno_nome: aluno.nome,
          codigo_lido: codigo,
          status: "negado",
          motivo,
          origem: "qr",
        });

        return NextResponse.json({
          liberado: false,
          aluno: aluno.nome,
          foto: fotoUrl,
          motivo,
        });
      }
    }

    const hoje = new Date().toISOString().slice(0, 10);

    const { data: mensalidadeVencida } = await supabaseServer
      .from("financeiro_pagamentos")
      .select("id, competencia, vencimento, valor, status")
      .eq("academia_id", academiaId)
      .eq("aluno_id", aluno.id)
      .eq("status", "pendente")
      .lt("vencimento", hoje)
      .order("vencimento", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (mensalidadeVencida) {
      const motivo = `Mensalidade em atraso (${mensalidadeVencida.competencia})`;

      await supabaseServer.from("acessos_catraca").insert({
        academia_id: academiaId,
        aluno_id: aluno.id,
        aluno_nome: aluno.nome,
        codigo_lido: codigo,
        status: "negado",
        motivo,
        origem: "qr",
      });

      return NextResponse.json({
        liberado: false,
        aluno: aluno.nome,
        foto: fotoUrl,
        motivo,
      });
    }

    await supabaseServer.from("acessos_catraca").insert({
      academia_id: academiaId,
      aluno_id: aluno.id,
      aluno_nome: aluno.nome,
      codigo_lido: codigo,
      status: "liberado",
      motivo: "Acesso liberado",
      origem: "qr",
    });

    return NextResponse.json({
      liberado: true,
      aluno: aluno.nome,
      foto: fotoUrl,
      motivo: "Acesso liberado",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao validar acesso" },
      { status: 400 }
    );
  }
}