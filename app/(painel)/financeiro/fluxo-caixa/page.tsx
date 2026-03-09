"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Movimento = {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string;
  saldo_acumulado: number;
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

export default function FluxoCaixaPage() {
  const router = useRouter();
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [lista, setLista] = useState<Movimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      const res = await apiFetch(`/api/financeiro/fluxo-caixa?competencia=${competencia}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => []);
      if (!res.ok) {
        setErro(json.error || "Erro ao carregar fluxo de caixa");
        return;
      }
      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar fluxo de caixa");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregar();
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [competencia]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Fluxo de caixa</h1>
          <p className="text-gray-500 mt-2">Entradas, saídas e saldo acumulado</p>
        </div>

        <div className="flex gap-3">
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />

          <button
            onClick={() => router.push("/financeiro")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>
        </div>
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6">
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : lista.length === 0 ? (
          <p className="text-gray-500">Nenhum movimento encontrado.</p>
        ) : (
          <div className="space-y-3">
            {lista.map((item, index) => (
              <div
                key={index}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-bold">{item.descricao}</p>
                  <p className="text-sm text-gray-500">{item.data}</p>
                </div>

                <div className="text-right">
                  <p className={item.tipo === "entrada" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {item.tipo === "entrada" ? "+" : "-"} {formatBRL(item.valor)}
                  </p>
                  <p className="text-sm text-gray-500">
                    Saldo: {formatBRL(item.saldo_acumulado)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}