"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  observacoes_padrao?: string | null;
  ativo: boolean;
};

type ItemTreino = {
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

function gerarIdLocal() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function NovoTreinoPersonalizadoPage() {
  const router = useRouter();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [buscaAluno, setBuscaAluno] = useState("");
  const [buscaExercicio, setBuscaExercicio] = useState("");

  const [alunoId, setAlunoId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [ativo, setAtivo] = useState(true);

  const [itens, setItens] = useState<ItemTreino[]>([]);

  const carregar = async () => {
    try {
      setErro("");

      const [resAlunos, resExercicios] = await Promise.all([
        apiFetch("/api/alunos", { cache: "no-store" }),
        apiFetch("/api/exercicios?ativo=true", { cache: "no-store" }),
      ]);

      const jsonAlunos = await resAlunos.json().catch(() => []);
      const jsonExercicios = await resExercicios.json().catch(() => []);

      if (!resAlunos.ok) {
        setErro((jsonAlunos as any).error || "Erro ao carregar alunos");
        return;
      }

      if (!resExercicios.ok) {
        setErro((jsonExercicios as any).error || "Erro ao carregar exercícios");
        return;
      }

      setAlunos(Array.isArray(jsonAlunos) ? jsonAlunos : []);
      setExercicios(Array.isArray(jsonExercicios) ? jsonExercicios : []);
    } catch {
      setErro("Erro ao carregar dados da página");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const alunosFiltrados = useMemo(() => {
    const termo = buscaAluno.trim().toLowerCase();
    if (!termo) return alunos;

    return alunos.filter((aluno) =>
      String(aluno.nome || "").toLowerCase().includes(termo)
    );
  }, [alunos, buscaAluno]);

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
      const novoIndice =
        direcao === "cima" ? indexAtual - 1 : indexAtual + 1;

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

  const salvar = async () => {
    try {
      setErro("");

      if (!alunoId) {
        alert("Selecione um aluno");
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

      const res = await apiFetch("/api/treinos-personalizados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aluno_id: Number(alunoId),
          personal_nome:
            typeof window !== "undefined"
              ? localStorage.getItem("treinoprint_nome") || null
              : null,
          titulo: titulo || null,
          objetivo: objetivo || null,
          observacoes: observacoes || null,
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
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao salvar treino personalizado");
        return;
      }

      alert("Treino personalizado criado com sucesso");
      router.push("/treinos-personalizados");
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
            Novo treino personalizado
          </h1>
          <p className="text-gray-500 mt-2">
            Monte um treino individual para um aluno específico.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="bg-zinc-700 text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>

          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar treino"}
          </button>
        </div>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Dados do treino</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Buscar aluno
            </label>
            <input
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Digite o nome do aluno"
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Aluno
            </label>
            <select
              value={alunoId}
              onChange={(e) => setAlunoId(e.target.value)}
              className="border rounded-xl p-3 w-full"
            >
              <option value="">Selecione</option>
              {alunosFiltrados.map((aluno) => (
                <option key={aluno.id} value={aluno.id}>
                  {aluno.nome}
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

          <div>
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 h-[48px]">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <span className="text-sm">Treino ativo</span>
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              Biblioteca de exercícios
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Pesquise e adicione exercícios ao treino.
            </p>
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
                    <p className="text-sm text-gray-500">
                      Ordem: {item.ordem}
                    </p>
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
    </main>
  );
}