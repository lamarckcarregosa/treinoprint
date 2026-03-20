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
  UserPlus,
  UserX,
  TrendingUp,
  BarChart3,
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
import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import ResponsiveTable from "@/components/common/ResponsiveTable";

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
    inadimplentes?: number;
    alunos_risco?: number;
    novos_alunos_mes?: number;
    ticket_medio?: number;
    frequencia_media?: number;
  };
  ranking_personais: { nome: string; total: number }[];
  horarios_movimento: { hora: string; total: number }[];
  top_exercicios: { nome: string; total: number }[];
  top_alunos: { nome: string; total: number }[];
  treinos_por_dia_semana: { dia: string; total: number }[];
  faturamento_por_competencia: {
    competencia: string;
    pago: number;
    aberto: number;
  }[];
  treinos_por_divisao: { divisao: string; total: number }[];
};

type LinhaAlerta = {
  titulo: string;
  tipo: string;
  nivel: "baixo" | "medio" | "alto";
  data: string;
};

function CardResumo({
  titulo,
  valor,
  icon: Icon,
  cor = "text-black",
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  icon: any;
  cor?: string;
  subtitulo?: string;
}) {
  return (
    <SectionCard>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{titulo}</p>
        <Icon size={18} className={cor} />
      </div>

      <p className={`mt-3 text-2xl font-black ${cor}`}>{valor}</p>

      {subtitulo ? (
        <p className="mt-2 text-sm text-zinc-500">{subtitulo}</p>
      ) : null}
    </SectionCard>
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
    <SectionCard title={titulo}>
      {itens.length === 0 ? (
        <p className="text-gray-500">Sem dados.</p>
      ) : (
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {itens.map((item, index) => (
            <div
              key={`${item.nome}-${index}`}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <div>
                <p className="font-semibold text-gray-900">{item.nome}</p>
                <p className="text-sm text-gray-500">
                  {item.total} {label}
                </p>
              </div>

              <span className="rounded-full bg-black px-3 py-1 text-xs text-white">
                #{index + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function nivelToVariant(nivel: "baixo" | "medio" | "alto") {
  if (nivel === "alto") return "danger" as const;
  if (nivel === "medio") return "warning" as const;
  return "info" as const;
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

  const alertasOperacionais = useMemo<LinhaAlerta[]>(() => {
    if (!resumo) return [];

    const dataHoje = new Date().toLocaleDateString("pt-BR");
    const linhas: LinhaAlerta[] = [];

    if ((resumo.cards.inadimplentes || 0) > 0) {
      linhas.push({
        titulo: `${resumo.cards.inadimplentes} aluno(s) com inadimplência`,
        tipo: "Financeiro",
        nivel: resumo.cards.inadimplentes! >= 10 ? "alto" : "medio",
        data: dataHoje,
      });
    }

    if ((resumo.cards.alunos_risco || 0) > 0) {
      linhas.push({
        titulo: `${resumo.cards.alunos_risco} aluno(s) em risco de evasão`,
        tipo: "Retenção",
        nivel: resumo.cards.alunos_risco! >= 10 ? "alto" : "medio",
        data: dataHoje,
      });
    }

    if ((resumo.cards.faturamento_em_aberto || 0) > 0) {
      linhas.push({
        titulo: `Financeiro em aberto: ${formatBRL(
          resumo.cards.faturamento_em_aberto
        )}`,
        tipo: "Financeiro",
        nivel: resumo.cards.faturamento_em_aberto >= 3000 ? "alto" : "medio",
        data: dataHoje,
      });
    }

    if ((resumo.cards.treinos_impressos_hoje || 0) === 0) {
      linhas.push({
        titulo: "Nenhum treino impresso hoje",
        tipo: "Impressão",
        nivel: "baixo",
        data: dataHoje,
      });
    }

    if ((resumo.cards.acessos_liberados_hoje || 0) === 0) {
      linhas.push({
        titulo: "Nenhum acesso liberado hoje",
        tipo: "Acessos",
        nivel: "medio",
        data: dataHoje,
      });
    }

    return linhas;
  }, [resumo]);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <SectionCard>
          <p className="text-sm text-zinc-500">Carregando dashboard...</p>
        </SectionCard>
      </div>
    );
  }

  if (erro || !resumo) {
    return (
      <div className="w-full space-y-6">
        <SectionCard title="Erro ao carregar dashboard">
          <div className="space-y-4">
            <p className="text-red-600">
              {erro || "Erro ao carregar dashboard"}
            </p>

            <button
              onClick={carregar}
              className="rounded-xl bg-black px-4 py-3 text-white"
            >
              Tentar novamente
            </button>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <PageContainer
      title="Dashboard"
      subtitle="Resumo operacional, financeiro e uso do sistema."
      rightContent={
        <div className="min-w-[260px] rounded-[24px] bg-white/10 px-5 py-4 text-white backdrop-blur">
          <p className="text-xs text-white/60">Horário de pico</p>
          <p className="mt-1 text-xl font-black">
            {picoHorario
              ? `${picoHorario.hora} • ${picoHorario.total} registros`
              : "-"}
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
            <Activity size={16} />
            Sistema online
          </div>
        </div>
      }
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Alunos cadastrados"
          valor={resumo.cards.alunos_cadastrados}
          icon={Users}
          cor="text-blue-600"
          subtitulo="Base total da academia"
        />

        <CardResumo
          titulo="Alunos ativos"
          valor={resumo.cards.alunos_ativos}
          icon={UserCheck}
          cor="text-green-600"
          subtitulo="Alunos em operação"
        />

        <CardResumo
          titulo="Novos no mês"
          valor={resumo.cards.novos_alunos_mes || 0}
          icon={UserPlus}
          cor="text-indigo-600"
          subtitulo="Entradas recentes"
        />

        <CardResumo
          titulo="Alunos em risco"
          valor={resumo.cards.alunos_risco || 0}
          icon={UserX}
          cor="text-red-600"
          subtitulo="Sem acesso recente"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Faturamento pago"
          valor={formatBRL(resumo.cards.faturamento_pago)}
          icon={Wallet}
          cor="text-emerald-600"
          subtitulo="Recebido no período"
        />

        <CardResumo
          titulo="Em aberto"
          valor={formatBRL(resumo.cards.faturamento_em_aberto)}
          icon={AlertCircle}
          cor="text-yellow-600"
          subtitulo="Valores pendentes"
        />

        <CardResumo
          titulo="Inadimplentes"
          valor={resumo.cards.inadimplentes || 0}
          icon={TrendingUp}
          cor="text-orange-600"
          subtitulo="Mensalidades vencidas"
        />

        <CardResumo
          titulo="Ticket médio"
          valor={formatBRL(resumo.cards.ticket_medio || 0)}
          icon={BarChart3}
          cor="text-cyan-600"
          subtitulo="Média por aluno ativo"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CardResumo
          titulo="Treinos impressos hoje"
          valor={resumo.cards.treinos_impressos_hoje}
          icon={Printer}
          cor="text-violet-600"
          subtitulo="Movimento do dia"
        />

        <CardResumo
          titulo="Treinos personalizados ativos"
          valor={resumo.cards.treinos_personalizados_ativos}
          icon={Dumbbell}
          cor="text-orange-600"
          subtitulo="Treinos ativos no sistema"
        />

        <CardResumo
          titulo="Acessos liberados hoje"
          valor={resumo.cards.acessos_liberados_hoje}
          icon={Activity}
          cor="text-cyan-600"
          subtitulo="Entradas registradas"
        />

        <CardResumo
          titulo="Frequência média"
          valor={resumo.cards.frequencia_media || 0}
          icon={Clock3}
          cor="text-pink-600"
          subtitulo="Média diária recente"
        />
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Faturamento por competência">
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
        </SectionCard>

        <SectionCard title="Treinos por dia da semana">
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
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Treinos por divisão">
  {!resumo.treinos_por_divisao || resumo.treinos_por_divisao.length === 0 ? (
            <p className="text-gray-500">Sem dados.</p>
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resumo.treinos_por_divisao}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="divisao" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Movimento por horário">
          {resumo.horarios_movimento.length === 0 ? (
            <p className="text-gray-500">Sem dados.</p>
          ) : (
            <div className="grid max-h-[320px] grid-cols-2 gap-3 overflow-y-auto pr-2 md:grid-cols-4">
              {resumo.horarios_movimento.map((item) => (
                <div
                  key={item.hora}
                  className="rounded-xl border px-4 py-3 text-center"
                >
                  <p className="text-sm text-gray-500">{item.hora}</p>
                  <p className="mt-1 text-xl font-black">{item.total}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Alertas operacionais">
          <ResponsiveTable
            data={alertasOperacionais}
            emptyText="Nenhum alerta operacional no momento."
            mobileCardTitle={(row) => row.titulo}
            columns={[
              { key: "titulo", label: "Título" },
              { key: "tipo", label: "Tipo" },
              {
                key: "nivel",
                label: "Nível",
                render: (row) => (
                  <StatusBadge
                    label={row.nivel}
                    variant={nivelToVariant(row.nivel)}
                  />
                ),
              },
              { key: "data", label: "Data" },
            ]}
          />
        </SectionCard>

        <ListaRanking
          titulo="Ranking de personais"
          itens={resumo.ranking_personais}
          label="treino(s)"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ListaRanking
          titulo="Top exercícios"
          itens={resumo.top_exercicios}
          label="uso(s)"
        />

        <ListaRanking
          titulo="Alunos que mais treinam"
          itens={resumo.top_alunos}
          label="registro(s)"
        />
      </div>
    </PageContainer>
  );
}