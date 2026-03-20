"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Dumbbell,
  Pencil,
  Trash2,
  Plus,
  RefreshCcw,
  X,
  Search,
  Layers3,
  CalendarDays,
} from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];
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
  const router = useRouter();

  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

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
        setErro((json as any).error || "Erro ao carregar treinos");
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
        setErro((json as any).error || "Erro ao salvar treino");
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

  const treinosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return treinos;

    return treinos.filter((treino) => {
      const base =
        `${treino.semana} ${treino.dia} ${treino.nivel} ${treino.tipo}`.toLowerCase();

      const exerciciosTexto = Array.isArray(treino.exercicios)
        ? treino.exercicios
            .map((ex) => `${ex.nome} ${ex.series} ${ex.repeticoes} ${ex.carga} ${ex.obs}`)
            .join(" ")
            .toLowerCase()
        : "";

      return base.includes(termo) || exerciciosTexto.includes(termo);
    });
  }, [treinos, busca]);

  const totalExerciciosCadastrados = useMemo(() => {
    return treinos.reduce(
      (acc, treino) => acc + (Array.isArray(treino.exercicios) ? treino.exercicios.length : 0),
      0
    );
  }, [treinos]);

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando treinos..."
      />
    );
  }

  if (erro && treinos.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar treinos"
        mensagem={erro || "Não foi possível carregar a página."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black mt-2">
              Treinos
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre e gerencie os treinos modelo da academia.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <button
          onClick={carregarTreinos}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 hover:bg-zinc-50 transition"
        >
          <RefreshCcw size={16} />
          Atualizar
        </button>

        <Link
          href="/treinos-personalizados"
          className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-5 py-3 transition"
        >
          <Layers3 size={16} />
          Treinos personalizados
        </Link>

        {editandoId ? (
          <button
            onClick={limparFormulario}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 hover:bg-zinc-50 transition"
          >
            <X size={16} />
            Cancelar edição
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Treinos cadastrados</p>
          <p className="text-2xl font-black mt-2 text-blue-600">
            {treinos.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Exercícios nos treinos</p>
          <p className="text-2xl font-black mt-2 text-emerald-600">
            {totalExerciciosCadastrados}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Modo atual</p>
          <p className="text-2xl font-black mt-2 text-violet-600">
            {editandoId ? "Edição" : "Cadastro"}
          </p>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              {editandoId ? "Editar treino" : "Novo treino"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Monte treinos por semana, dia, nível e tipo.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            {editandoId ? <Pencil size={14} /> : <Dumbbell size={14} />}
            {editandoId ? "Modo edição" : "Novo treino"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Semana
            </label>
            <input
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="2026-03-02"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Dia
            </label>
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
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Nível
            </label>
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
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Tipo
            </label>
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

        <div className="border rounded-2xl p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900">Adicionar exercício</h3>
            <p className="text-sm text-gray-500 mt-1">
              Monte os exercícios do treino antes de salvar.
            </p>
          </div>

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
              onChange={(e) =>
                setNovoEx({ ...novoEx, repeticoes: e.target.value })
              }
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
            className="inline-flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-3 hover:bg-zinc-800"
          >
            <Plus size={16} />
            Adicionar exercício
          </button>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {exercicios.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum exercício adicionado.</p>
            ) : (
              exercicios.map((ex, index) => (
                <div key={index} className="border rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="font-semibold text-gray-900">
                      {index + 1}. Exercício
                    </p>

                    <button
                      onClick={() => removerExercicio(index)}
                      className="inline-flex items-center gap-2 text-red-600 text-sm"
                    >
                      <Trash2 size={14} />
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
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {editandoId ? <Pencil size={16} /> : <Dumbbell size={16} />}
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar treino"
            : "Salvar treino"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              Treinos cadastrados
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Lista geral dos treinos modelo cadastrados na academia.
            </p>
          </div>

          <div className="w-full lg:w-[360px] relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por semana, dia, nível, tipo ou exercício"
              className="w-full border rounded-xl p-3 pl-10"
            />
          </div>
        </div>

        {erro ? <p className="text-sm text-red-600 mb-4">{erro}</p> : null}

        {treinosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum treino cadastrado.</p>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {treinosFiltrados.map((treino) => (
              <div key={treino.id} className="border rounded-2xl p-4 space-y-3">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-gray-900">
                        {treino.dia} • {treino.nivel} • {treino.tipo}
                      </p>

                      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        <CalendarDays size={12} />
                        Semana {treino.semana}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500">
                      {Array.isArray(treino.exercicios)
                        ? `${treino.exercicios.length} exercício(s)`
                        : "0 exercício"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => editarTreino(treino)}
                      className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => excluirTreino(treino.id)}
                      className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {Array.isArray(treino.exercicios) && treino.exercicios.length > 0 ? (
                    treino.exercicios.map((ex, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-50 rounded-xl px-3 py-3 text-sm border border-black/5"
                      >
                        <p className="font-semibold text-gray-900">
                          {idx + 1}. {ex.nome}
                        </p>
                        <p className="text-gray-600 mt-1">
                          Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga:{" "}
                          {ex.carga || "-"}
                        </p>
                        {ex.obs ? (
                          <p className="text-gray-500 mt-1">Obs: {ex.obs}</p>
                        ) : null}
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