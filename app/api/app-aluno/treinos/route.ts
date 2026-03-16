import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabase-server";

function toDateValue(value?: string | null) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
}

export async function GET(req: NextRequest) {
  try {
    const alunoIdHeader =
      req.headers.get("x-app-aluno-id") || req.headers.get("x-aluno-id");

    const academiaIdHeader = req.headers.get("x-academia-id");

    const alunoId = Number(alunoIdHeader);

    if (!alunoId || Number.isNaN(alunoId)) {
      return NextResponse.json(
        { error: "Sessão do aluno não informada" },
        { status: 400 }
      );
    }

    const { data: aluno, error: alunoError } = await supabaseServer
      .from("alunos")
      .select("id, nome, academia_id")
      .eq("id", alunoId)
      .single();

    if (alunoError || !aluno) {
      return NextResponse.json(
        { error: alunoError?.message || "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const academiaId = academiaIdHeader || aluno.academia_id;

    const listaFinal: any[] = [];

    // 1) treino personalizado ativo
    const { data: treinosPersonalizados, error: treinosPersonalizadosError } =
      await supabaseServer
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
      return NextResponse.json(
        {
          error:
            treinosPersonalizadosError.message ||
            "Erro ao carregar treinos personalizados",
        },
        { status: 500 }
      );
    }

    for (const treino of treinosPersonalizados || []) {
      const { data: itens, error: itensError } = await supabaseServer
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
        return NextResponse.json(
          {
            error:
              itensError.message || "Erro ao carregar itens do treino personalizado",
          },
          { status: 500 }
        );
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

    // 2) histórico impresso por aluno_id
    const { data: historicoPorId, error: historicoPorIdError } =
      await supabaseServer
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
      return NextResponse.json(
        { error: historicoPorIdError.message || "Erro ao carregar histórico" },
        { status: 500 }
      );
    }

    let historicos = Array.isArray(historicoPorId) ? historicoPorId : [];

    // 3) fallback por nome para históricos antigos
    if (historicos.length === 0 && aluno.nome) {
      const { data: historicoPorNome, error: historicoPorNomeError } =
        await supabaseServer
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
        return NextResponse.json(
          { error: historicoPorNomeError.message || "Erro ao carregar histórico" },
          { status: 500 }
        );
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

    // 5) remover duplicados simples
    const unicos: any[] = [];
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
    
// limitar aos últimos 6 treinos
const limitados = unicos.slice(0, 6);

return NextResponse.json(limitados);

    return NextResponse.json(unicos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro ao carregar treinos do aluno" },
      { status: 400 }
    );
  }
}