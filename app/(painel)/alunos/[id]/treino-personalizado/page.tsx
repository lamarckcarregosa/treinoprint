"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type Aluno = {
  id: number;
  nome: string;
};

type Exercicio = {
  id: number;
  nome: string;
  grupo_muscular?: string | null;
  categoria?: string | null;
  nivel?: string | null;
  observacoes_padrao?: string | null;
  ativo: boolean;
};

type ItemTreino = {
  id?: number;
  local_id: string;
  exercicio_id: number | null;
  nome_exercicio_snapshot: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso: string;
  observacoes: string;
  ordem: number;
};

type TreinoResumo = {
  id: number;
  titulo?: string | null;
  codigo_treino?: string | null;
  dia_semana?: string | null;
  ativo: boolean;
};

function gerarIdLocal() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const diasSemana = [
  "",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

function getParametrosBase(objetivo: string, nivel: string) {
  if (objetivo === "hipertrofia") {
    return {
      series: nivel === "iniciante" ? "3" : "4",
      repeticoes: "8-12",
      descanso: "45-90s",
    };
  }

  if (objetivo === "emagrecimento") {
    return {
      series: "3",
      repeticoes: "12-15",
      descanso: "30-45s",
    };
  }

  if (objetivo === "resistencia") {
    return {
      series: "2-3",
      repeticoes: "15-20",
      descanso: "30s",
    };
  }

  return {
    series: "2-3",
    repeticoes: "10-12",
    descanso: "45s",
  };
}

function getDivisao(divisao: string) {
  const mapa: Record<string, { codigo: string; titulo: string; grupos: string[] }[]> = {
    fullbody: [
      {
        codigo: "A",
        titulo: "Treino A",
        grupos: ["quadriceps", "peito", "costas", "ombro", "abdomen"],
      },
    ],
    ab: [
      {
        codigo: "A",
        titulo: "Treino A",
        grupos: ["peito", "ombro", "triceps", "abdomen"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        grupos: ["costas", "biceps", "quadriceps", "posterior", "gluteo", "panturrilha"],
      },
    ],
    abc: [
      {
        codigo: "A",
        titulo: "Treino A",
        grupos: ["peito", "ombro", "triceps"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        grupos: ["costas", "biceps", "abdomen"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        grupos: ["quadriceps", "posterior", "gluteo", "panturrilha"],
      },
    ],
    abcd: [
      {
        codigo: "A",
        titulo: "Treino A",
        grupos: ["peito", "triceps"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        grupos: ["costas", "biceps"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        grupos: ["quadriceps", "gluteo"],
      },
      {
        codigo: "D",
        titulo: "Treino D",
        grupos: ["ombro", "posterior", "panturrilha", "abdomen"],
      },
    ],
    abcde: [
      {
        codigo: "A",
        titulo: "Treino A",
        grupos: ["peito"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        grupos: ["costas"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        grupos: ["quadriceps", "posterior", "gluteo", "panturrilha"],
      },
      {
        codigo: "D",
        titulo: "Treino D",
        grupos: ["ombro"],
      },
      {
        codigo: "E",
        titulo: "Treino E",
        grupos: ["biceps", "triceps", "abdomen"],
      },
    ],
  };

  return mapa[divisao] || mapa.abc;
}

function limitarPorGrupo(grupo: string, divisao: string) {
  if (divisao === "abcde") {
    if (grupo === "peito" || grupo === "costas" || grupo === "quadriceps") return 4;
    if (grupo === "ombro") return 4;
    if (grupo === "biceps" || grupo === "triceps") return 3;
    if (grupo === "posterior" || grupo === "gluteo") return 3;
    if (grupo === "panturrilha" || grupo === "abdomen") return 2;
    return 3;
  }

  if (divisao === "abcd") {
    if (grupo === "peito" || grupo === "costas" || grupo === "quadriceps") return 3;
    if (grupo === "ombro" || grupo === "gluteo") return 3;
    if (grupo === "biceps" || grupo === "triceps") return 2;
    if (grupo === "posterior" || grupo === "panturrilha" || grupo === "abdomen") return 2;
    return 2;
  }

  if (divisao === "abc") {
    if (grupo === "peito" || grupo === "costas" || grupo === "quadriceps") return 3;
    if (grupo === "ombro" || grupo === "biceps" || grupo === "triceps") return 2;
    if (grupo === "posterior" || grupo === "gluteo") return 2;
    if (grupo === "panturrilha" || grupo === "abdomen") return 1;
    return 2;
  }

  if (grupo === "abdomen" || grupo === "panturrilha") return 1;
  if (grupo === "biceps" || grupo === "triceps" || grupo === "ombro") return 2;
  return 2;
}

function gerarTreinosAutomaticos(
  biblioteca: Exercicio[],
  objetivo: string,
  nivel: string,
  frequencia: number,
  divisao: string
) {
  const parametros = getParametrosBase(objetivo, nivel);
  const estrutura = getDivisao(divisao);

  return estrutura.slice(0, frequencia).map((bloco, blocoIndex) => {
    let ordem = 1;
    const itens: any[] = [];

    for (const grupo of bloco.grupos) {
      const candidatos = biblioteca.filter((ex) => {
        const grupoOk = String(ex.grupo_muscular || "") === grupo;
        const nivelEx = String(ex.nivel || "todos");
        const nivelOk = nivelEx === "todos" || nivelEx === nivel;
        const ativoOk = ex.ativo !== false;
        return grupoOk && nivelOk && ativoOk;
      });

      const escolhidos = candidatos.slice(0, limitarPorGrupo(grupo, divisao));

      for (const ex of escolhidos) {
        itens.push({
          exercicio_id: ex.id || null,
          nome_exercicio_snapshot: ex.nome || "",
          series: parametros.series,
          repeticoes: parametros.repeticoes,
          carga: "",
          descanso: parametros.descanso,
          observacoes: ex.observacoes_padrao || "",
          ordem: ordem++,
        });
      }
    }

    return {
      titulo: bloco.titulo,
      codigo_treino: bloco.codigo,
      dia_semana: bloco.titulo,
      ordem: blocoIndex + 1,
      itens,
    };
  });
}

export default function TreinoPersonalizadoAlunoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const alunoId = Number(params?.id);

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [treinosExistentes, setTreinosExistentes] = useState<TreinoResumo[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [buscaExercicio, setBuscaExercicio] = useState("");

  const [treinoId, setTreinoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [codigoTreino, setCodigoTreino] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [ordemTreino, setOrdemTreino] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const [modalGeradorAberto, setModalGeradorAberto] = useState(false);
  const [gerandoAutomatico, setGerandoAutomatico] = useState(false);
  const [geradorObjetivo, setGeradorObjetivo] = useState("hipertrofia");
  const [geradorNivel, setGeradorNivel] = useState("iniciante");
  const [geradorFrequencia, setGeradorFrequencia] = useState("3");
  const [geradorDivisao, setGeradorDivisao] = useState("abc");

  const [bibliotecaExercicios, setBibliotecaExercicios] = useState<Exercicio[]>([]);
  const [itens, setItens] = useState<ItemTreino[]>([]);

  const limparFormulario = () => {
    setTreinoId(null);
    setTitulo("");
    setObjetivo("");
    setObservacoes("");
    setCodigoTreino("");
    setDiaSemana("");
    setOrdemTreino("0");
    setAtivo(true);
    setItens([]);
  };

  const carregarTreinosExistentes = async () => {
    const res = await apiFetch(`/api/treinos-personalizados?aluno_id=${alunoId}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar treinos");
    }

    setTreinosExistentes(Array.isArray(json) ? json : []);
  };

  const carregarBase = async () => {
    const [resAlunos, resExercicios, resTreinos] = await Promise.all([
      apiFetch("/api/alunos", { cache: "no-store" }),
      apiFetch("/api/exercicios?ativo=true", { cache: "no-store" }),
      apiFetch(`/api/treinos-personalizados?aluno_id=${alunoId}`, {
        cache: "no-store",
      }),
    ]);

    const jsonAlunos = await resAlunos.json().catch(() => []);
    const jsonExercicios = await resExercicios.json().catch(() => []);
    const jsonTreinos = await resTreinos.json().catch(() => []);

    if (!resAlunos.ok) {
      throw new Error((jsonAlunos as any).error || "Erro ao carregar aluno");
    }

    if (!resExercicios.ok) {
      throw new Error((jsonExercicios as any).error || "Erro ao carregar exercícios");
    }

    if (!resTreinos.ok) {
      throw new Error((jsonTreinos as any).error || "Erro ao carregar treinos");
    }

    const listaAlunos = Array.isArray(jsonAlunos) ? jsonAlunos : [];
    const alunoEncontrado =
      listaAlunos.find((item: any) => Number(item.id) === alunoId) || null;

    if (!alunoEncontrado) {
      throw new Error("Aluno não encontrado");
    }

    setAluno(alunoEncontrado);
    setExercicios(Array.isArray(jsonExercicios) ? jsonExercicios : []);
    setTreinosExistentes(Array.isArray(jsonTreinos) ? jsonTreinos : []);
  };

  const carregarBibliotecaExercicios = async () => {
    const res = await apiFetch("/api/exercicios?ativo=true", {
      cache: "no-store",
    });

    const json = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar exercícios");
    }

    const lista = Array.isArray(json) ? json : [];
    setBibliotecaExercicios(lista);
    return lista;
  };

  const carregarTreino = async (id: number) => {
    const res = await apiFetch(`/api/treinos-personalizados/${id}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar treino");
    }

    setTreinoId(json.id || null);
    setTitulo(json.titulo || "");
    setObjetivo(json.objetivo || "");
    setObservacoes(json.observacoes || "");
    setCodigoTreino(json.codigo_treino || "");
    setDiaSemana(json.dia_semana || "");
    setOrdemTreino(String(json.ordem ?? 0));
    setAtivo(Boolean(json.ativo));

    setItens(
      Array.isArray(json.itens)
        ? json.itens.map((item: any) => ({
            id: item.id,
            local_id: gerarIdLocal(),
            exercicio_id: item.exercicio_id ? Number(item.exercicio_id) : null,
            nome_exercicio_snapshot: item.nome_exercicio_snapshot || "",
            series: item.series || "",
            repeticoes: item.repeticoes || "",
            carga: item.carga || "",
            descanso: item.descanso || "",
            observacoes: item.observacoes || "",
            ordem: Number(item.ordem || 0),
          }))
        : []
    );
  };

  const carregar = async () => {
    try {
      setErro("");

      if (!alunoId || Number.isNaN(alunoId)) {
        setErro("Aluno inválido");
        return;
      }

      await carregarBase();
      limparFormulario();
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar a página");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [alunoId]);

  const exerciciosFiltrados = useMemo(() => {
    const termo = buscaExercicio.trim().toLowerCase();
    if (!termo) return exercicios;

    return exercicios.filter((exercicio) => {
      const nome = String(exercicio.nome || "").toLowerCase();
      const grupo = String(exercicio.grupo_muscular || "").toLowerCase();
      const categoria = String(exercicio.categoria || "").toLowerCase();

      return (
        nome.includes(termo) ||
        grupo.includes(termo) ||
        categoria.includes(termo)
      );
    });
  }, [exercicios, buscaExercicio]);

  const adicionarExercicio = (exercicio: Exercicio) => {
    setItens((prev) => [
      ...prev,
      {
        local_id: gerarIdLocal(),
        exercicio_id: exercicio.id,
        nome_exercicio_snapshot: exercicio.nome,
        series: "",
        repeticoes: "",
        carga: "",
        descanso: "",
        observacoes: exercicio.observacoes_padrao || "",
        ordem: prev.length + 1,
      },
    ]);
  };

  const adicionarExercicioManual = () => {
    setItens((prev) => [
      ...prev,
      {
        local_id: gerarIdLocal(),
        exercicio_id: null,
        nome_exercicio_snapshot: "",
        series: "",
        repeticoes: "",
        carga: "",
        descanso: "",
        observacoes: "",
        ordem: prev.length + 1,
      },
    ]);
  };

  const atualizarItem = (
    localId: string,
    campo: keyof ItemTreino,
    valor: string | number | null
  ) => {
    setItens((prev) =>
      prev.map((item) =>
        item.local_id === localId ? { ...item, [campo]: valor } : item
      )
    );
  };

  const removerItem = (localId: string) => {
    setItens((prev) =>
      prev
        .filter((item) => item.local_id !== localId)
        .map((item, index) => ({
          ...item,
          ordem: index + 1,
        }))
    );
  };

  const moverItem = (indexAtual: number, direcao: "cima" | "baixo") => {
    setItens((prev) => {
      const novaLista = [...prev];
      const novoIndice = direcao === "cima" ? indexAtual - 1 : indexAtual + 1;

      if (novoIndice < 0 || novoIndice >= novaLista.length) return prev;

      const temp = novaLista[indexAtual];
      novaLista[indexAtual] = novaLista[novoIndice];
      novaLista[novoIndice] = temp;

      return novaLista.map((item, index) => ({
        ...item,
        ordem: index + 1,
      }));
    });
  };

  const abrirGeradorAutomatico = async () => {
    try {
      if (bibliotecaExercicios.length === 0) {
        await carregarBibliotecaExercicios();
      }
      setModalGeradorAberto(true);
    } catch (error: any) {
      alert(error?.message || "Erro ao carregar biblioteca de exercícios");
    }
  };

  const aplicarGeracaoAutomatica = async () => {
    try {
      setGerandoAutomatico(true);

      if (!aluno) {
        alert("Aluno não encontrado");
        return;
      }

      const biblioteca =
        bibliotecaExercicios.length > 0
          ? bibliotecaExercicios
          : await carregarBibliotecaExercicios();

      const treinosGerados = gerarTreinosAutomaticos(
        biblioteca,
        geradorObjetivo,
        geradorNivel,
        Number(geradorFrequencia),
        geradorDivisao
      );

      if (!treinosGerados.length) {
        alert("Não foi possível gerar os treinos com a biblioteca atual.");
        return;
      }

      const substituirAtuais = window.confirm(
        "Deseja apagar os treinos personalizados atuais deste aluno antes de gerar os novos?"
      );

      if (substituirAtuais && Array.isArray(treinosExistentes) && treinosExistentes.length > 0) {
        for (const treinoExistente of treinosExistentes) {
          const resDelete = await apiFetch(
            `/api/treinos-personalizados/${treinoExistente.id}`,
            {
              method: "DELETE",
            }
          );

          const jsonDelete = await resDelete.json().catch(() => ({}));

          if (!resDelete.ok) {
            alert(
              (jsonDelete as any).error ||
                `Erro ao excluir treino ${treinoExistente.titulo || treinoExistente.id}`
            );
            return;
          }
        }
      }

      const personalNome =
        typeof window !== "undefined"
          ? localStorage.getItem("treinoprint_nome") || null
          : null;

      for (const treino of treinosGerados) {
        const res = await apiFetch("/api/treinos-personalizados", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aluno_id: Number(aluno.id),
            personal_nome: personalNome,
            titulo: treino.titulo,
            objetivo: geradorObjetivo,
            observacoes: `Gerado automaticamente (${geradorDivisao.toUpperCase()})`,
            codigo_treino: treino.codigo_treino,
            dia_semana: treino.dia_semana,
            ordem: treino.ordem,
            ativo: true,
            itens: treino.itens.map((item: any, index: number) => ({
              exercicio_id: item.exercicio_id || null,
              nome_exercicio_snapshot: item.nome_exercicio_snapshot || "",
              series: item.series || "",
              repeticoes: item.repeticoes || "",
              carga: item.carga || "",
              descanso: item.descanso || "",
              observacoes: item.observacoes || "",
              ordem: Number(item.ordem || index + 1),
            })),
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert((json as any).error || `Erro ao salvar ${treino.titulo || "treino"}`);
          return;
        }
      }

      setModalGeradorAberto(false);
      await carregarBase();
      limparFormulario();

      alert(`${treinosGerados.length} treinos gerados com sucesso.`);
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar treinos automáticos");
    } finally {
      setGerandoAutomatico(false);
    }
  };

  const salvar = async () => {
    try {
      if (!alunoId || Number.isNaN(alunoId)) {
        alert("Aluno inválido");
        return;
      }

      if (itens.length === 0) {
        alert("Adicione pelo menos um exercício");
        return;
      }

      const itemSemNome = itens.find(
        (item) => !String(item.nome_exercicio_snapshot || "").trim()
      );

      if (itemSemNome) {
        alert("Todos os exercícios precisam ter nome");
        return;
      }

      setSalvando(true);

      const payload = {
        aluno_id: alunoId,
        personal_nome:
          typeof window !== "undefined"
            ? localStorage.getItem("treinoprint_nome") || null
            : null,
        titulo: titulo || null,
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        codigo_treino: codigoTreino || null,
        dia_semana: diaSemana || null,
        ordem: Number(ordemTreino || 0),
        ativo,
        itens: itens.map((item, index) => ({
          exercicio_id: item.exercicio_id,
          nome_exercicio_snapshot: item.nome_exercicio_snapshot,
          series: item.series,
          repeticoes: item.repeticoes,
          carga: item.carga,
          descanso: item.descanso,
          observacoes: item.observacoes,
          ordem: index + 1,
        })),
      };

      const res = await apiFetch(
        treinoId
          ? `/api/treinos-personalizados/${treinoId}`
          : `/api/treinos-personalizados`,
        {
          method: treinoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao salvar treino personalizado");
        return;
      }

      const novoTreinoId =
        treinoId || (json as any)?.treino?.id || (json as any)?.id || null;

      alert(
        treinoId
          ? "Treino atualizado com sucesso"
          : "Treino criado com sucesso"
      );

      await carregarBase();

      if (novoTreinoId) {
        await carregarTreino(Number(novoTreinoId));
        setTreinoId(Number(novoTreinoId));
      } else {
        limparFormulario();
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Treinos personalizados do aluno
          </h1>
          <p className="text-gray-500 mt-2">
            {aluno ? `Aluno: ${aluno.nome}` : ""}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => router.push("/alunos")}
            className="bg-zinc-700 text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>

          <button
            onClick={() => limparFormulario()}
            className="bg-zinc-800 text-white px-5 py-3 rounded-xl"
          >
            Novo treino
          </button>

          <button
            type="button"
            onClick={abrirGeradorAutomatico}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2"
          >
            Gerar treino automático
          </button>

          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            {salvando ? "Salvando..." : treinoId ? "Salvar alterações" : "Criar treino"}
          </button>
        </div>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Treinos já cadastrados</h2>

        {treinosExistentes.length === 0 ? (
          <p className="text-gray-500">Nenhum treino personalizado cadastrado.</p>
        ) : (
          <div className="grid gap-3">
            {treinosExistentes.map((treino) => (
              <div
                key={treino.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {treino.titulo || "Treino sem título"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Código: {treino.codigo_treino || "-"} • Dia: {treino.dia_semana || "-"}
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await carregarBase();
                      await carregarTreino(treino.id);
                    } catch (error: any) {
                      setErro(error.message || "Erro ao carregar treino");
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Dados do treino</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Aluno
            </label>
            <input
              value={aluno?.nome || ""}
              disabled
              className="border rounded-xl p-3 w-full bg-gray-100"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 h-[48px] mt-6">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <span className="text-sm">Treino ativo</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Código do treino
            </label>
            <input
              value={codigoTreino}
              onChange={(e) => setCodigoTreino(e.target.value)}
              placeholder="Ex: A"
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Dia da semana
            </label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="border rounded-xl p-3 w-full"
            >
              {diasSemana.map((dia) => (
                <option key={dia} value={dia}>
                  {dia || "Selecione"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Treino A - Hipertrofia"
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Ordem
            </label>
            <input
              type="number"
              value={ordemTreino}
              onChange={(e) => setOrdemTreino(e.target.value)}
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Objetivo
            </label>
            <input
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex: Ganho de massa"
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Observações gerais
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do treino"
              className="border rounded-xl p-3 w-full min-h-28"
            />
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              Biblioteca de exercícios
            </h2>
          </div>

          <button
            onClick={adicionarExercicioManual}
            className="bg-zinc-800 text-white px-4 py-3 rounded-xl"
          >
            Adicionar exercício manual
          </button>
        </div>

        <input
          value={buscaExercicio}
          onChange={(e) => setBuscaExercicio(e.target.value)}
          placeholder="Buscar exercício por nome, grupo muscular ou categoria"
          className="border rounded-xl p-3 w-full"
        />

        <div className="border rounded-2xl max-h-72 overflow-auto">
          {exerciciosFiltrados.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">
              Nenhum exercício encontrado.
            </p>
          ) : (
            exerciciosFiltrados.map((exercicio) => (
              <div
                key={exercicio.id}
                className="p-4 border-b last:border-b-0 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-gray-900">{exercicio.nome}</p>
                  <p className="text-sm text-gray-500">
                    {exercicio.grupo_muscular || "-"} • {exercicio.categoria || "-"}
                  </p>
                </div>

                <button
                  onClick={() => adicionarExercicio(exercicio)}
                  className="bg-black text-white px-4 py-2 rounded-xl"
                >
                  Adicionar
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Exercícios do treino</h2>

        {itens.length === 0 ? (
          <p className="text-gray-500">Nenhum exercício adicionado ainda.</p>
        ) : (
          <div className="space-y-4">
            {itens.map((item, index) => (
              <div
                key={item.local_id}
                className="border rounded-2xl p-4 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Exercício #{index + 1}
                    </p>
                    <p className="text-sm text-gray-500">Ordem: {item.ordem}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => moverItem(index, "cima")}
                      className="border rounded-xl px-3 py-2"
                    >
                      Subir
                    </button>

                    <button
                      onClick={() => moverItem(index, "baixo")}
                      className="border rounded-xl px-3 py-2"
                    >
                      Descer
                    </button>

                    <button
                      onClick={() => removerItem(item.local_id)}
                      className="bg-red-600 text-white rounded-xl px-3 py-2"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Nome do exercício
                    </label>
                    <input
                      value={item.nome_exercicio_snapshot}
                      onChange={(e) =>
                        atualizarItem(
                          item.local_id,
                          "nome_exercicio_snapshot",
                          e.target.value
                        )
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Séries
                    </label>
                    <input
                      value={item.series}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "series", e.target.value)
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Repetições
                    </label>
                    <input
                      value={item.repeticoes}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "repeticoes", e.target.value)
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Carga
                    </label>
                    <input
                      value={item.carga}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "carga", e.target.value)
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Descanso
                    </label>
                    <input
                      value={item.descanso}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "descanso", e.target.value)
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Observações
                    </label>
                    <input
                      value={item.observacoes}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "observacoes", e.target.value)
                      }
                      className="border rounded-xl p-3 w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalGeradorAberto ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Gerar treino automático
              </h2>

              <button
                type="button"
                onClick={() => setModalGeradorAberto(false)}
                className="border rounded-xl px-4 py-2"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Objetivo
                </label>
                <select
                  value={geradorObjetivo}
                  onChange={(e) => setGeradorObjetivo(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="resistencia">Resistência</option>
                  <option value="adaptacao">Adaptação</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nível
                </label>
                <select
                  value={geradorNivel}
                  onChange={(e) => setGeradorNivel(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Frequência semanal
                </label>
                <select
                  value={geradorFrequencia}
                  onChange={(e) => setGeradorFrequencia(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Divisão
                </label>
                <select
                  value={geradorDivisao}
                  onChange={(e) => setGeradorDivisao(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="fullbody">Full body</option>
                  <option value="ab">AB</option>
                  <option value="abc">ABC</option>
                  <option value="abcd">ABCD</option>
                  <option value="abcde">ABCDE</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
              O sistema vai montar uma base automática usando a biblioteca de exercícios da academia.
              Depois você poderá revisar e ajustar antes de salvar.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={aplicarGeracaoAutomatica}
                disabled={gerandoAutomatico}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-3 disabled:opacity-60"
              >
                {gerandoAutomatico ? "Gerando..." : "Gerar treino"}
              </button>

              <button
                type="button"
                onClick={() => setModalGeradorAberto(false)}
                className="flex-1 border rounded-xl py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}