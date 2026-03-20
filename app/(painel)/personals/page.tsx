"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Pencil,
  Trash2,
  UserPlus,
  Users,
  Phone,
  BadgeCheck,
  RefreshCcw,
  X,
} from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { useRouter } from "next/navigation";

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

function somenteNumeros(valor?: string) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarTelefoneVisual(valor?: string) {
  const numeros = somenteNumeros(valor);

  if (numeros.length === 11) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(
      7
    )}`;
  }

  if (numeros.length === 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(
      6
    )}`;
  }

  return valor || "";
}

export default function PersonalsPage() {
  const router = useRouter();

  const [personals, setPersonals] = useState<Personal[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cref, setCref] = useState("");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

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

    try {
      setExcluindoId(id);

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
    } finally {
      setExcluindoId(null);
    }
  };

  const personalsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return personals;

    return personals.filter((personal) => {
      return (
        String(personal.nome || "").toLowerCase().includes(termo) ||
        String(personal.telefone || "").toLowerCase().includes(termo) ||
        String(personal.cref || "").toLowerCase().includes(termo)
      );
    });
  }, [personals, busca]);

  const totalComTelefone = useMemo(() => {
    return personals.filter((p) => String(p.telefone || "").trim()).length;
  }, [personals]);

  const totalComCref = useMemo(() => {
    return personals.filter((p) => String(p.cref || "").trim()).length;
  }, [personals]);

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
            <h1 className="text-5xl md:text-6xl font-black mt-2">
              Personais
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre, edite e gerencie os profissionais da academia.
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
          onClick={carregarPersonals}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 hover:bg-zinc-50 transition"
        >
          <RefreshCcw size={16} />
          Atualizar
        </button>

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
          <p className="text-sm text-gray-500">Total de personais</p>
          <p className="text-2xl font-black mt-2 text-blue-600">
            {personals.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Com telefone</p>
          <p className="text-2xl font-black mt-2 text-green-600">
            {totalComTelefone}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Com CREF</p>
          <p className="text-2xl font-black mt-2 text-violet-600">
            {totalComCref}
          </p>
        </div>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              {editandoId ? "Editar personal" : "Novo personal"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre ou atualize os dados dos profissionais.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            {editandoId ? <Pencil size={14} /> : <UserPlus size={14} />}
            {editandoId ? "Modo edição" : "Novo cadastro"}
          </div>
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
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {editandoId ? <Pencil size={16} /> : <UserPlus size={16} />}
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar personal"
            : "Cadastrar personal"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              Personais cadastrados
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Lista geral dos profissionais cadastrados na academia.
            </p>
          </div>

          <div className="w-full lg:w-[360px]">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, telefone ou CREF"
              className="w-full border rounded-xl p-3"
            />
          </div>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        {personalsFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum personal cadastrado.</p>
        ) : (
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {personalsFiltrados.map((personal) => (
              <div
                key={personal.id}
                className="border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold text-gray-900">
                      {personal.nome}
                    </p>

                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      <Users size={12} />
                      Personal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <p className="inline-flex items-center gap-2">
                      <Phone size={14} />
                      Telefone: {formatarTelefoneVisual(personal.telefone) || "-"}
                    </p>

                    <p className="inline-flex items-center gap-2">
                      <BadgeCheck size={14} />
                      CREF: {personal.cref || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => editarPersonal(personal)}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                  >
                    <Pencil size={16} />
                    Editar
                  </button>

                  <button
                    onClick={() => excluirPersonal(personal.id)}
                    disabled={excluindoId === personal.id}
                    className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white rounded-xl px-4 py-2 disabled:opacity-60"
                  >
                    <Trash2 size={16} />
                    {excluindoId === personal.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}