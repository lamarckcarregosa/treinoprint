"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  Building2,
  Users,
  UserCog,
  Dumbbell,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ProtegePagina from "@/components/ProtegePagina";

type AcademiaPlano = {
  plano: string;
  total: number;
};

type AcademiaRecente = {
  id: string;
  nome: string;
  plano?: string | null;
  ativa?: boolean;
  created_at?: string | null;
  telefone?: string | null;
  email?: string | null;
};

type DashboardSuperadminData = {
  totalAcademias: number;
  academiasAtivas: number;
  academiasInativas: number;
  totalAlunos: number;
  totalUsuarios: number;
  totalPersonais: number;
  academiasPorPlano: AcademiaPlano[];
  academiasRecentes: AcademiaRecente[];
};

function CardInfo({
  title,
  value,
  icon,
  valueClassName = "",
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  valueClassName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-black/5 shadow-sm p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <p className={`text-3xl font-black mt-2 ${valueClassName}`}>{value}</p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function SuperadminDashboardContent() {
  const router = useRouter();

  const [dados, setDados] = useState<DashboardSuperadminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/superadmin/dashboard", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro(json.error || "Erro ao carregar dashboard superadmin");
          return;
        }

        setDados(json);
      } catch {
        setErro("Erro ao carregar dashboard superadmin");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const pieData = useMemo(() => dados?.academiasPorPlano || [], [dados]);
  const pieColors = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D4D4D8"];

  if (loading) {
    return <p className="p-6">Carregando dashboard superadmin...</p>;
  }

  if (erro || !dados) {
    return <p className="p-6 text-red-600">{erro || "Erro ao carregar dashboard superadmin"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8">
        <p className="text-sm text-zinc-300">Painel global</p>
        <h1 className="text-3xl md:text-4xl font-black mt-2">
          Dashboard Superadmin
        </h1>
        <p className="text-zinc-300 mt-3">
          Visão geral de todas as academias cadastradas no sistema.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-black/5 shadow-sm p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h2 className="font-bold text-lg">Atalhos Superadmin</h2>
            <p className="text-sm text-zinc-500">
              Acesse rapidamente as áreas administrativas do sistema.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
          <button
            onClick={() => router.push("/superadmin/academias")}
            className="text-left rounded-2xl border border-black/5 bg-zinc-50 px-4 py-4 hover:bg-zinc-100 transition"
          >
            <p className="font-semibold text-zinc-900">Criar academia</p>
            <p className="text-sm text-zinc-500 mt-1">
              Cadastrar nova academia, admin e dados iniciais
            </p>
          </button>

          <button
            onClick={() => router.push("/superadmin/academias/lista")}
            className="text-left rounded-2xl border border-black/5 bg-zinc-50 px-4 py-4 hover:bg-zinc-100 transition"
          >
            <p className="font-semibold text-zinc-900">Lista de academias</p>
            <p className="text-sm text-zinc-500 mt-1">
              Visualizar, pesquisar e editar academias cadastradas
            </p>
          </button>

          <button
            onClick={() => router.push("/superadmin/selecionar-academia")}
            className="text-left rounded-2xl border border-black/5 bg-zinc-50 px-4 py-4 hover:bg-zinc-100 transition"
          >
            <p className="font-semibold text-zinc-900">Selecionar academia</p>
            <p className="text-sm text-zinc-500 mt-1">
              Entrar no painel de uma academia específica
            </p>
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <CardInfo
          title="Total de academias"
          value={dados.totalAcademias}
          icon={<Building2 size={22} />}
        />
        <CardInfo
          title="Academias ativas"
          value={dados.academiasAtivas}
          icon={<CheckCircle2 size={22} />}
          valueClassName="text-green-600"
        />
        <CardInfo
          title="Academias inativas"
          value={dados.academiasInativas}
          icon={<XCircle size={22} />}
          valueClassName="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <CardInfo
          title="Total de alunos"
          value={dados.totalAlunos}
          icon={<Users size={22} />}
        />
        <CardInfo
          title="Total de usuários"
          value={dados.totalUsuarios}
          icon={<UserCog size={22} />}
        />
        <CardInfo
          title="Total de personais"
          value={dados.totalPersonais}
          icon={<Dumbbell size={22} />}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-black/5 shadow-sm p-5"
        >
          <h2 className="font-bold text-lg mb-4">Academias por plano</h2>
          <div className="h-72">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-zinc-500">
                Sem dados de plano.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={pieData} dataKey="total" nameKey="plano" outerRadius={100} label>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-black/5 shadow-sm p-5"
        >
          <h2 className="font-bold text-lg mb-4">Distribuição de planos</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados.academiasPorPlano}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plano" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="total" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-black/5 shadow-sm p-5"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">Academias recentes</h2>

          <button
            onClick={() => router.push("/superadmin/academias/lista")}
            className="bg-black text-white px-4 py-2 rounded-xl"
          >
            Ver todas
          </button>
        </div>

        {dados.academiasRecentes.length === 0 ? (
          <p className="text-zinc-500">Nenhuma academia cadastrada.</p>
        ) : (
          <div className="space-y-3">
            {dados.academiasRecentes.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-black/5 bg-zinc-50 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold text-zinc-900">{item.nome}</p>
                  <p className="text-sm text-zinc-500">
                    Plano: {item.plano || "-"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {item.telefone || "-"} {item.email ? `• ${item.email}` : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.ativa
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.ativa ? "Ativa" : "Inativa"}
                  </span>

                  <button
                    onClick={() => router.push(`/superadmin/academias/editar/${item.id}`)}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-xl"
                  >
                    Abrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function SuperadminDashboardPage() {
  return (
    <ProtegePagina permissao="superadmin">
      <SuperadminDashboardContent />
    </ProtegePagina>
  );
}