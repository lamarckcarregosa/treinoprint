"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

type Personal = {
  id: number;
  nome: string;
  telefone?: string;
  cref?: string;
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
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cref, setCref] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarPersonals = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/personals", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar personais");
        return;
      }

      setPersonals(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar personais");
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

  const limparFormulario = () => {
    setNome("");
    setTelefone("");
    setCref("");
    setEditandoId(null);
    setErro("");
  };

  const salvarPersonal = async () => {
    try {
      setErro("");

      if (!nome.trim()) {
        setErro("Preencha o nome do personal");
        return;
      }

      setSalvando(true);

      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim(),
        cref: cref.trim(),
      };

      const res = await apiFetch(
        editandoId ? `/api/personals/${editandoId}` : "/api/personals",
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
        setErro((json as any).error || "Erro ao salvar personal");
        return;
      }

      limparFormulario();
      await carregarPersonals();
    } finally {
      setSalvando(false);
    }
  };

  const editarPersonal = (personal: Personal) => {
    setEditandoId(personal.id);
    setNome(personal.nome || "");
    setTelefone(personal.telefone || "");
    setCref(personal.cref || "");
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const excluirPersonal = async (id: number) => {
    const confirmar = confirm("Deseja realmente excluir este personal?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/personals/${id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao excluir personal");
      return;
    }

    if (editandoId === id) {
      limparFormulario();
    }

    await carregarPersonals();
  };

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando personais..."
      />
    );
  }

  if (erro && personals.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar personais"
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
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Bem-vindo ao Personais
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre e gerencie os profissionais da academia.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              {editandoId ? "Editar personal" : "Novo personal"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre ou atualize os dados dos profissionais.
            </p>
          </div>

          {editandoId ? (
            <button
              onClick={limparFormulario}
              className="text-sm px-4 py-2 rounded-xl border"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Nome do personal"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Telefone
            </label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="(79) 99999-9999"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              CREF
            </label>
            <input
              value={cref}
              onChange={(e) => setCref(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Ex: 123456-G/SE"
            />
          </div>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          onClick={salvarPersonal}
          disabled={salvando}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar personal"
            : "Cadastrar personal"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Personais cadastrados</h2>

        {erro ? <p className="text-sm text-red-600 mb-4">{erro}</p> : null}

        {personals.length === 0 ? (
          <p className="text-gray-500">Nenhum personal cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {personals.map((personal) => (
              <div key={personal.id} className="border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-bold">{personal.nome}</p>
                    <p className="text-sm text-gray-600">
                      Telefone: {personal.telefone || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      CREF: {personal.cref || "-"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => editarPersonal(personal)}
                      className="text-blue-600 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => excluirPersonal(personal.id)}
                      className="text-red-600 text-sm"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}