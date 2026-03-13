"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Pagamento = {
  id: number;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status: string;
  forma_pagamento?: string | null;
};

function formatBRL(valor: number | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(data?: string | null) {
  if (!data) return "-";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const dt = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);

  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

export default function FinanceiroAlunoPage() {
  const [lista, setLista] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetchAluno("/api/app-aluno/financeiro", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar financeiro");
          return;
        }

        setLista(Array.isArray(json) ? json : []);
      } catch {
        setErro("Erro ao carregar financeiro");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const totalPago = useMemo(
    () =>
      lista
        .filter((p) => p.status === "pago")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [lista]
  );

  const totalPendente = useMemo(
    () =>
      lista
        .filter((p) => p.status !== "pago")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [lista]
  );

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-xl font-black text-gray-900">Meu financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mensalidades pagas e pendentes
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Total pago</p>
          <p className="text-lg font-black text-green-600 mt-1">
            {formatBRL(totalPago)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-4">
          <p className="text-xs text-gray-500">Em aberto</p>
          <p className="text-lg font-black text-yellow-600 mt-1">
            {formatBRL(totalPendente)}
          </p>
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
            <p className="text-gray-500">Nenhuma mensalidade encontrada.</p>
          </div>
        ) : (
          lista.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    Competência: {item.competencia}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vencimento: {formatData(item.vencimento)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor: {formatBRL(item.valor)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status: {item.status}
                  </p>

                  {item.forma_pagamento ? (
                    <p className="text-sm text-blue-600">
                      Forma: {item.forma_pagamento}
                    </p>
                  ) : null}

                  {item.data_pagamento ? (
                    <p className="text-sm text-green-600">
                      Pago em: {formatData(item.data_pagamento)}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "pago"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}