import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { getAcademiaIdFromRequest } from "../../../../lib/getAcademiaIdFromRequest";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .select(
        `
        id,
        academia_id,
        aluno_id,
        data_avaliacao,
        peso,
        altura,
        percentual_gordura,
        peito,
        costas,
        cintura,
        abdomen,
        quadril,
        gluteo,
        braco_esquerdo,
        braco_direito,
        coxa_esquerda,
        coxa_direita,
        panturrilha_esquerda,
        panturrilha_direita,
        foto_frente,
        foto_lado,
        foto_costas,
        created_at
      `
      )
      .eq("id", id)
      .eq("academia_id", academiaId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Avaliação não encontrada" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao buscar avaliação" },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;
    const body = await req.json();

    const aluno_id = Number(body.aluno_id || 0);
    const data_avaliacao = String(body.data_avaliacao || "").trim();

    const peso =
      body.peso !== null &&
      body.peso !== undefined &&
      String(body.peso).trim() !== ""
        ? Number(body.peso)
        : null;

    const altura =
      body.altura !== null &&
      body.altura !== undefined &&
      String(body.altura).trim() !== ""
        ? Number(body.altura)
        : null;

    const percentual_gordura =
      body.percentual_gordura !== null &&
      body.percentual_gordura !== undefined &&
      String(body.percentual_gordura).trim() !== ""
        ? Number(body.percentual_gordura)
        : null;

    const peito =
      body.peito !== null &&
      body.peito !== undefined &&
      String(body.peito).trim() !== ""
        ? Number(body.peito)
        : null;

    const costas =
      body.costas !== null &&
      body.costas !== undefined &&
      String(body.costas).trim() !== ""
        ? Number(body.costas)
        : null;

    const cintura =
      body.cintura !== null &&
      body.cintura !== undefined &&
      String(body.cintura).trim() !== ""
        ? Number(body.cintura)
        : null;

    const abdomen =
      body.abdomen !== null &&
      body.abdomen !== undefined &&
      String(body.abdomen).trim() !== ""
        ? Number(body.abdomen)
        : null;

    const quadril =
      body.quadril !== null &&
      body.quadril !== undefined &&
      String(body.quadril).trim() !== ""
        ? Number(body.quadril)
        : null;

    const gluteo =
      body.gluteo !== null &&
      body.gluteo !== undefined &&
      String(body.gluteo).trim() !== ""
        ? Number(body.gluteo)
        : null;

    const braco_esquerdo =
      body.braco_esquerdo !== null &&
      body.braco_esquerdo !== undefined &&
      String(body.braco_esquerdo).trim() !== ""
        ? Number(body.braco_esquerdo)
        : null;

    const braco_direito =
      body.braco_direito !== null &&
      body.braco_direito !== undefined &&
      String(body.braco_direito).trim() !== ""
        ? Number(body.braco_direito)
        : null;

    const coxa_esquerda =
      body.coxa_esquerda !== null &&
      body.coxa_esquerda !== undefined &&
      String(body.coxa_esquerda).trim() !== ""
        ? Number(body.coxa_esquerda)
        : null;

    const coxa_direita =
      body.coxa_direita !== null &&
      body.coxa_direita !== undefined &&
      String(body.coxa_direita).trim() !== ""
        ? Number(body.coxa_direita)
        : null;

    const panturrilha_esquerda =
      body.panturrilha_esquerda !== null &&
      body.panturrilha_esquerda !== undefined &&
      String(body.panturrilha_esquerda).trim() !== ""
        ? Number(body.panturrilha_esquerda)
        : null;

    const panturrilha_direita =
      body.panturrilha_direita !== null &&
      body.panturrilha_direita !== undefined &&
      String(body.panturrilha_direita).trim() !== ""
        ? Number(body.panturrilha_direita)
        : null;

    const foto_frente = String(body.foto_frente || "").trim() || null;
    const foto_lado = String(body.foto_lado || "").trim() || null;
    const foto_costas = String(body.foto_costas || "").trim() || null;

    if (!aluno_id) {
      return NextResponse.json(
        { error: "Aluno é obrigatório" },
        { status: 400 }
      );
    }

    if (!data_avaliacao) {
      return NextResponse.json(
        { error: "Data da avaliação é obrigatória" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .update({
        aluno_id,
        data_avaliacao,
        peso,
        altura,
        percentual_gordura,
        peito,
        costas,
        cintura,
        abdomen,
        quadril,
        gluteo,
        braco_esquerdo,
        braco_direito,
        coxa_esquerda,
        coxa_direita,
        panturrilha_esquerda,
        panturrilha_direita,
        foto_frente,
        foto_lado,
        foto_costas,
      })
      .eq("id", id)
      .eq("academia_id", academiaId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao atualizar avaliação" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao atualizar avaliação" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const { id } = await params;

    const { error } = await supabaseServer
      .from("avaliacoes_fisicas")
      .delete()
      .eq("id", id)
      .eq("academia_id", academiaId);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erro ao excluir avaliação" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao excluir avaliação" },
      { status: 400 }
    );
  }
}