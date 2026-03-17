import { supabaseServer } from "@/lib/supabase-server";

type ItemHistorico = {
  exercicio_id?: number | null;
  nome_exercicio_snapshot: string;
  series?: string | null;
  repeticoes?: string | null;
  carga?: string | null;
  descanso?: string | null;
  observacoes?: string | null;
  ordem?: number | null;
};

type SalvarHistoricoInput = {
  academia_id: string;
  aluno_id: number;
  aluno_nome: string;
  personal_nome?: string | null;
  semana?: string | null;
  dia?: string | null;
  nivel?: string | null;
  tipo?: string | null;
  exercicios: ItemHistorico[];
  user_id?: string | null;
  origem?: string | null;
  codigo_treino?: string | null;

  treino_personalizado_id?: number | null;
  titulo?: string | null;
  objetivo?: string | null;
  observacoes?: string | null;
  divisao?: string | null;
  frequencia_semana?: number | null;
  origem_geracao?: string | null;
  versao_treino?: number | null;
};

export async function salvarHistoricoImpressoes(
  input: SalvarHistoricoInput
) {
  const payload = {
    academia_id: input.academia_id,
    aluno_id: input.aluno_id,
    aluno_nome: input.aluno_nome,
    personal_nome: input.personal_nome || null,
    semana: input.semana || null,
    dia: input.dia || null,
    nivel: input.nivel || null,
    tipo: input.tipo || null,
    exercicios: input.exercicios || [],
    user_id: input.user_id || null,
    origem: input.origem || "manual",
    codigo_treino: input.codigo_treino || null,

    treino_personalizado_id: input.treino_personalizado_id || null,
    titulo: input.titulo || null,
    objetivo: input.objetivo || null,
    observacoes: input.observacoes || null,
    divisao: input.divisao || null,
    frequencia_semana: input.frequencia_semana || null,
    origem_geracao: input.origem_geracao || null,
    versao_treino: input.versao_treino || 1,
  };

  const { data, error } = await supabaseServer
    .from("historico_impressoes")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Erro ao salvar histórico");
  }

  return data;
}