"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import ResponsiveTable from "@/components/common/ResponsiveTable";
import StatusBadge from "@/components/common/StatusBadge";
import {
  Activity,
  Users,
  ShieldAlert,
  BadgeCheck,
  RefreshCcw,
  Search,
  Plus,
} from "lucide-react";

type Aluno = {
  id: number;
  nome: string;
  status?: string | null;
  plano?: string | null;
  telefone?: string | null;
  ultimo_acesso?: string | null;
  ultima_avaliacao?: string | null;
  ultimo_treino?: string | null;
  financeiro?: "em_dia" | "pendente" | "vencido";
  risco?: boolean;
};

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, {
    ...init,
    headers,
  });
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  async function carregar() {
    try {
      setErro("");
      setLoading(true);

      const res = await apiFetch("/api/alunos/resumo", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json?.error || "Erro ao carregar alunos");
        return;
      }

      setAlunos(json?.alunos || []);
    } catch {
      setErro("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const alunosFiltrados = useMemo(() => {
    return alunos.filter((aluno) => {
      const matchBusca = String(aluno.nome || "")
        .toLowerCase()
        .includes(busca.toLowerCase());

      const status = String(aluno.status || "").toLowerCase();

      const matchStatus =
        statusFiltro === "todos" ? true : status === statusFiltro;

      return matchBusca && matchStatus;
    });
  }, [alunos, busca, statusFiltro]);

  const totalAtivos = useMemo(() => {
    return alunos.filter(
      (aluno) => String(aluno.status || "").toLowerCase() === "ativo"
    ).length;
  }, [alunos]);

  const totalEmRisco = useMemo(() => {
    return alunos.filter((aluno) => Boolean(aluno.risco)).length;
  }, [alunos]);

  const totalVencidos = useMemo(() => {
    return alunos.filter((aluno) => aluno.financeiro === "vencido").length;
  }, [alunos]);

  return (
    <PageContainer>
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
          <h1 className="text-5xl md:text-6xl font-black mt-2">Alunos</h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Consulte situação, risco, financeiro e histórico dos alunos da
              academia.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[260px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-lg md:text-xl font-black mt-1">
              TreinoPrint Online
            </p>

            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} className="shrink-0" />
              <span className="leading-none">Sistema online</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/alunos/novo"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 transition"
        >
          <Plus size={16} />
          Novo aluno
        </Link>

        <button
          onClick={carregar}
          className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 hover:bg-zinc-50 transition"
        >
          <RefreshCcw size={16} />
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Total de alunos</p>
          <p className="text-2xl font-black mt-2 text-blue-600">
            {alunos.length}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <Users size={16} />
            Base cadastrada
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-black mt-2 text-emerald-600">
            {totalAtivos}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <BadgeCheck size={16} />
            Situação regular
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Em risco</p>
          <p className="text-2xl font-black mt-2 text-red-600">
            {totalEmRisco}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <ShieldAlert size={16} />
            Baixa atividade
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Financeiro vencido</p>
          <p className="text-2xl font-black mt-2 text-yellow-600">
            {totalVencidos}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <RefreshCcw size={16} />
            Requer atenção
          </div>
        </div>
      </div>

      <SectionCard title="Filtros">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium">
              Buscar aluno
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome do aluno"
                className="w-full rounded-xl border border-zinc-300 pl-10 pr-4 py-3 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none"
            >
              <option value="todos">Todos</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="bloqueado">Bloqueados</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={carregar}
              className="w-full rounded-xl bg-black px-4 py-3 text-white inline-flex items-center justify-center gap-2"
            >
              <RefreshCcw size={16} />
              Atualizar
            </button>
          </div>
        </div>
      </SectionCard>

      {loading ? (
        <SectionCard>
          <p className="text-sm text-zinc-500">Carregando alunos...</p>
        </SectionCard>
      ) : erro ? (
        <SectionCard title="Erro">
          <p className="text-red-600">{erro}</p>
        </SectionCard>
      ) : (
        <ResponsiveTable
          data={alunosFiltrados}
          emptyText="Nenhum aluno encontrado."
          mobileCardTitle={(row) => row.nome}
          columns={[
            {
              key: "nome",
              label: "Aluno",
              render: (row) => (
                <Link
                  href={`/alunos/${row.id}`}
                  className="font-semibold hover:underline"
                >
                  {row.nome}
                </Link>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (row) => {
                const status = String(row.status || "").toLowerCase();

                if (status === "ativo") {
                  return <StatusBadge label="Ativo" variant="success" />;
                }

                if (status === "inativo") {
                  return <StatusBadge label="Inativo" variant="neutral" />;
                }

                if (status === "bloqueado") {
                  return <StatusBadge label="Bloqueado" variant="danger" />;
                }

                return <StatusBadge label="Sem status" variant="neutral" />;
              },
            },
            {
              key: "plano",
              label: "Plano",
              render: (row) => row.plano || "-",
            },
            {
              key: "ultimo_acesso",
              label: "Último acesso",
              render: (row) => formatDate(row.ultimo_acesso),
            },
            {
              key: "ultima_avaliacao",
              label: "Última avaliação",
              render: (row) => formatDate(row.ultima_avaliacao),
            },
            {
              key: "financeiro",
              label: "Financeiro",
              render: (row) => {
                if (row.financeiro === "vencido") {
                  return <StatusBadge label="Vencido" variant="danger" />;
                }
                if (row.financeiro === "pendente") {
                  return <StatusBadge label="Pendente" variant="warning" />;
                }
                return <StatusBadge label="Em dia" variant="success" />;
              },
            },
            {
              key: "risco",
              label: "Risco",
              render: (row) =>
                row.risco ? (
                  <StatusBadge label="Risco" variant="danger" />
                ) : (
                  <StatusBadge label="Normal" variant="info" />
                ),
            },
          ]}
        />
      )}
    </PageContainer>
  );
}