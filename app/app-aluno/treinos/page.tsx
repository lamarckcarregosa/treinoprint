"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, CheckCircle2 } from "lucide-react";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
};

type Impressao = {
  id: number;
  dia?: string;
  nivel?: string;
  personal_nome?: string;
  exercicios?: Exercicio[];
  created_at: string;
};

type ExercicioFeito = {
  historico_impressao_id: number;
  exercicio_indice: number;
  feito: boolean;
};

function formatDataHora(data?: string) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleString("pt-BR");
}

function calcularProgresso(total: number, feitos: number) {
  if (!total) return 0;
  return Math.round((feitos / total) * 100);
}

export default function TreinosAlunoPage() {
  const [lista, setLista] = useState<Impressao[]>([]);
  const [feitos, setFeitos] = useState<ExercicioFeito[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [treinoAberto, setTreinoAberto] = useState<number | null>(null);
  const [salvandoKey, setSalvandoKey] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const [resTreinos, resFeitos] = await Promise.all([
          apiFetchAluno("/api/app-aluno/treinos", {
            cache: "no-store",
          }),
          apiFetchAluno("/api/app-aluno/treinos/feitos", {
            cache: "no-store",
          }),
        ]);

        const jsonTreinos = await resTreinos.json().catch(() => []);
        const jsonFeitos = await resFeitos.json().catch(() => []);

        if (!resTreinos.ok) {
          setErro((jsonTreinos as any).error || "Erro ao carregar treinos");
          return;
        }

        if (!resFeitos.ok) {
          setErro((jsonFeitos as any).error || "Erro ao carregar progresso");
          return;
        }

        const treinosOrdenados = (Array.isArray(jsonTreinos) ? jsonTreinos : []).sort(
          (a: Impressao, b: Impressao) =>
            String(b.created_at || "").localeCompare(String(a.created_at || ""))
        );

        setLista(treinosOrdenados);
        setFeitos(Array.isArray(jsonFeitos) ? jsonFeitos : []);
      } catch {
        setErro("Erro ao carregar treinos");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const toggleTreino = (id: number) => {
    setTreinoAberto((atual) => (atual === id ? null : id));
  };

  const isFeito = (historicoId: number, exercicioIndice: number) => {
    return feitos.some(
      (item) =>
        item.historico_impressao_id === historicoId &&
        item.exercicio_indice === exercicioIndice &&
        item.feito
    );
  };

  const marcarComoFeito = async (
    historico_impressao_id: number,
    exercicio_indice: number
  ) => {
    const key = `${historico_impressao_id}-${exercicio_indice}`;

    try {
      setSalvandoKey(key);

      const jaFeito = isFeito(historico_impressao_id, exercicio_indice);

      const res = await apiFetchAluno("/api/app-aluno/treinos/feito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          historico_impressao_id,
          exercicio_indice,
          feito: !jaFeito,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao atualizar exercício");
        return;
      }

      setFeitos((prev) => {
        const outros = prev.filter(
          (item) =>
            !(
              item.historico_impressao_id === historico_impressao_id &&
              item.exercicio_indice === exercicio_indice
            )
        );

        return [
          ...outros,
          {
            historico_impressao_id,
            exercicio_indice,
            feito: !jaFeito,
          },
        ];
      });
    } finally {
      setSalvandoKey("");
    }
  };

  const treinoAtual = useMemo(() => {
    return lista.length > 0 ? lista[0] : null;
  }, [lista]);

  const historicoTreinos = useMemo(() => {
    return treinoAtual ? lista.filter((item) => item.id !== treinoAtual.id) : [];
  }, [lista, treinoAtual]);

  const getResumoTreino = (treino: Impressao | null) => {
    if (!treino || !Array.isArray(treino.exercicios)) {
      return {
        total: 0,
        feitosCount: 0,
        progresso: 0,
      };
    }

    const total = treino.exercicios.length;
    const feitosCount = treino.exercicios.filter((_, index) =>
      isFeito(treino.id, index)
    ).length;

    return {
      total,
      feitosCount,
      progresso: calcularProgresso(total, feitosCount),
    };
  };

  const resumoTreinoAtual = getResumoTreino(treinoAtual);
  const treinoAtualConcluido =
    resumoTreinoAtual.total > 0 &&
    resumoTreinoAtual.feitosCount === resumoTreinoAtual.total;

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-xl font-black text-gray-900">Meus treinos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Último treino impresso e histórico de treinos
        </p>
      </section>

      {erro ? (
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-red-600">{erro}</p>
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-gray-900">Treino atual</h2>

          {treinoAtual ? (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black text-white">
              Treino atual
            </span>
          ) : null}
        </div>

        {!treinoAtual ? (
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Nenhum treino encontrado.</p>
          </div>
        ) : (
          <div
            className={`rounded-2xl shadow overflow-hidden border-2 ${
              treinoAtualConcluido
                ? "bg-green-50 border-green-300"
                : "bg-white border-black/10"
            }`}
          >
            <div
              onClick={() => toggleTreino(treinoAtual.id)}
              className="flex items-center justify-between p-4 cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">
                    Treino: {treinoAtual.dia || "-"}
                  </p>

                  {treinoAtualConcluido ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-green-600 text-white">
                      <CheckCircle2 size={12} />
                      Concluído
                    </span>
                  ) : null}
                </div>

                <p className="text-sm text-gray-600">
                  Nível: {treinoAtual.nivel || "-"}
                </p>
                <p className="text-sm text-gray-600">
                  Personal: {treinoAtual.personal_nome || "-"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Impresso em: {formatDataHora(treinoAtual.created_at)}
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {resumoTreinoAtual.feitosCount} de {resumoTreinoAtual.total} exercícios concluídos
                    </span>
                    <span className="font-semibold text-gray-900">
                      {resumoTreinoAtual.progresso}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        treinoAtualConcluido ? "bg-green-600" : "bg-green-500"
                      }`}
                      style={{ width: `${resumoTreinoAtual.progresso}%` }}
                    />
                  </div>
                </div>
              </div>

              <ChevronDown
                size={20}
                className={`transition-transform ml-3 ${
                  treinoAberto === treinoAtual.id ? "rotate-180" : ""
                }`}
              />
            </div>

            {treinoAtualConcluido ? (
              <div className="px-4 pb-4">
                <div className="rounded-xl bg-green-600 text-white px-4 py-3 text-sm font-semibold">
                  Parabéns, treino concluído.
                </div>
              </div>
            ) : null}

            {treinoAberto === treinoAtual.id && (
              <div className="border-t p-4 space-y-2">
                {Array.isArray(treinoAtual.exercicios) &&
                treinoAtual.exercicios.length > 0 ? (
                  treinoAtual.exercicios.map((ex, index) => {
                    const feito = isFeito(treinoAtual.id, index);
                    const key = `${treinoAtual.id}-${index}`;

                    return (
                      <div
                        key={index}
                        className={`rounded-xl border p-3 ${
                          feito ? "bg-green-50 border-green-200" : "bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p
                              className={`font-medium text-sm ${
                                feito
                                  ? "text-green-700 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {index + 1}. {ex.nome}
                            </p>

                            <p className="text-xs text-gray-600">
                              Séries: {ex.series || "-"} | Reps:{" "}
                              {ex.repeticoes || "-"} | Carga: {ex.carga || "-"}
                            </p>

                            {ex.obs && (
                              <p className="text-xs text-gray-500 mt-1">
                                Obs: {ex.obs}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => marcarComoFeito(treinoAtual.id, index)}
                            disabled={salvandoKey === key}
                            className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                              feito
                                ? "bg-green-600 text-white"
                                : "bg-black text-white"
                            } disabled:opacity-60`}
                          >
                            {salvandoKey === key
                              ? "Salvando..."
                              : feito
                              ? "Feito"
                              : "Marcar"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">
                    Nenhum exercício encontrado.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-900">Histórico de treinos</h2>

        {historicoTreinos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Nenhum treino no histórico.</p>
          </div>
        ) : (
          historicoTreinos.map((item) => {
            const aberto = treinoAberto === item.id;
            const resumo = getResumoTreino(item);
            const concluido = resumo.total > 0 && resumo.feitosCount === resumo.total;

            return (
              <div
                key={item.id}
                className={`rounded-2xl shadow overflow-hidden ${
                  concluido ? "bg-green-50" : "bg-white"
                }`}
              >
                <div
                  onClick={() => toggleTreino(item.id)}
                  className="flex items-center justify-between p-4 cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">
                        Treino: {item.dia || "-"}
                      </p>

                      {concluido ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-green-600 text-white">
                          <CheckCircle2 size={12} />
                          Concluído
                        </span>
                      ) : null}
                    </div>

                    <p className="text-sm text-gray-600">
                      Nível: {item.nivel || "-"}
                    </p>

                    <p className="text-sm text-gray-600">
                      Personal: {item.personal_nome || "-"}
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Impresso em: {formatDataHora(item.created_at)}
                    </p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">
                          {resumo.feitosCount} de {resumo.total} concluídos
                        </span>
                        <span className="font-semibold text-gray-900">
                          {resumo.progresso}%
                        </span>
                      </div>

                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${resumo.progresso}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <ChevronDown
                    size={20}
                    className={`transition-transform ml-3 ${
                      aberto ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {aberto && (
                  <div className="border-t p-4 space-y-2">
                    {Array.isArray(item.exercicios) &&
                    item.exercicios.length > 0 ? (
                      item.exercicios.map((ex, index) => {
                        const feito = isFeito(item.id, index);
                        const key = `${item.id}-${index}`;

                        return (
                          <div
                            key={index}
                            className={`rounded-xl border p-3 ${
                              feito
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <p
                                  className={`font-medium text-sm ${
                                    feito
                                      ? "text-green-700 line-through"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {index + 1}. {ex.nome}
                                </p>

                                <p className="text-xs text-gray-600">
                                  Séries: {ex.series || "-"} | Reps:{" "}
                                  {ex.repeticoes || "-"} | Carga:{" "}
                                  {ex.carga || "-"}
                                </p>

                                {ex.obs && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Obs: {ex.obs}
                                  </p>
                                )}
                              </div>

                              <button
                                onClick={() => marcarComoFeito(item.id, index)}
                                disabled={salvandoKey === key}
                                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-semibold ${
                                  feito
                                    ? "bg-green-600 text-white"
                                    : "bg-black text-white"
                                } disabled:opacity-60`}
                              >
                                {salvandoKey === key
                                  ? "Salvando..."
                                  : feito
                                  ? "Feito"
                                  : "Marcar"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">
                        Nenhum exercício encontrado.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}