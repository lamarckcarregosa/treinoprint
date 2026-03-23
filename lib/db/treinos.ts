import { supabaseAdmin } from "@/lib/supabase-admin";

type ExercicioTreino = {
  nome: string;
  series?: string | null;
  repeticoes?: string | null;
  carga?: string | null;
  descanso?: string | null;
  obs?: string | null;
  ordem?: number | null;
};

export type TreinoWhatsApp = {
  id: number;
  origem: string;
  titulo: string;
  dia?: string | null;
  semana?: string | null;
  nivel?: string | null;
  tipo?: string | null;
  objetivo?: string | null;
  observacoes?: string | null;
  personal_nome?: string | null;
  aluno_nome?: string | null;
  created_at: string;
  exercicios: ExercicioTreino[];
};

function toDateValue(value?: string | null) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export async function buscarTreinoDoAluno(
  alunoId: number,
  academiaId: string
): Promise<TreinoWhatsApp | null> {
  const listaFinal: TreinoWhatsApp[] = [];

  const { data: aluno, error: alunoError } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, academia_id")
    .eq("id", alunoId)
    .single();

  if (alunoError || !aluno) {
    console.error("Aluno não encontrado em buscarTreinoDoAluno:", alunoError?.message);
    return null;
  }

  // 1) treinos personalizados ativos
  const { data: treinosPersonalizados, error: treinosPersonalizadosError } =
    await supabaseAdmin
      .from("treinos_personalizados")
      .select(`
        id,
        titulo,
        objetivo,
        observacoes,
        personal_nome,
        codigo_treino,
        dia_semana,
        created_at,
        updated_at
      `)
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .eq("ativo", true)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);

  if (treinosPersonalizadosError) {
    console.error(
      "Erro ao buscar treinos personalizados:",
      treinosPersonalizadosError.message
    );
    return null;
  }

  for (const treino of treinosPersonalizados || []) {
    const { data: itens, error: itensError } = await supabaseAdmin
      .from("treinos_personalizados_itens")
      .select(`
        id,
        nome_exercicio_snapshot,
        series,
        repeticoes,
        carga,
        descanso,
        observacoes,
        ordem
      `)
      .eq("treino_id", treino.id)
      .order("ordem", { ascending: true });

    if (itensError) {
      console.error(
        "Erro ao buscar itens de treino personalizado:",
        itensError.message
      );
      return null;
    }

    listaFinal.push({
      id: Number(treino.id),
      origem: "personalizado",
      titulo: treino.titulo || "Treino personalizado",
      dia: treino.dia_semana || treino.titulo || "",
      semana: null,
      nivel: null,
      tipo: null,
      objetivo: treino.objetivo || "",
      observacoes: treino.observacoes || "",
      personal_nome: treino.personal_nome || "",
      aluno_nome: aluno.nome || "",
      created_at:
        treino.updated_at ||
        treino.created_at ||
        new Date().toISOString(),
      exercicios: (itens || []).map((item: any) => ({
        nome: item.nome_exercicio_snapshot || "",
        series: item.series || "",
        repeticoes: item.repeticoes || "",
        carga: item.carga || "",
        descanso: item.descanso || "",
        obs: item.observacoes || "",
        ordem: item.ordem || 0,
      })),
    });
  }

  // 2) histórico por aluno_id
  const { data: historicoPorId, error: historicoPorIdError } =
    await supabaseAdmin
      .from("historico_impressoes")
      .select(`
        id,
        aluno_id,
        aluno_nome,
        personal_nome,
        semana,
        dia,
        nivel,
        tipo,
        origem,
        codigo_treino,
        exercicios,
        created_at
      `)
      .eq("academia_id", academiaId)
      .eq("aluno_id", alunoId)
      .order("created_at", { ascending: false })
      .limit(20);

  if (historicoPorIdError) {
    console.error("Erro ao buscar histórico por id:", historicoPorIdError.message);
    return null;
  }

  let historicos = Array.isArray(historicoPorId) ? historicoPorId : [];

  // 3) fallback por nome
  if (historicos.length === 0 && aluno.nome) {
    const { data: historicoPorNome, error: historicoPorNomeError } =
      await supabaseAdmin
        .from("historico_impressoes")
        .select(`
          id,
          aluno_id,
          aluno_nome,
          personal_nome,
          semana,
          dia,
          nivel,
          tipo,
          origem,
          codigo_treino,
          exercicios,
          created_at
        `)
        .eq("academia_id", academiaId)
        .eq("aluno_nome", aluno.nome)
        .order("created_at", { ascending: false })
        .limit(20);

    if (historicoPorNomeError) {
      console.error(
        "Erro ao buscar histórico por nome:",
        historicoPorNomeError.message
      );
      return null;
    }

    historicos = Array.isArray(historicoPorNome) ? historicoPorNome : [];
  }

  for (const item of historicos) {
    listaFinal.push({
      id: Number(item.id),
      origem: item.origem || "padrao",
      titulo: item.codigo_treino
        ? `Treino ${item.codigo_treino}`
        : item.dia
        ? `Treino ${item.dia}`
        : "Treino atual",
      dia: item.dia || "",
      semana: item.semana || null,
      nivel: item.nivel || null,
      tipo: item.tipo || null,
      objetivo: "",
      observacoes: "",
      personal_nome: item.personal_nome || "",
      aluno_nome: item.aluno_nome || aluno.nome || "",
      created_at: item.created_at || new Date().toISOString(),
      exercicios: Array.isArray(item.exercicios) ? item.exercicios : [],
    });
  }

  // 4) ordenar mais recente primeiro
  const ordenada = [...listaFinal].sort(
    (a, b) => toDateValue(b.created_at) - toDateValue(a.created_at)
  );

  // 5) remover duplicados
  const unicos: TreinoWhatsApp[] = [];
  const chaves = new Set<string>();

  for (const item of ordenada) {
    const chave = [
      item.origem || "",
      item.titulo || "",
      item.dia || "",
      item.created_at || "",
    ].join("|");

    if (chaves.has(chave)) continue;
    chaves.add(chave);
    unicos.push(item);
  }

  // 6) retorna o mais recente
  return unicos.length > 0 ? unicos[0] : null;
}