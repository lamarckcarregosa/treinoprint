import { supabaseServer } from "./supabase-server";
import { Permissao, PermissoesObjeto, temPermissao } from "./permissoes";

export async function verificarPermissaoApi(
  profileId: string,
  permissao: Permissao,
  academiaId?: string | null
) {
  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("id, tipo, academia_id")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    return {
      permitido: false,
      motivo: "Perfil não encontrado",
      profile: null,
      permissoesCustom: null,
    };
  }

  if (profile.tipo === "superadmin") {
    return {
      permitido: true,
      motivo: null,
      profile,
      permissoesCustom: null,
    };
  }

  let permissoesCustom: Partial<PermissoesObjeto> | null = null;

  if (academiaId) {
    const { data: custom } = await supabaseServer
      .from("permissoes_usuarios")
      .select(
        "dashboard, alunos, personais, treinos, imprimir, pagamentos, financeiro, sistema, alterar_senha"
      )
      .eq("profile_id", profileId)
      .eq("academia_id", academiaId)
      .maybeSingle();

    permissoesCustom = custom || null;
  }

  const permitido = temPermissao(profile.tipo, permissao, permissoesCustom);

  return {
    permitido,
    motivo: permitido ? null : "Acesso negado",
    profile,
    permissoesCustom,
  };
}