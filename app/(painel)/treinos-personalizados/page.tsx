"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

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
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Treinos personalizados
          </h1>
          <p className="text-gray-500 mt-2">
            Gerencie os treinos individuais criados para alunos específicos.
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
            type="button"
            onClick={async () => {
              setModalAlunoAberto(true);

              if (alunos.length === 0) {
                await carregarAlunos();
              }
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2"
          >
            Novo treino
          </button>
        </div>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por aluno, título, objetivo ou personal"
            className="border rounded-xl p-3"
          />

          <select
            value={alunoFiltro}
            onChange={(e) => setAlunoFiltro(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Todos os alunos</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 border rounded-xl px-3 py-3">
            <input
              type="checkbox"
              checked={somenteAtivos}
              onChange={(e) => setSomenteAtivos(e.target.checked)}
            />
            <span className="text-sm">Somente ativos</span>
          </label>

          <button
            onClick={carregar}
            className="bg-zinc-800 text-white rounded-xl px-5 py-3"
          >
            Atualizar
          </button>
        </div>
      </section>

      {treinosFiltrados.length === 0 ? (
        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <p className="text-gray-500">
            Nenhum treino personalizado encontrado.
          </p>
        </section>
      ) : (
        <section className="space-y-3">
          {treinosFiltrados.map((treino) => (
            <div
              key={treino.id}
              className="bg-white rounded-2xl shadow p-5 border border-black/5 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-lg font-bold text-gray-900">
                    {treino.titulo || "Treino sem título"}
                  </p>

                  <span
                    className={`text-xs px-3 py-1 rounded-full ${
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

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/alunos/${treino.aluno_id}/treino-personalizado?treino_id=${treino.id}`
                    )
                  }
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                >
                  Ver / editar
                </button>

                <button
                  onClick={() => excluirTreino(treino.id)}
                  disabled={excluindoId === treino.id}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
                >
                  {excluindoId === treino.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      {modalAlunoAberto ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Selecionar aluno
              </h2>

              <button
                type="button"
                onClick={() => {
                  setModalAlunoAberto(false);
                  setBuscaAluno("");
                }}
                className="border rounded-xl px-4 py-2"
              >
                Fechar
              </button>
            </div>

            <input
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Buscar por nome, telefone ou CPF"
              className="w-full border rounded-xl p-3"
            />

            <div className="border rounded-2xl max-h-[420px] overflow-auto">
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
                    className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <p className="font-semibold text-gray-900">{aluno.nome}</p>

                    <div className="text-xs text-gray-500 mt-1 space-y-1">
                      {aluno.telefone ? <p>Telefone: {aluno.telefone}</p> : null}
                      {aluno.cpf ? <p>CPF: {aluno.cpf}</p> : null}
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