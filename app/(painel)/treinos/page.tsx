"use client";

import { useEffect, useState } from "react";

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
};

type Treino = {
  id: number | string;
  semana: string;
  dia: string;
  nivel: string;
  tipo: string;
  exercicios: Exercicio[];
};

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const niveis = ["Iniciante", "Intermediário", "Avançado"];
const tipos = ["Masculino", "Feminino"];

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export default function TreinosPage() {
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<number | string | null>(null);

  const [semana, setSemana] = useState("2026-03-02");
  const [dia, setDia] = useState(diasSemana[0]);
  const [nivel, setNivel] = useState(niveis[0]);
  const [tipo, setTipo] = useState(tipos[0]);

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [novoEx, setNovoEx] = useState<Exercicio>({
    nome: "",
    series: "",
    repeticoes: "",
    carga: "",
    obs: "",
  });

  const carregarTreinos = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/treinos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar treinos");
        return;
      }

      setTreinos(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar treinos");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarTreinos();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const limparFormulario = () => {
    setEditandoId(null);
    setSemana("2026-03-02");
    setDia(diasSemana[0]);
    setNivel(niveis[0]);
    setTipo(tipos[0]);
    setExercicios([]);
    setNovoEx({
      nome: "",
      series: "",
      repeticoes: "",
      carga: "",
      obs: "",
    });
    setErro("");
  };

  const adicionarExercicio = () => {
    if (!novoEx.nome?.trim()) return;

    setExercicios((prev) => [
      ...prev,
      {
        nome: novoEx.nome.trim(),
        series: novoEx.series || "",
        repeticoes: novoEx.repeticoes || "",
        carga: novoEx.carga || "",
        obs: novoEx.obs || "",
      },
    ]);

    setNovoEx({
      nome: "",
      series: "",
      repeticoes: "",
      carga: "",
      obs: "",
    });
  };

  const removerExercicio = (index: number) => {
    setExercicios((prev) => prev.filter((_, i) => i !== index));
  };

  const atualizarCampoExercicio = (
    index: number,
    campo: keyof Exercicio,
    valor: string
  ) => {
    setExercicios((prev) =>
      prev.map((ex, i) => (i === index ? { ...ex, [campo]: valor } : ex))
    );
  };

  const salvarTreino = async () => {
    try {
      setErro("");

      if (!semana || !dia || !nivel || !tipo) {
        setErro("Preencha semana, dia, nível e tipo");
        return;
      }

      if (exercicios.length === 0) {
        setErro("Adicione pelo menos um exercício");
        return;
      }

      setSalvando(true);

      const payload = {
        semana,
        dia,
        nivel,
        tipo,
        exercicios,
      };

      const res = await apiFetch(
        editandoId ? `/api/treinos/${editandoId}` : "/api/treinos",
        {
          method: editandoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao salvar treino");
        return;
      }

      limparFormulario();
      await carregarTreinos();
    } finally {
      setSalvando(false);
    }
  };

  const excluirTreino = async (id: number | string) => {
    if (!confirm("Excluir este treino?")) return;

    const res = await apiFetch(`/api/treinos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir treino");
      return;
    }

    if (editandoId === id) {
      limparFormulario();
    }

    await carregarTreinos();
  };

  const editarTreino = (treino: Treino) => {
    setEditandoId(treino.id);
    setSemana(treino.semana || "");
    setDia(treino.dia || diasSemana[0]);
    setNivel(treino.nivel || niveis[0]);
    setTipo(treino.tipo || tipos[0]);
    setExercicios(Array.isArray(treino.exercicios) ? treino.exercicios : []);
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Treinos</h1>
        <p className="text-gray-500 mt-2">Cadastro e gerenciamento de treinos modelo</p>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">
            {editandoId ? "Editar treino" : "Novo treino"}
          </h2>

          {editandoId ? (
            <button
              onClick={limparFormulario}
              className="text-sm px-4 py-2 rounded-xl border"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Semana</label>
            <input
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="2026-03-02"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Dia</label>
            <select
              value={dia}
              onChange={(e) => setDia(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              {diasSemana.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Nível</label>
            <select
              value={nivel}
              onChange={(e) => setNivel(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              {niveis.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              {tipos.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold">Adicionar exercício</h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <input
              className="border rounded-xl p-3 md:col-span-2"
              placeholder="Exercício"
              value={novoEx.nome}
              onChange={(e) => setNovoEx({ ...novoEx, nome: e.target.value })}
            />
            <input
              className="border rounded-xl p-3"
              placeholder="Séries"
              value={novoEx.series}
              onChange={(e) => setNovoEx({ ...novoEx, series: e.target.value })}
            />
            <input
              className="border rounded-xl p-3"
              placeholder="Repetições"
              value={novoEx.repeticoes}
              onChange={(e) => setNovoEx({ ...novoEx, repeticoes: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="border rounded-xl p-3"
              placeholder="Carga"
              value={novoEx.carga}
              onChange={(e) => setNovoEx({ ...novoEx, carga: e.target.value })}
            />
            <input
              className="border rounded-xl p-3"
              placeholder="Observação"
              value={novoEx.obs}
              onChange={(e) => setNovoEx({ ...novoEx, obs: e.target.value })}
            />
          </div>

          <button
            onClick={adicionarExercicio}
            className="bg-black text-white rounded-xl px-4 py-3"
          >
            Adicionar exercício
          </button>

          <div className="space-y-3">
            {exercicios.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum exercício adicionado.</p>
            ) : (
              exercicios.map((ex, index) => (
                <div key={index} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{index + 1}. Exercício</p>
                    <button
                      onClick={() => removerExercicio(index)}
                      className="text-red-600 text-sm"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      className="border rounded-xl p-3"
                      placeholder="Nome"
                      value={ex.nome}
                      onChange={(e) =>
                        atualizarCampoExercicio(index, "nome", e.target.value)
                      }
                    />
                    <input
                      className="border rounded-xl p-3"
                      placeholder="Carga"
                      value={ex.carga || ""}
                      onChange={(e) =>
                        atualizarCampoExercicio(index, "carga", e.target.value)
                      }
                    />
                    <input
                      className="border rounded-xl p-3"
                      placeholder="Séries"
                      value={ex.series || ""}
                      onChange={(e) =>
                        atualizarCampoExercicio(index, "series", e.target.value)
                      }
                    />
                    <input
                      className="border rounded-xl p-3"
                      placeholder="Repetições"
                      value={ex.repeticoes || ""}
                      onChange={(e) =>
                        atualizarCampoExercicio(index, "repeticoes", e.target.value)
                      }
                    />
                  </div>

                  <input
                    className="border rounded-xl p-3 w-full"
                    placeholder="Observação"
                    value={ex.obs || ""}
                    onChange={(e) =>
                      atualizarCampoExercicio(index, "obs", e.target.value)
                    }
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          onClick={salvarTreino}
          disabled={salvando}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar treino"
            : "Salvar treino"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold mb-4">Treinos cadastrados</h2>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : treinos.length === 0 ? (
          <p className="text-gray-500">Nenhum treino cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {treinos.map((treino) => (
              <div key={treino.id} className="border rounded-2xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {treino.dia} • {treino.nivel} • {treino.tipo}
                    </p>
                    <p className="text-sm text-gray-500">Semana: {treino.semana}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => editarTreino(treino)}
                      className="text-blue-600 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => excluirTreino(treino.id)}
                      className="text-red-600 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {Array.isArray(treino.exercicios) && treino.exercicios.length > 0 ? (
                    treino.exercicios.map((ex, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-xl px-3 py-2 text-sm">
                        <p className="font-semibold">{idx + 1}. {ex.nome}</p>
                        <p className="text-gray-600">
                          Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga: {ex.carga || "-"}
                        </p>
                        {ex.obs ? <p className="text-gray-500">Obs: {ex.obs}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Sem exercícios.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}