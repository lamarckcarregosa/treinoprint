"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchAluno } from "@/lib/apiFetchAluno";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number;
  altura?: number;
  percentual_gordura?: number;
};

type Aluno = {
  id: number;
  nome: string;
  objetivo?: string | null;
  peso_meta?: number | null;
};

function formatData(data?: string) {
  if (!data) return "-";
  const dt = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function calcularIMC(peso?: number, altura?: number) {
  if (!peso || !altura) return 0;
  return Number((peso / (altura * altura)).toFixed(2));
}

export default function EvolucaoAlunoPage() {
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const resAluno = await apiFetchAluno("/api/app-aluno/me", {
          cache: "no-store",
        });
        const jsonAluno = await resAluno.json().catch(() => ({}));

        if (!resAluno.ok) {
          setErro((jsonAluno as any).error || "Erro ao carregar aluno");
          return;
        }

        setAluno(jsonAluno as Aluno);

        const resAval = await apiFetchAluno("/api/app-aluno/avaliacoes", {
          cache: "no-store",
        });
        const jsonAval = await resAval.json().catch(() => []);

        if (!resAval.ok) {
          setErro((jsonAval as any).error || "Erro ao carregar evolução");
          return;
        }

        setLista(Array.isArray(jsonAval) ? jsonAval : []);
      } catch {
        setErro("Erro ao carregar evolução");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const grafico = useMemo(
    () =>
      [...lista]
        .sort((a, b) =>
          String(a.data_avaliacao || "").localeCompare(String(b.data_avaliacao || ""))
        )
        .map((a) => ({
          data: formatData(a.data_avaliacao),
          peso: Number(a.peso || 0),
          gordura: Number(a.percentual_gordura || 0),
          imc: calcularIMC(a.peso, a.altura),
        })),
    [lista]
  );

  const ultima = [...lista].sort((a, b) =>
    String(b.data_avaliacao || "").localeCompare(String(a.data_avaliacao || ""))
  )[0];

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/app-aluno/avaliacoes")}
        className="border rounded-xl px-4 py-3"
      >
        Voltar
      </button>

      <section className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-xl font-black text-gray-900">Minha evolução</h1>
        <p className="text-sm text-gray-500 mt-1">
          Acompanhe sua evolução corporal
        </p>
      </section>

      {erro ? (
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-red-600">{erro}</p>
        </div>
      ) : null}

      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Objetivo</p>
          <p className="text-lg font-black text-gray-900 mt-1">
            {aluno?.objetivo || "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Peso meta</p>
          <p className="text-lg font-black text-gray-900 mt-1">
            {aluno?.peso_meta ? `${aluno.peso_meta} kg` : "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Último peso</p>
          <p className="text-lg font-black text-gray-900 mt-1">
            {ultima?.peso ? `${ultima.peso} kg` : "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Última gordura</p>
          <p className="text-lg font-black text-gray-900 mt-1">
            {ultima?.percentual_gordura ? `${ultima.percentual_gordura}%` : "-"}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-5">
        <h2 className="font-bold text-gray-900 mb-4">Gráfico de evolução</h2>

        {grafico.length === 0 ? (
          <p className="text-gray-500">Sem avaliações para gerar gráfico.</p>
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="peso" stroke="#2563eb" strokeWidth={3} />
                <Line dataKey="gordura" stroke="#dc2626" strokeWidth={3} />
                <Line dataKey="imc" stroke="#16a34a" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}