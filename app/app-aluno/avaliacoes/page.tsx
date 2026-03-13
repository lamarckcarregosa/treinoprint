"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number;
  altura?: number;
  percentual_gordura?: number;
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

export default function AvaliacoesAlunoPage() {
  const router = useRouter();

  const [lista, setLista] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetchAluno("/api/app-aluno/avaliacoes", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar avaliações");
          return;
        }

        setLista(Array.isArray(json) ? json : []);
      } catch {
        setErro("Erro ao carregar avaliações");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Minhas avaliações</h1>
            <p className="text-sm text-gray-500 mt-1">
              Histórico das avaliações físicas
            </p>
          </div>

          <button
            onClick={() => router.push("/app-aluno/evolucao")}
            className="bg-black text-white rounded-xl px-4 py-2"
          >
            Evolução
          </button>
        </div>
      </section>

      {erro ? (
        <div className="bg-white rounded-2xl shadow p-5">
          <p className="text-red-600">{erro}</p>
        </div>
      ) : null}

      <section className="space-y-3">
        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-gray-500">Nenhuma avaliação encontrada.</p>
          </div>
        ) : (
          lista.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow p-4">
              <p className="font-semibold text-gray-900">
                Avaliação em {formatData(item.data_avaliacao)}
              </p>
              <p className="text-sm text-gray-600">
                Peso: {item.peso || 0} kg
              </p>
              <p className="text-sm text-gray-600">
                Gordura: {item.percentual_gordura || 0}%
              </p>
              <p className="text-sm text-gray-600">
                IMC: {calcularIMC(item.peso, item.altura)}
              </p>

              <div className="mt-3">
                <button
                  onClick={() => router.push(`/app-aluno/avaliacoes/${item.id}`)}
                  className="bg-black text-white rounded-xl px-4 py-2"
                >
                  Ver detalhe
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}