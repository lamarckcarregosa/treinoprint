import { supabaseServer } from "@/lib/supabase-server";

export type UsuarioLogado = {
  id: string;
  nome: string;
  usuario: string;
  tipo: string;
  ativo: boolean;
  academia_id: string;
};

export async function getUsuarioLogado(): Promise<UsuarioLogado> {
  const {
    data: { user },
    error: authError,
  } = await supabaseServer.auth.getUser();

  if (authError || !user) {
    throw new Error("Usuário não autenticado");
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from("profiles")
    .select("id, nome, usuario, tipo, ativo, academia_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!profile) {
    throw new Error("Perfil não encontrado");
  }

  if (!profile.academia_id) {
    throw new Error("academia_id não informado no perfil");
  }

  return profile as UsuarioLogado;
}