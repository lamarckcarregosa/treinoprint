"use client";

import { useEffect, useState } from "react";
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

type DashboardData = {
  alunosCadastrados: number;
  treinosHoje: number;
  personalMaisAtivo: string;
  diaMaisUsado: string;
  treinosPorDia: TreinoDia[];
  treinosPorNivel: TreinoNivel[];
  treinosRecentes: TreinoRecente[];
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
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function AnimatedCard({
  title,
  value,
  subtitle,
  className = "",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`bg-white rounded-3xl shadow-sm border border-black/5 p-5 ${className}`}
    >
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="text-2xl md:text-4xl font-black mt-2 break-words">{value}</p>
      {subtitle ? <p className="text-sm text-zinc-400 mt-2">{subtitle}</p> : null}
    </motion.div>
  );
}

export default function DashboardPage() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const res = await apiFetch("/api/dashboard", { cache: "no-store" });
        const json = await res.json();

        if (!res.ok) {
          setErro(json.error || "Erro ao carregar dashboard");
          return;
        }

        setDados(json);
      } catch {
        setErro("Erro ao carregar dashboard");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  if (loading) {
    return <p className="p-6">Carregando dashboard...</p>;
  }

  if (erro || !dados) {
    return <p className="p-6 text-red-600">{erro || "Erro ao carregar dashboard"}</p>;
  }

  const pieData = dados.treinosPorNivel.map((item) => ({
    name: item.nivel,
    value: item.total,
  }));

  const pieColors = ["#111827", "#374151", "#6B7280", "#9CA3AF"];

  const financeiroLinha = [
    {
      nome: "Financeiro",
      receita: dados.financeiro.receitaMes,
      despesas: dados.financeiro.despesas,
      equilibrio: dados.financeiro.pontoEquilibrio,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900">
          Dashboard TreinoPrint
        </h1>
        <p className="text-zinc-500">Visão geral da academia</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <AnimatedCard title="Alunos cadastrados" value={dados.alunosCadastrados} />
        <AnimatedCard title="Treinos hoje" value={dados.treinosHoje} />
        <AnimatedCard title="Personal mais ativo" value={dados.personalMaisAtivo} />
        <AnimatedCard title="Dia mais usado" value={dados.diaMaisUsado} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-black/5 p-5"
        >
          <h2 className="font-bold text-lg mb-4">Treinos por dia</h2>
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-sm border border-black/5 p-5"
        >
          <h2 className="font-bold text-lg mb-4">Treinos por nível</h2>
          <div className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Sem dados hoje.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-black/5 p-5"
      >
        <h2 className="font-bold text-lg mb-4">Financeiro</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <AnimatedCard title="Receita do mês" value={formatBRL(dados.financeiro.receitaMes)} />
          <AnimatedCard title="Despesas" value={formatBRL(dados.financeiro.despesas)} />
          <AnimatedCard
            title="Ponto de equilíbrio"
            value={formatBRL(dados.financeiro.pontoEquilibrio)}
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
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-black/5 p-5"
      >
        <h2 className="font-bold text-lg mb-4">Treinos recentes</h2>

        {dados.treinosRecentes.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum treino recente.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {dados.treinosRecentes.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3"
              >
                <p className="font-semibold">{item.aluno}</p>
                <p className="text-sm text-zinc-500 mt-1">{item.horario}</p>
                <p className="text-sm text-zinc-600">Treino {item.dia}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}