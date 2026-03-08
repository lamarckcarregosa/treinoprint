"use client";

import { useEffect, useState } from "react";

type Personal = {
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

export default function PersonalsPage() {
  const [personals, setPersonals] = useState<Personal[]>([]);
  const [novoPersonal, setNovoPersonal] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarPersonals = async () => {
    try {
      setErro("");
      const res = await apiFetch("/api/personals", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar personals");
        return;
      }

      setPersonals(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar personals");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarPersonals();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const cadastrarPersonal = async () => {
    const nome = novoPersonal.trim();
    if (!nome) return;

    try {
      setSalvando(true);
      setErro("");

      const res = await apiFetch("/api/personals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao cadastrar personal");
        return;
      }

      setNovoPersonal("");
      await carregarPersonals();
    } finally {
      setSalvando(false);
    }
  };

  const excluirPersonal = async (id: number | string) => {
    if (!confirm("Excluir este personal?")) return;

    const res = await apiFetch(`/api/personals/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Erro ao excluir personal");
      return;
    }

    await carregarPersonals();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Personais</h1>
        <p className="text-gray-500 mt-2">Cadastro e gerenciamento de personals</p>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-semibold">Novo personal</h2>

        <div className="flex gap-2">
          <input
            value={novoPersonal}
            onChange={(e) => setNovoPersonal(e.target.value)}
            placeholder="Nome do personal"
            className="border rounded-xl p-3 flex-1"
          />
          <button
            onClick={cadastrarPersonal}
            disabled={salvando}
            className="bg-black text-white rounded-xl px-4 disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Cadastrar"}
          </button>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold mb-4">Lista de Personais</h2>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : personals.length === 0 ? (
          <p className="text-gray-500">Nenhum personal cadastrado.</p>
        ) : (
          <div className="space-y-2">
            {personals.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border rounded-xl px-4 py-3"
              >
                <span>{p.nome}</span>
                <button
                  onClick={() => excluirPersonal(p.id)}
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