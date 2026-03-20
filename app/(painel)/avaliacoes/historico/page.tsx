"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Search,
  User,
  CalendarDays,
  ChartColumnBig,
  Eye,
  Filter,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";

type Aluno = {
  id: number;
  nome: string;
};

type Avaliacao = {
  id: number;
  aluno_id: number;
  aluno_nome?: string;
  data_avaliacao: string;
  peso?: number | null;
  altura?: number | null;
  percentual_gordura?: number | null;
  cintura?: number | null;
  created_at?: string | null;
};

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function formatData(d?: string | null) {
  if (!d) return "-";
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatNumero(v?: number | null, digits = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toFixed(digits);
}

export default function HistoricoAvaliacoesPage() {
  return (
    <ProtegePagina permissao="imprimir">
      <HistoricoAvaliacoesPageContent />
    </ProtegePagina>
  );
}

function HistoricoAvaliacoesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const alunoIdUrl = searchParams.get("aluno_id") || "";

  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [buscandoAlunos, setBuscandoAlunos] = useState(false);

  const [alunoId, setAlunoId] = useState(alunoIdUrl);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!alunoIdUrl) return;
    carregarAlunoPorId(alunoIdUrl);
  }, [alunoIdUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      buscarAlunos(busca);
    }, 300);

    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    carregarAvaliacoes();
  }, [alunoId]);

  async function carregarAlunoPorId(id: string) {
    try {
      const res = await apiFetch(`/api/alunos/busca?q=${id}&exact=1`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => []);
      if (res.ok && Array.isArray(json)) {
        setAlunos(json);
      }
    } catch {}
  }

  async function buscarAlunos(q: string) {
    try {
      setBuscandoAlunos(true);

      const termo = q.trim();
      if (termo.length < 2) {
        setAlunos([]);
        return;
      }

      const res = await apiFetch(
        `/api/alunos/busca?q=${encodeURIComponent(termo)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => []);

      if (res.ok) {
        setAlunos(Array.isArray(json) ? json : []);
      }
    } catch {
    } finally {
      setBuscandoAlunos(false);
    }
  }

  async function carregarAvaliacoes() {
    try {
      setLoading(true);
      setErro("");

      const res = await apiFetch("/api/avaliacoes", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar avaliações");
        return;
      }

      const lista = Array.isArray(json) ? json : [];

      const filtrada = alunoId
        ? lista.filter((a: Avaliacao) => String(a.aluno_id) === String(alunoId))
        : lista;

      filtrada.sort((a: Avaliacao, b: Avaliacao) =>
        String(b.data_avaliacao || "").localeCompare(String(a.data_avaliacao || ""))
      );

      setAvaliacoes(filtrada);
    } catch {
      setErro("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }

  const alunoSelecionado = useMemo(() => {
    return alunos.find((a) => String(a.id) === String(alunoId)) || null;
  }, [alunos, alunoId]);

  const resumo = useMemo(() => {
    const total = avaliacoes.length;
    const ultima = avaliacoes[0];
    const primeira = avaliacoes[avaliacoes.length - 1];

    const deltaPeso =
      ultima?.peso !== undefined &&
      ultima?.peso !== null &&
      primeira?.peso !== undefined &&
      primeira?.peso !== null
        ? Number((Number(ultima.peso) - Number(primeira.peso)).toFixed(2))
        : null;

    return {
      total,
      ultima,
      primeira,
      deltaPeso,
    };
  }, [avaliacoes]);

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-zinc-300">Avaliações físicas</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Histórico de avaliações
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Consulte a evolução do aluno, abra avaliações antigas e acompanhe o histórico completo.
            </p>
          </div>

          <div className="min-w-[260px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-white/60">Aluno selecionado</p>
            <p className="mt-1 text-xl font-black">
              {alunoSelecionado?.nome || "Todos"}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          title="Filtrar por aluno"
          subtitle="Busca rápida para localizar o histórico de um aluno específico."
        >
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite pelo menos 2 letras"
              className="w-full rounded-xl border border-zinc-300 py-3 pl-11 pr-4 outline-none focus:border-black"
            />
          </div>

          <div className="max-h-72 overflow-auto rounded-xl border">
            <button
              type="button"
              onClick={() => setAlunoId("")}
              className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-gray-50 ${
                alunoId === "" ? "bg-blue-50 font-semibold" : ""
              }`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                <Filter size={16} className="text-zinc-600" />
              </div>
              <span>Todos os alunos</span>
            </button>

            {buscandoAlunos ? (
              <p className="p-4 text-sm text-gray-500">Buscando alunos...</p>
            ) : alunos.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                Digite para buscar alunos.
              </p>
            ) : (
              alunos.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAlunoId(String(a.id))}
                  className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                    alunoId === String(a.id) ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                    <User size={16} className="text-zinc-600" />
                  </div>
                  <span>{a.nome}</span>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card
          title="Resumo do histórico"
          subtitle="Visão rápida do período carregado."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Total de avaliações</p>
              <p className="mt-2 text-2xl font-black">{resumo.total}</p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Última avaliação</p>
              <p className="mt-2 text-2xl font-black">
                {resumo.ultima ? formatData(resumo.ultima.data_avaliacao) : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Primeira avaliação</p>
              <p className="mt-2 text-2xl font-black">
                {resumo.primeira ? formatData(resumo.primeira.data_avaliacao) : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Variação de peso</p>
              <p className="mt-2 text-2xl font-black">
                {resumo.deltaPeso === null
                  ? "-"
                  : `${resumo.deltaPeso > 0 ? "+" : ""}${resumo.deltaPeso} kg`}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Lista de avaliações"
        subtitle="Abra uma avaliação para ver detalhes completos e acessar o dashboard corporal."
      >
        {loading ? (
          <p className="text-sm text-gray-500">Carregando avaliações...</p>
        ) : erro ? (
          <p className="text-sm text-red-600">{erro}</p>
        ) : avaliacoes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma avaliação encontrada.
          </p>
        ) : (
          <div className="max-h-[520px] overflow-y-auto pr-2 space-y-3">
  {avaliacoes.map((item) => (
    <div
      key={item.id}
      className="flex flex-col gap-4 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
    >
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-5">
        <div>
          <p className="text-xs text-gray-500">Aluno</p>
          <p className="font-bold">
            {item.aluno_nome || `Aluno #${item.aluno_id}`}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Data</p>
          <p className="font-bold">{formatData(item.data_avaliacao)}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Peso</p>
          <p className="font-bold">
            {item.peso !== null && item.peso !== undefined
              ? `${formatNumero(item.peso)} kg`
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">% Gordura</p>
          <p className="font-bold">
            {item.percentual_gordura !== null &&
            item.percentual_gordura !== undefined
              ? `${formatNumero(item.percentual_gordura)}%`
              : "-"}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Cintura</p>
          <p className="font-bold">
            {item.cintura !== null && item.cintura !== undefined
              ? `${formatNumero(item.cintura)} cm`
              : "-"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => router.push(`/avaliacoes/${item.id}`)}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-white"
        >
          <Eye size={16} />
          Abrir avaliação
        </button>

        <button
          onClick={() => router.push(`/alunos/${item.aluno_id}/evolucao`)}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-3"
        >
          <ChartColumnBig size={16} />
          Dashboard corporal
        </button>
      </div>
    </div>
  ))}
</div>
        )}
      </Card>
    </main>
  );
}