import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAcademiaIdFromRequest } from "@/lib/getAcademiaIdFromRequest";

const permissoesPadrao = {
  dashboard: false,
  alunos: false,
  personais: false,
  treinos: false,
  imprimir: false,
  pagamentos: false,
  financeiro: false,
  sistema: false,
  superadmin: false,
  alterar_senha: false,
  avaliacoes: false,
  whatsapp: false,
};

export async function GET(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);

    const { data: usuarios, error: usuariosError } = await supabaseServer
      .from("profiles")
      .select("id, nome, usuario, tipo, ativo")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (usuariosError) {
      return NextResponse.json({ error: usuariosError.message }, { status: 500 });
    }

    const { data: permissoes, error: permissoesError } = await supabaseServer
      .from("permissoes_usuarios")
      .select(
        "profile_id, dashboard, alunos, personais, treinos, imprimir, pagamentos, financeiro, sistema, superadmin, alterar_senha, avaliacoes, whatsapp"
      )
      .eq("academia_id", academiaId);

    if (permissoesError) {
      return NextResponse.json({ error: permissoesError.message }, { status: 500 });
    }

    const lista = (usuarios || []).map((user) => {
      const perm = (permissoes || []).find((p) => p.profile_id === user.id);

      return {
        id: user.id,
        nome: user.nome,
        usuario: user.usuario,
        tipo: user.tipo,
        ativo: user.ativo,
        permissoes: {
          ...permissoesPadrao,
          ...(perm || {}),
        },
      };
    });

    return NextResponse.json(lista);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar permissões" },
      { status: 400 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const academiaId = getAcademiaIdFromRequest(req);
    const body = await req.json();

    const profile_id = String(body.profile_id || "").trim();
    const permissoes = body.permissoes || {};

    if (!profile_id) {
      return NextResponse.json(
        { error: "Profile não informado" },
        { status: 400 }
      );
    }

    const payload = {
      academia_id: academiaId,
      profile_id,
      dashboard: !!permissoes.dashboard,
      alunos: !!permissoes.alunos,
      personais: !!permissoes.personais,
      treinos: !!permissoes.treinos,
      imprimir: !!permissoes.imprimir,
      pagamentos: !!permissoes.pagamentos,
      financeiro: !!permissoes.financeiro,
      sistema: !!permissoes.sistema,
      superadmin: !!permissoes.superadmin,
      alterar_senha: !!permissoes.alterar_senha,
      avaliacoes: !!permissoes.avaliacoes,
      whatsapp: !!permissoes.whatsapp,
    };

    const { data, error } = await supabaseServer
      .from("permissoes_usuarios")
      .upsert(payload, { onConflict: "academia_id,profile_id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar permissões" },
      { status: 400 }
    );
  }
}