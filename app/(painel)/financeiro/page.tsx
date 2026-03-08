"use client";

import { useEffect, useState } from "react";

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

export default function FinanceiroPage() {
  const [receitaMes, setReceitaMes] = useState("0");
  const [despesas, setDespesas] = useState("0");
  const [pontoEquilibrio, setPontoEquilibrio] = useState("0");
  const [observacoes, setObservacoes] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregarFinanceiro = async () => {
    try {
      setErro("");
      setSucesso("");

      const res = await apiFetch("/api/financeiro", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar financeiro");
        return;
      }

      setReceitaMes(String(json.receita_mes ?? 0));
      setDespesas(String(json.despesas ?? 0));
      setPontoEquilibrio(String(json.ponto_equilibrio ?? 0));
      setObservacoes(json.observacoes || "");
    } catch {
      setErro("Erro ao carregar financeiro");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarFinanceiro();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const salvar = async () => {
    try {
      setErro("");
      setSucesso("");
      setSalvando(true);

      const res = await apiFetch("/api/financeiro", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receita_mes: Number(receitaMes || 0),
          despesas: Number(despesas || 0),
          ponto_equilibrio: Number(pontoEquilibrio || 0),
          observacoes,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErro(json.error || "Erro ao salvar financeiro");
        return;
      }

      setSucesso("Financeiro salvo com sucesso");
    } catch {
      setErro("Erro ao salvar financeiro");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando financeiro...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Financeiro</h1>
        <p className="text-gray-500 mt-2">
          Ajuste os valores exibidos na dashboard
        </p>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Receita do mês
            </label>
            <input
              type="number"
              step="0.01"
              value={receitaMes}
              onChange={(e) => setReceitaMes(e.target.value)}
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Despesas
            </label>
            <input
              type="number"
              step="0.01"
              value={despesas}
              onChange={(e) => setDespesas(e.target.value)}
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Ponto de equilíbrio
            </label>
            <input
              type="number"
              step="0.01"
              value={pontoEquilibrio}
              onChange={(e) => setPontoEquilibrio(e.target.value)}
              className="w-full border rounded-xl p-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full border rounded-xl p-3 min-h-28"
            placeholder="Observações internas"
          />
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
        {sucesso ? <p className="text-sm text-green-600">{sucesso}</p> : null}

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar financeiro"}
        </button>
      </section>
    </div>
  );
}