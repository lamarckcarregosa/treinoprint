export type TipoUsuario = "superadmin" | "admin" | "personal" | "recepcao";

export type Permissao =
  | "dashboard"
  | "alunos"
  | "personais"
  | "treinos"
  | "imprimir"
  | "pagamentos"
  | "financeiro"
  | "sistema"
  | "superadmin"
  | "alterar_senha"
  | "avaliacoes";

export type PermissoesObjeto = Record<Permissao, boolean>;

export const permissoesPadraoPorTipo: Record<TipoUsuario, PermissoesObjeto> = {
  superadmin: {
    dashboard: true,
    alunos: true,
    personais: true,
    treinos: true,
    imprimir: true,
    pagamentos: true,
    financeiro: true,
    sistema: true,
    superadmin: true,
    alterar_senha: true,
    avaliacoes: true
  },
  admin: {
    dashboard: true,
    alunos: true,
    personais: true,
    treinos: true,
    imprimir: true,
    pagamentos: true,
    financeiro: true,
    sistema: true,
    superadmin: false,
    alterar_senha: true,
    avaliacoes: true
  },
  personal: {
    dashboard: false,
    alunos: false,
    personais: false,
    treinos: true,
    imprimir: true,
    pagamentos: false,
    financeiro: false,
    sistema: false,
    superadmin: false,
    alterar_senha: true,
    avaliacoes: true
  },
  recepcao: {
    dashboard: false,
    alunos: true,
    personais: false,
    treinos: false,
    imprimir: true,
    pagamentos: true,
    financeiro: false,
    sistema: false,
    superadmin: false,
    alterar_senha: true,
    avaliacoes: false
  },
};

export function getPermissoesPadrao(tipo?: string | null): PermissoesObjeto {
  if (!tipo) return permissoesPadraoPorTipo.recepcao;
  return (
    permissoesPadraoPorTipo[tipo as TipoUsuario] ||
    permissoesPadraoPorTipo.recepcao
  );
}

export function temPermissao(
  tipo: string | null | undefined,
  permissao: Permissao,
  permissoesCustom?: Partial<PermissoesObjeto> | null
) {
  if (permissoesCustom && typeof permissoesCustom[permissao] === "boolean") {
    return !!permissoesCustom[permissao];
  }

  const base = getPermissoesPadrao(tipo);
  return !!base[permissao];
}