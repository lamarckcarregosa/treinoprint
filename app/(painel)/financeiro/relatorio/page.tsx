"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type ResumoFinanceiro = {
  receitaMes: number;
  emAberto: number;
  despesasMes: number;
  inadimplencia: number;
  saldo: number;
  totalInadimplentes: number;
};

function formatBRL(valor: number | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function RelatorioPage() {
  const [dados, setDados] = useState<ResumoFinanceiro | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        const inicio = params.get("inicio");
        const fim = params.get("fim");

        if (!inicio || !fim) {
          setErro("Período não informado");
          return;
        }

        const res = await apiFetch(
          `/api/financeiro/resumo?inicio=${inicio}&fim=${fim}`,
          {
            cache: "no-store",
          }
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar relatório");
          return;
        }

        setDados(json as ResumoFinanceiro);
      } catch {
        setErro("Erro ao carregar relatório");
      }
    };

    carregar();
  }, []);

  if (erro) {
    return <p className="p-6 text-red-600">{erro}</p>;
  }

  if (!dados) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="p-10 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto border rounded-2xl p-8">
        <h1 className="text-3xl font-black mb-6 text-center">
          Relatório Financeiro
        </h1>

        <div className="space-y-3 text-base">
          <p>
            <strong>Receita do período:</strong> {formatBRL(dados.receitaMes)}
          </p>
          <p>
            <strong>Em aberto:</strong> {formatBRL(dados.emAberto)}
          </p>
          <p>
            <strong>Despesas:</strong> {formatBRL(dados.despesasMes)}
          </p>
          <p>
            <strong>Inadimplência:</strong> {formatBRL(dados.inadimplencia)}
          </p>
          <p>
            <strong>Saldo:</strong> {formatBRL(dados.saldo)}
          </p>
          <p>
            <strong>Total de inadimplentes:</strong>{" "}
            {dados.totalInadimplentes || 0}
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-8 w-full bg-black text-white px-6 py-3 rounded-xl"
        >
          Imprimir / Salvar PDF
        </button>
      </div>
    </main>
  );
}