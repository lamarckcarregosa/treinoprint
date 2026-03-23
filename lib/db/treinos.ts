import { supabaseAdmin } from "@/lib/supabase-admin";

export type TreinoExercicio = {
  id: number;
  exercicio_nome?: string | null;
  nome?: string | null;
  series?: string | null;
  repeticoes?: string | null;
  carga?: string | null;
  observacoes?: string | null;
};

export type TreinoDB = {
  id: number;
  nome: string;
  dia_semana?: string | null;
  treino_exercicios?: TreinoExercicio[];
};

function getDiaSemanaPTBR() {
  const dias = [
    "domingo",
    "segunda",
    "terca",
    "quarta",
    "quinta",
    "sexta",
    "sabado",
  ];

  return dias[new Date().getDay()];
}

export async function buscarTreinoDoDia(
  alunoId: number,
  academiaId: string
): Promise<TreinoDB | null> {
  const diaHoje = getDiaSemanaPTBR();

  const { data, error } = await supabaseAdmin
    .from("treinos_modelos")
    .select(`
      id,
      nome,
      dia_semana,
      treino_exercicios (
        id,
        exercicio_nome,
        nome,
        series,
        repeticoes,
        carga,
        observacoes
      )
    `)
    .eq("aluno_id", alunoId)
    .eq("academia_id", academiaId)
    .eq("ativo", true)
    .ilike("dia_semana", `%${diaHoje}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar treino do dia:", error.message);
    return null;
  }

  return (data as TreinoDB) || null;
}