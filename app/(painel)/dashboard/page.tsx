"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Dashboard TreinoPrint</h1>
        <p className="text-gray-500 mt-2">Visão geral da academia</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Alunos cadastrados</p>
          <p className="text-4xl font-black mt-2">{dados.alunosCadastrados}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Treinos hoje</p>
          <p className="text-4xl font-black mt-2">{dados.treinosHoje}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Personal mais ativo</p>
          <p className="text-2xl font-black mt-2">{dados.personalMaisAtivo}</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Dia mais usado</p>
          <p className="text-2xl font-black mt-2">{dados.diaMaisUsado}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-bold text-lg mb-4">Treinos por dia</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.treinosPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="dia" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <h2 className="font-bold text-lg mb-4">Treinos por nível</h2>
          <div className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Sem dados hoje.
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
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Receita do mês</p>
          <p className="text-3xl font-black text-green-600 mt-2">
            {formatBRL(dados.financeiro.receitaMes)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Despesas</p>
          <p className="text-3xl font-black text-red-600 mt-2">
            {formatBRL(dados.financeiro.despesas)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-sm text-gray-500">Ponto de equilíbrio</p>
          <p className="text-3xl font-black text-blue-600 mt-2">
            {formatBRL(dados.financeiro.pontoEquilibrio)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-bold text-lg mb-4">Treinos recentes</h2>

        {dados.treinosRecentes.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum treino recente.</p>
        ) : (
          <div className="space-y-3">
            {dados.treinosRecentes.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between border rounded-xl px-4 py-3"
              >
                <span className="font-medium">{item.horario}</span>
                <span>{item.aluno}</span>
                <span className="text-gray-500">Treino {item.dia}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}