"use client";

import { useEffect, useState } from "react";

type Resumo = {
  receitaMes: number;
  emAberto: number;
  despesasMes: number;
  inadimplencia: number;
  saldo: number;
  totalInadimplentes: number;
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

export default function RelatorioFinanceiroPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    const carregar = async () => {
      const params = new URLSearchParams(window.location.search);
      const inicio = params.get("inicio");
      const fim = params.get("fim");

      const res = await apiFetch(
        `/api/financeiro/resumo?inicio=${inicio}&fim=${fim}`,
        { cache: "no-store" }
      );
      const json = await res.json();
      setResumo(json);
    };

    carregar();
  }, []);

  if (!resumo) return <p>Carregando...</p>;

  return (
    <main className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-black">Relatório Financeiro</h1>
      <div className="mt-6 space-y-3">
        <p>Receita: {formatBRL(resumo.receitaMes)}</p>
        <p>Em aberto: {formatBRL(resumo.emAberto)}</p>
        <p>Despesas: {formatBRL(resumo.despesasMes)}</p>
        <p>Inadimplência: {formatBRL(resumo.inadimplencia)}</p>
        <p>Saldo: {formatBRL(resumo.saldo)}</p>
      </div>

      <button
        onClick={() => window.print()}
        className="mt-6 bg-black text-white px-5 py-3 rounded-xl"
      >
        Imprimir / Salvar PDF
      </button>
    </main>
  );
}