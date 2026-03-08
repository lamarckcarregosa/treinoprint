"use client";

import { useEffect, useState } from "react";

type Aluno = {
  id: number | string;
  nome: string;
};

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

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [novoAluno, setNovoAluno] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarAlunos = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/alunos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar alunos");
        return;
      }

      setAlunos(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar alunos");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarAlunos();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const cadastrarAluno = async () => {
    const nome = novoAluno.trim();
    if (!nome) return;

    try {
      setSalvando(true);
      setErro("");

      const res = await apiFetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao cadastrar aluno");
        return;
      }

      setNovoAluno("");
      await carregarAlunos();
    } finally {
      setSalvando(false);
    }
  };

  const excluirAluno = async (id: number | string) => {
    if (!confirm("Excluir este aluno?")) return;

    const res = await apiFetch(`/api/alunos/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir aluno");
      return;
    }

    await carregarAlunos();
  };

  const alunosFiltrados = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Alunos</h1>
        <p className="text-gray-500 mt-2">Cadastro e gerenciamento de alunos</p>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-semibold">Novo aluno</h2>

        <div className="flex gap-2">
          <input
            value={novoAluno}
            onChange={(e) => setNovoAluno(e.target.value)}
            placeholder="Nome do aluno"
            className="border rounded-xl p-3 flex-1"
          />
          <button
            onClick={cadastrarAluno}
            disabled={salvando}
            className="bg-black text-white rounded-xl px-4 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Cadastrar"}
          </button>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">Lista de alunos</h2>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno..."
            className="border rounded-xl p-3 w-full max-w-sm"
          />
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : alunosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum aluno cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {alunosFiltrados.map((aluno) => (
              <div
                key={aluno.id}
                className="flex items-center justify-between border rounded-xl px-4 py-3"
              >
                <span>{aluno.nome}</span>
                <button
                  onClick={() => excluirAluno(aluno.id)}
                  className="text-red-600 text-sm"
                >
                  Excluir
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}