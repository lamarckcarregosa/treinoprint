"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Users,
  UserCheck,
  Dumbbell,
  CalendarDays,
  AlertTriangle,
  Wallet,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Printer,
  Landmark,
  Activity,
  Target,
  ShieldAlert,
  BarChart3,
  Clock3,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

type TreinoDia = {
  dia: string;
  total: number;
};

type TreinoNivel = {
  nivel: string;
  total: number;
};

type TreinoRecente = {
  horario: string;
  aluno: string;
  dia: string;
};

type TreinoHorario = {
  hora: string;
  total: number;
};

type RankingItem = {
  nome: string;
  total: number;
};

type DiaMovimento = {
  dia: string;
  total: number;
};

type UltimoPagamento = {
  id: number;
  aluno: string;
  valor: number;
  forma_pagamento?: string | null;
  data_pagamento?: string | null;
};

type AlunoVencido = {
  aluno: string;
  valor: number;
  vencimento: string;
};

type DashboardData = {
  alunosCadastrados: number;
  alunosAtivos: number;
  treinosHoje: number;
  personalMaisAtivo: string;
  diaMaisUsado: string;
  mensalidadesEmAberto: number;
  inadimplentes: number;
  treinosPorDia: TreinoDia[];
  treinosPorNivel: TreinoNivel[];
  treinosRecentes: TreinoRecente[];
  treinosPorHorario: TreinoHorario[];
  rankingPersonal: RankingItem[];
  alunosMaisTreinam: RankingItem[];
  diasMaisMovimentados: DiaMovimento[];
  ultimosPagamentos: UltimoPagamento[];
  alunosVencidos: AlunoVencido[];
  financeiro: {
    receitaMes: number;
    despesas: number;
    pontoEquilibrio: number;
  };
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

function formatBRL(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDataHora(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR");
}

function formatData(data?: string | null) {
  if (!data) return "-";
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const dt = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

function PremiumCard({
  title,
  value,
  subtitle,
  icon,
  valueClassName = "",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-[28px] shadow-sm border border-black/5 p-4 overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-zinc-100 -mr-8 -mt-8" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-zinc-500">{title}</p>
          <p className={`text-xl md:text-2xl font-black mt-2 break-words ${valueClassName}`}>
            {value}
          </p>
          {subtitle ? <p className="text-sm text-zinc-400 mt-2">{subtitle}</p> : null}
        </div>

        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[28px] shadow-sm border border-black/5 p-4"
    >
      <div className="mb-4">
        <h2 className="font-bold text-lg text-zinc-900">{title}</h2>
        {subtitle ? <p className="text-sm text-zinc-500 mt-1">{subtitle}</p> : null}
      </div>
      {children}
    </motion.div>
  );
}

function QuickAction({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0">
            {icon}
          </div>

          <div className="leading-tight min-w-0">
            <p className="font-semibold text-sm text-zinc-900">{title}</p>
            <p className="text-xs text-zinc-500">{description}</p>
          </div>
        </div>

        <ArrowRight
          size={16}
          className="text-zinc-400 transition group-hover:translate-x-1 shrink-0"
        />
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [periodo, setPeriodo] = useState("mes");

  const nomeAcademia =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_nome") || "sua academia"
      : "sua academia";

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const url = `/api/dashboard?periodo=${periodo}`;
        const res = await apiFetch(url, { cache: "no-store" });
        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar dashboard");
          return;
        }

        setDados(json as DashboardData);
      } catch {
        setErro("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [periodo]);

  const pieData = useMemo(
    () =>
      (dados?.treinosPorNivel || []).map((item) => ({
        name: item.nivel,
        value: item.total,
      })),
    [dados]
  );

  const pieColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

  const lucroMes = useMemo(() => {
    if (!dados) return 0;
    return Number(dados.financeiro.receitaMes || 0) - Number(dados.financeiro.despesas || 0);
  }, [dados]);

  const financeiroLinha = useMemo(() => {
    if (!dados) return [];
    return [
      {
        nome: "Financeiro",
        receita: dados.financeiro.receitaMes,
        despesas: dados.financeiro.despesas,
        equilibrio: dados.financeiro.pontoEquilibrio,
        lucro: lucroMes,
      },
    ];
  }, [dados, lucroMes]);

  const taxaAtividade = useMemo(() => {
    if (!dados?.alunosCadastrados) return 0;
    return Math.round(
      (Number(dados.alunosAtivos || 0) / Number(dados.alunosCadastrados || 0)) * 100
    );
  }, [dados]);

  const taxaInadimplencia = useMemo(() => {
    if (!dados?.alunosAtivos) return 0;
    return Math.round(
      (Number(dados.inadimplentes || 0) / Number(dados.alunosAtivos || 0)) * 100
    );
  }, [dados]);

  const nivelMaisUsado = useMemo(() => {
    if (!dados?.treinosPorNivel?.length) return "-";
    return [...dados.treinosPorNivel].sort((a, b) => b.total - a.total)[0]?.nivel || "-";
  }, [dados]);

  const totalTreinosPeriodo = useMemo(() => {
    return (dados?.treinosPorDia || []).reduce((acc, item) => acc + Number(item.total || 0), 0);
  }, [dados]);

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando dashboard..."
      />
    );
  }

  if (erro || !dados) {
    return (
      <SystemError
        titulo="Erro ao carregar dashboard"
        mensagem={erro || "Não foi possível carregar o painel."}
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
              Bem-vindo ao Dashboard
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Acompanhe a visão geral de {nomeAcademia} em tempo real.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-zinc-300">Personal mais ativo</p>
                <p className="font-bold mt-1">{dados.personalMaisAtivo || "-"}</p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-zinc-300">Dia mais usado</p>
                <p className="font-bold mt-1">{dados.diaMaisUsado || "-"}</p>
              </div>

              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs text-zinc-300">Nível mais usado</p>
                <p className="font-bold mt-1">{nivelMaisUsado}</p>
              </div>
            </div>
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

      <SectionCard
        title="Filtros e atalhos"
        subtitle="Escolha o período e acesse rapidamente os módulos principais"
      >
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify gap-4">
            <div />
            <div className="w-full md:w-[200px]">
              <label className="block text-sm font-medium text-zinc-600 mb-2">
                Período
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="border rounded-2xl p-3 w-full"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Mês atual</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <QuickAction
              title="Alunos"
              description="Gerenciar cadastros e fichas"
              icon={<Users size={20} />}
              onClick={() => router.push("/alunos")}
            />
            <QuickAction
              title="Pagamentos"
              description="Receber mensalidades"
              icon={<CreditCard size={20} />}
              onClick={() => router.push("/pagamentos")}
            />
            <QuickAction
              title="Financeiro"
              description="Despesas e relatórios"
              icon={<Landmark size={20} />}
              onClick={() => router.push("/financeiro")}
            />
            <QuickAction
              title="Imprimir treinos"
              description="Acessar impressão"
              icon={<Printer size={20} />}
              onClick={() => router.push("/imprimir")}
            />
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumCard
          title="Alunos cadastrados"
          value={dados.alunosCadastrados}
          icon={<Users size={22} />}
        />
        <PremiumCard
          title="Alunos ativos"
          value={dados.alunosAtivos}
          subtitle={`${taxaAtividade}% da base ativa`}
          icon={<UserCheck size={22} />}
        />
        <PremiumCard
          title="Treinos no período"
          value={totalTreinosPeriodo}
          subtitle={periodo === "hoje" ? "Movimento de hoje" : "Total no período"}
          icon={<Dumbbell size={22} />}
        />
        <PremiumCard
          title="Treinos hoje"
          value={dados.treinosHoje}
          subtitle="Últimas 24h / dia atual"
          icon={<CalendarDays size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumCard
          title="Mensalidades em aberto"
          value={dados.mensalidadesEmAberto}
          subtitle="Lançamentos pendentes"
          icon={<CreditCard size={20} />}
          valueClassName="text-yellow-600"
        />
        <PremiumCard
          title="Inadimplentes"
          value={dados.inadimplentes}
          subtitle={`${taxaInadimplencia}% dos ativos`}
          icon={<AlertTriangle size={22} />}
          valueClassName="text-red-600"
        />
        <PremiumCard
          title="Receita do período"
          value={formatBRL(dados.financeiro.receitaMes)}
          icon={<Wallet size={20} />}
          valueClassName="text-green-600"
        />
        <PremiumCard
          title="Lucro do período"
          value={formatBRL(lucroMes)}
          subtitle="Receita - despesas"
          icon={<TrendingUp size={22} />}
          valueClassName={lucroMes >= 0 ? "text-violet-600" : "text-red-600"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <PremiumCard
          title="Personal mais ativo"
          value={dados.personalMaisAtivo || "-"}
          subtitle="Maior número de impressões"
          icon={<Target size={22} />}
        />
        <PremiumCard
          title="Dia mais usado"
          value={dados.diaMaisUsado || "-"}
          subtitle="Treino mais recorrente"
          icon={<BarChart3 size={22} />}
        />
        <PremiumCard
          title="Nível mais usado"
          value={nivelMaisUsado}
          subtitle="Maior participação no período"
          icon={<Dumbbell size={22} />}
        />
        <PremiumCard
          title="Risco de inadimplência"
          value={`${taxaInadimplencia}%`}
          subtitle="Baseado nos alunos ativos"
          icon={<ShieldAlert size={22} />}
          valueClassName={taxaInadimplencia > 20 ? "text-red-600" : "text-amber-600"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Treinos por dia"
          subtitle="Distribuição dos treinos no período selecionado"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.treinosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Treinos por nível"
          subtitle="Participação dos níveis no período"
        >
          <div className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Sem dados no período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Treinos por horário"
          subtitle="Descubra os horários de maior movimento"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.treinosPorHorario}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hora" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Dias mais movimentados"
          subtitle="Ranking dos dias com mais treinos"
        >
          {dados.diasMaisMovimentados.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem dados no período.</p>
          ) : (
            <div className="space-y-3">
              {dados.diasMaisMovimentados.map((item, index) => (
                <div
                  key={`${item.dia}-${index}`}
                  className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{item.dia}</p>
                    <p className="text-sm text-zinc-500">Movimento no período</p>
                  </div>

                  <p className="font-black text-emerald-600">{item.total}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard
          title="Ranking de personal"
          subtitle="Profissionais com mais treinos entregues"
        >
          {dados.rankingPersonal.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem dados no período.</p>
          ) : (
            <div className="space-y-3">
              {dados.rankingPersonal.map((item, index) => (
                <div
                  key={`${item.nome}-${index}`}
                  className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                      <Trophy size={18} />
                    </div>

                    <div>
                      <p className="font-semibold text-zinc-900">{item.nome}</p>
                      <p className="text-sm text-zinc-500">Treinos entregues</p>
                    </div>
                  </div>

                  <p className="font-black text-blue-600">{item.total}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Alunos que mais treinam"
          subtitle="Quem mais recebeu treino no período"
        >
          {dados.alunosMaisTreinam.length === 0 ? (
            <p className="text-sm text-zinc-500">Sem dados no período.</p>
          ) : (
            <div className="space-y-3">
              {dados.alunosMaisTreinam.map((item, index) => (
                <div
                  key={`${item.nome}-${index}`}
                  className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                      <Users size={18} />
                    </div>

                    <div>
                      <p className="font-semibold text-zinc-900">{item.nome}</p>
                      <p className="text-sm text-zinc-500">Treinos recebidos</p>
                    </div>
                  </div>

                  <p className="font-black text-violet-600">{item.total}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Financeiro" subtitle="Resumo consolidado do período">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <PremiumCard
            title="Receita"
            value={formatBRL(dados.financeiro.receitaMes)}
            icon={<Wallet size={20} />}
            valueClassName="text-green-600"
          />
          <PremiumCard
            title="Despesas"
            value={formatBRL(dados.financeiro.despesas)}
            icon={<AlertTriangle size={20} />}
            valueClassName="text-red-600"
          />
          <PremiumCard
            title="Ponto de equilíbrio"
            value={formatBRL(dados.financeiro.pontoEquilibrio)}
            icon={<CreditCard size={20} />}
            valueClassName="text-blue-600"
          />
          <PremiumCard
            title="Lucro estimado"
            value={formatBRL(lucroMes)}
            icon={<TrendingUp size={20} />}
            valueClassName={lucroMes >= 0 ? "text-violet-600" : "text-red-600"}
          />
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={financeiroLinha}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatBRL(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#16a34a" strokeWidth={3} />
              <Line type="monotone" dataKey="despesas" stroke="#dc2626" strokeWidth={3} />
              <Line type="monotone" dataKey="equilibrio" stroke="#2563eb" strokeWidth={3} />
              <Line type="monotone" dataKey="lucro" stroke="#7c3aed" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SectionCard title="Últimos pagamentos" subtitle="Pagamentos confirmados recentemente">
          {dados.ultimosPagamentos.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum pagamento recente.</p>
          ) : (
            <div className="space-y-3">
              {dados.ultimosPagamentos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{item.aluno}</p>
                    <p className="text-sm text-zinc-500">
                      {item.forma_pagamento || "-"} • {formatDataHora(item.data_pagamento)}
                    </p>
                  </div>

                  <p className="font-black text-green-600 shrink-0">{formatBRL(item.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Alunos com vencimento em aberto"
          subtitle="Mensalidades vencidas ou pendentes"
        >
          {dados.alunosVencidos.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum aluno vencido no momento.</p>
          ) : (
            <div className="space-y-3">
              {dados.alunosVencidos.map((item, index) => (
                <div
                  key={`${item.aluno}-${index}`}
                  className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 truncate">{item.aluno}</p>
                    <p className="text-sm text-zinc-500">
                      Vencimento: {formatData(item.vencimento)}
                    </p>
                  </div>

                  <p className="font-black text-yellow-600 shrink-0">{formatBRL(item.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Treinos recentes" subtitle="Últimas movimentações registradas">
        {dados.treinosRecentes.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum treino recente.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dados.treinosRecentes.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
                    <Clock3 size={18} />
                  </div>

                  <div>
                    <p className="font-semibold text-zinc-900">{item.aluno}</p>
                    <p className="text-sm text-zinc-500 mt-1">{item.horario}</p>
                    <p className="text-sm text-zinc-600 mt-1">Treino {item.dia}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}