"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserCheck,
  Printer,
  Dumbbell,
  Wallet,
  AlertCircle,
  Activity,
  Clock3,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

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

function formatBRL(valor?: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

type DashboardResumo = {
  cards: {
    alunos_cadastrados: number;
    alunos_ativos: number;
    treinos_impressos_hoje: number;
    treinos_personalizados_ativos: number;
    faturamento_pago: number;
    faturamento_em_aberto: number;
    acessos_liberados_hoje: number;
  };
  ranking_personais: { nome: string; total: number }[];
  horarios_movimento: { hora: string; total: number }[];
  top_exercicios: { nome: string; total: number }[];
  top_alunos: { nome: string; total: number }[];
  treinos_por_dia_semana: { dia: string; total: number }[];
  faturamento_por_competencia: { competencia: string; pago: number; aberto: number }[];
};

function CardResumo({
  titulo,
  valor,
  icon: Icon,
  cor = "text-black",
}: {
  titulo: string;
  valor: string | number;
  icon: any;
  cor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{titulo}</p>
        <Icon size={18} className={cor} />
      </div>
      <p className={`text-2xl font-black mt-3 ${cor}`}>{valor}</p>
    </div>
  );
}

function ListaRanking({
  titulo,
  itens,
  label,
}: {
  titulo: string;
  itens: { nome: string; total: number }[];
  label: string;
}) {
  return (
    <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{titulo}</h2>

      {itens.length === 0 ? (
        <p className="text-gray-500">Sem dados.</p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {itens.map((item, index) => (
            <div
              key={`${item.nome}-${index}`}
              className="flex items-center justify-between border rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.nome}</p>
                <p className="text-sm text-gray-500">
                  {item.total} {label}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-black text-white">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      setLoading(true);

      const res = await apiFetch("/api/dashboard/resumo", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar dashboard");
        return;
      }

      setResumo(json as DashboardResumo);
    } catch {
      setErro("Erro ao carregar dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const picoHorario = useMemo(() => {
    if (!resumo?.horarios_movimento?.length) return null;
    return [...resumo.horarios_movimento].sort((a, b) => b.total - a.total)[0];
  }, [resumo]);

  if (loading) {
    return <p className="p-6">Carregando dashboard...</p>;
  }

  if (erro || !resumo) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-red-600">{erro || "Erro ao carregar dashboard"}</p>
        <button
          onClick={carregar}
          className="bg-black text-white px-4 py-3 rounded-xl"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel geral</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Dashboard TreinoPrint
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Resumo operacional, financeiro e uso do sistema.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[260px]">
            <p className="text-white/60 text-xs">Horário de pico</p>
            <p className="text-xl font-black mt-1">
              {picoHorario ? `${picoHorario.hora} • ${picoHorario.total} registros` : "-"}
            </p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardResumo
          titulo="Alunos cadastrados"
          valor={resumo.cards.alunos_cadastrados}
          icon={Users}
          cor="text-blue-600"
        />
        <CardResumo
          titulo="Alunos ativos"
          valor={resumo.cards.alunos_ativos}
          icon={UserCheck}
          cor="text-green-600"
        />
        <CardResumo
          titulo="Treinos impressos hoje"
          valor={resumo.cards.treinos_impressos_hoje}
          icon={Printer}
          cor="text-violet-600"
        />
        <CardResumo
          titulo="Treinos personalizados ativos"
          valor={resumo.cards.treinos_personalizados_ativos}
          icon={Dumbbell}
          cor="text-orange-600"
        />
        <CardResumo
          titulo="Faturamento pago"
          valor={formatBRL(resumo.cards.faturamento_pago)}
          icon={Wallet}
          cor="text-emerald-600"
        />
        <CardResumo
          titulo="Em aberto"
          valor={formatBRL(resumo.cards.faturamento_em_aberto)}
          icon={AlertCircle}
          cor="text-yellow-600"
        />
        <CardResumo
          titulo="Acessos liberados hoje"
          valor={resumo.cards.acessos_liberados_hoje}
          icon={Activity}
          cor="text-cyan-600"
        />
        <CardResumo
          titulo="Horário mais movimentado"
          valor={picoHorario ? picoHorario.hora : "-"}
          icon={Clock3}
          cor="text-pink-600"
        />
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Treinos por dia da semana
          </h2>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resumo.treinos_por_dia_semana}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Faturamento por competência
          </h2>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resumo.faturamento_por_competencia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="competencia" />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => formatBRL(Number(value || 0))}
                />
                <Legend />
                <Line type="monotone" dataKey="pago" />
                <Line type="monotone" dataKey="aberto" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ListaRanking
          titulo="Ranking de personais"
          itens={resumo.ranking_personais}
          label="treino(s)"
        />

        <ListaRanking
          titulo="Top exercícios"
          itens={resumo.top_exercicios}
          label="uso(s)"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ListaRanking
          titulo="Alunos que mais treinam"
          itens={resumo.top_alunos}
          label="registro(s)"
        />

        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Movimento por horário
          </h2>

          {resumo.horarios_movimento.length === 0 ? (
            <p className="text-gray-500">Sem dados.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-2">
              {resumo.horarios_movimento.map((item) => (
                <div
                  key={item.hora}
                  className="border rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-sm text-gray-500">{item.hora}</p>
                  <p className="text-xl font-black mt-1">{item.total}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}