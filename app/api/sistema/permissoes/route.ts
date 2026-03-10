import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";
import { protegerApi } from "../../../../lib/protegerApi";
import { permissoesPadraoPorTipo } from "../../../../lib/permissoes";

export async function GET(req: NextRequest) {
  try {
    const auth = await protegerApi(req, "sistema");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;

    const { data: profiles, error: profilesError } = await supabaseServer
      .from("profiles")
      .select("id, nome, usuario, tipo")
      .eq("academia_id", academiaId)
      .order("nome", { ascending: true });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const profileIds = (profiles || []).map((item) => item.id);

    let permissoesMap = new Map<string, any>();

    if (profileIds.length > 0) {
      const { data: permissoes, error: permissoesError } = await supabaseServer
        .from("permissoes_usuarios")
        .select("*")
        .in("profile_id", profileIds)
        .eq("academia_id", academiaId);

      if (permissoesError) {
        return NextResponse.json({ error: permissoesError.message }, { status: 500 });
      }

      permissoesMap = new Map(
        (permissoes || []).map((item) => [item.profile_id, item])
      );
    }

    const lista = (profiles || []).map((profile) => {
      const padrao =
        permissoesPadraoPorTipo[
          (profile.tipo || "recepcao") as keyof typeof permissoesPadraoPorTipo
        ] || permissoesPadraoPorTipo.recepcao;

      const custom = permissoesMap.get(profile.id);

      return {
        id: profile.id,
        nome: profile.nome,
        usuario: profile.usuario,
        tipo: profile.tipo,
        permissoes: {
          dashboard: custom?.dashboard ?? padrao.dashboard,
          alunos: custom?.alunos ?? padrao.alunos,
          personais: custom?.personais ?? padrao.personais,
          treinos: custom?.treinos ?? padrao.treinos,
          imprimir: custom?.imprimir ?? padrao.imprimir,
          pagamentos: custom?.pagamentos ?? padrao.pagamentos,
          financeiro: custom?.financeiro ?? padrao.financeiro,
          sistema: custom?.sistema ?? padrao.sistema,
          alterar_senha: custom?.alterar_senha ?? padrao.alterar_senha,
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
    const auth = await protegerApi(req, "sistema");
    if (!auth.ok) return auth.response;

    const academiaId = auth.academiaId;
    const body = await req.json();
    const { profile_id, permissoes } = body || {};

    if (!profile_id || !permissoes) {
      return NextResponse.json(
        { error: "profile_id e permissoes são obrigatórios" },
        { status: 400 }
      );
    }

    const payload = {
      profile_id,
      academia_id: academiaId,
      dashboard: !!permissoes.dashboard,
      alunos: !!permissoes.alunos,
      personais: !!permissoes.personais,
      treinos: !!permissoes.treinos,
      imprimir: !!permissoes.imprimir,
      pagamentos: !!permissoes.pagamentos,
      financeiro: !!permissoes.financeiro,
      sistema: !!permissoes.sistema,
      alterar_senha: !!permissoes.alterar_senha,
    };

    const { error } = await supabaseServer
      .from("permissoes_usuarios")
      .upsert(payload, { onConflict: "profile_id,academia_id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao salvar permissões" },
      { status: 400 }
    );
  }
}