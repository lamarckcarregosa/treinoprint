"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import {
  Activity,
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  User,
  X,
} from "lucide-react";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
};

type TreinoPersonalizado = {
  id: number;
  aluno_id: number;
  personal_id?: number | null;
  personal_nome?: string | null;
  titulo?: string | null;
  objetivo?: string | null;
  observacoes?: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

function formatDataHora(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR");
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm md:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export default function TreinosPersonalizadosPage() {
  const router = useRouter();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [treinos, setTreinos] = useState<TreinoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAlunoAberto, setModalAlunoAberto] = useState(false);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  const [busca, setBusca] = useState("");
  const [alunoFiltro, setAlunoFiltro] = useState("");
  const [somenteAtivos, setSomenteAtivos] = useState(true);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarAlunos = async () => {
    try {
      setCarregandoAlunos(true);

      const res = await apiFetch("/api/alunos", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        alert((json as any).error || "Erro ao carregar alunos");
        return;
      }

      setAlunos(Array.isArray(json) ? json : []);
    } finally {
      setCarregandoAlunos(false);
    }
  };

  const carregar = async () => {
    try {
      setErro("");

      const qs = new URLSearchParams();
      if (alunoFiltro) qs.set("aluno_id", alunoFiltro);
      if (somenteAtivos) qs.set("ativo", "true");

      const [resTreinos, resAlunos] = await Promise.all([
        apiFetch(`/api/treinos-personalizados?${qs.toString()}`, {
          cache: "no-store",
        }),
        apiFetch("/api/alunos", { cache: "no-store" }),
      ]);

      const jsonTreinos = await resTreinos.json().catch(() => []);
      const jsonAlunos = await resAlunos.json().catch(() => []);

      if (!resTreinos.ok) {
        setErro(
          (jsonTreinos as any).error || "Erro ao carregar treinos personalizados"
        );
        return;
      }

      if (!resAlunos.ok) {
        setErro((jsonAlunos as any).error || "Erro ao carregar alunos");
        return;
      }

      setTreinos(Array.isArray(jsonTreinos) ? jsonTreinos : []);
      setAlunos(Array.isArray(jsonAlunos) ? jsonAlunos : []);
    } catch {
      setErro("Erro ao carregar treinos personalizados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    carregar();
  }, [alunoFiltro, somenteAtivos]);

  const nomeAluno = (alunoId: number) => {
    return (
      alunos.find((a) => Number(a.id) === Number(alunoId))?.nome ||
      `Aluno #${alunoId}`
    );
  };

  const alunosFiltrados = alunos.filter((aluno) => {
    const termo = buscaAluno.trim().toLowerCase();
    if (!termo) return true;

    return (
      String(aluno.nome || "").toLowerCase().includes(termo) ||
      String(aluno.telefone || "")
        .toLowerCase()
        .includes(termo) ||
      String(aluno.cpf || "")
        .toLowerCase()
        .includes(termo)
    );
  });

  const treinosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return treinos;

    return treinos.filter((treino) => {
      const aluno = nomeAluno(treino.aluno_id).toLowerCase();
      const titulo = String(treino.titulo || "").toLowerCase();
      const objetivo = String(treino.objetivo || "").toLowerCase();
      const personal = String(treino.personal_nome || "").toLowerCase();

      return (
        aluno.includes(termo) ||
        titulo.includes(termo) ||
        objetivo.includes(termo) ||
        personal.includes(termo)
      );
    });
  }, [treinos, busca, alunos]);

  const excluirTreino = async (id: number) => {
    const confirmar = window.confirm(
      "Deseja realmente excluir este treino personalizado?"
    );
    if (!confirmar) return;

    try {
      setExcluindoId(id);

      const res = await apiFetch(`/api/treinos-personalizados/${id}`, {
        method: "DELETE",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao excluir treino");
        return;
      }

      await carregar();
    } finally {
      setExcluindoId(null);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
             <h1 className="mt-2 text-5xl font-black md:text-4xl">
              Treinos personalizados
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Gerencie os treinos individuais criados para alunos específicos.
            </p>
          </div>

          <div className="min-w-[240px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-white/60">Status do sistema</p>
            <p className="mt-1 text-xl font-black">TreinoPrint Online</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>

        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-700 px-5 py-3 text-white hover:bg-zinc-600"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <button
            type="button"
            onClick={async () => {
              setModalAlunoAberto(true);

              if (alunos.length === 0) {
                await carregarAlunos();
              }
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-white hover:bg-violet-700"
          >
            <Plus size={18} />
            Novo treino
          </button>
        </div>
      </section>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por aluno, título, objetivo ou personal"
              className="w-full rounded-xl border p-3 pl-10"
            />
          </div>

          <select
            value={alunoFiltro}
            onChange={(e) => setAlunoFiltro(e.target.value)}
            className="rounded-xl border p-3"
          >
            <option value="">Todos os alunos</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-xl border px-3 py-3">
            <input
              type="checkbox"
              checked={somenteAtivos}
              onChange={(e) => setSomenteAtivos(e.target.checked)}
            />
            <span className="text-sm">Somente ativos</span>
          </label>

          <button
            onClick={carregar}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-white"
          >
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </Card>

      {treinosFiltrados.length === 0 ? (
        <Card>
          <p className="text-gray-500">Nenhum treino personalizado encontrado.</p>
        </Card>
      ) : (
        <section className="bg-white rounded-2xl border border-black/5 p-3 
max-h-[500px] md:max-h-[650px] xl:max-h-[750px] 
overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300">
  {treinosFiltrados.map((treino) => (
            <div
              key={treino.id}
              className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-gray-900">
                    {treino.titulo || "Treino sem título"}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      treino.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {treino.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <p className="text-sm text-gray-600">
                  <strong>Aluno:</strong> {nomeAluno(treino.aluno_id)}
                </p>

                {treino.personal_nome ? (
                  <p className="text-sm text-gray-600">
                    <strong>Personal:</strong> {treino.personal_nome}
                  </p>
                ) : null}

                {treino.objetivo ? (
                  <p className="text-sm text-gray-600">
                    <strong>Objetivo:</strong> {treino.objetivo}
                  </p>
                ) : null}

                <p className="text-sm text-gray-500">
                  Atualizado em: {formatDataHora(treino.updated_at)}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  onClick={() =>
                    router.push(
                      `/alunos/${treino.aluno_id}/treino-personalizado?treino_id=${treino.id}`
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Eye size={16} />
                  Ver / editar
                </button>

                <button
                  onClick={() => excluirTreino(treino.id)}
                  disabled={excluindoId === treino.id}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  {excluindoId === treino.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {modalAlunoAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Selecionar aluno
              </h2>

              <button
                type="button"
                onClick={() => {
                  setModalAlunoAberto(false);
                  setBuscaAluno("");
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2"
              >
                <X size={16} />
                Fechar
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                placeholder="Buscar por nome, telefone ou CPF"
                className="w-full rounded-xl border p-3 pl-10"
              />
            </div>

            <div className="mt-4 max-h-[420px] overflow-auto rounded-2xl border">
              {carregandoAlunos ? (
                <div className="p-4 text-sm text-gray-500">
                  Carregando alunos...
                </div>
              ) : alunosFiltrados.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  Nenhum aluno encontrado.
                </div>
              ) : (
                alunosFiltrados.map((aluno) => (
                  <button
                    key={aluno.id}
                    type="button"
                    onClick={() => {
                      setModalAlunoAberto(false);
                      setBuscaAluno("");
                      router.push(`/alunos/${aluno.id}/treino-personalizado`);
                    }}
                    className="w-full border-b px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                        <User size={15} className="text-zinc-600" />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">{aluno.nome}</p>

                        <div className="mt-1 space-y-1 text-xs text-gray-500">
                          {aluno.telefone ? <p>Telefone: {aluno.telefone}</p> : null}
                          {aluno.cpf ? <p>CPF: {aluno.cpf}</p> : null}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}