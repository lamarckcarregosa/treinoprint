export type NivelAlerta = "info" | "warning" | "danger";

export type ModuloAlerta =
  | "financeiro"
  | "alunos"
  | "treinos"
  | "sistema";

export type PerfilAlerta =
  | "admin"
  | "personal"
  | "recepcao"
  | "todos";

export type AlertaInicio = {
  id: string;
  titulo: string;
  descricao: string;
  nivel: NivelAlerta;
  modulo: ModuloAlerta;
  perfil: PerfilAlerta;
  href?: string;
  mostrar_popup?: boolean;
  total?: number;
};