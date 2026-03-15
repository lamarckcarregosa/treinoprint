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
  gateway?: string | null;
  gateway_status?: string | null;
  link_pagamento?: string | null;
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

function labelFormaPagamento(forma?: string | null) {
  const valor = String(forma || "").trim();

  const mapa: Record<string, string> = {
    pix: "Pix",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
    boleto: "Boleto",
    cartao_maquina: "Cartão máquina",
    pix_manual: "Pix manual",
    mercado_pago_pix: "Mercado Pago Pix",
    mercado_pago_cartao: "Mercado Pago Cartão",
    mercado_pago_boleto: "Mercado Pago Boleto",
  };

  return mapa[valor] || valor || "-";
}

function labelStatus(status?: string | null) {
  const valor = String(status || "").trim().toLowerCase();

  if (valor === "pago") return "Pago";
  if (valor === "pendente") return "Pendente";
  if (valor === "vencido") return "Vencido";

  return status || "-";
}

function corStatus(status?: string | null) {
  const valor = String(status || "").trim().toLowerCase();

  if (valor === "pago") {
    return "bg-green-100 text-green-700";
  }

  if (valor === "vencido") {
    return "bg-red-100 text-red-700";
  }

  return "bg-yellow-100 text-yellow-700";
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

  const mensalidadeAtual = useMemo(() => {
    return (
      lista.find((item) => item.status !== "pago") ||
      lista[0] ||
      null
    );
  }, [lista]);

  const abrirPagamento = (item: Pagamento) => {
    if (!item.link_pagamento) {
      alert("Link de pagamento ainda não disponível.");
      return;
    }

    window.open(item.link_pagamento, "_blank");
  };

  if (loading) return <p className="p-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-xl font-black text-gray-900">Meu financeiro</h1>
        <p className="text-sm text-gray-500 mt-1">
          Mensalidades pagas, pendentes e cobranças online
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

      {mensalidadeAtual ? (
        <section className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Mensalidade atual</p>
              <p className="text-lg font-black text-gray-900 mt-1">
                {mensalidadeAtual.competencia}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Vencimento: {formatData(mensalidadeAtual.vencimento)}
              </p>
              <p className="text-sm text-gray-600">
                Valor: {formatBRL(mensalidadeAtual.valor)}
              </p>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${corStatus(
                mensalidadeAtual.status
              )}`}
            >
              {labelStatus(mensalidadeAtual.status)}
            </span>
          </div>

          {mensalidadeAtual.status !== "pago" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {mensalidadeAtual.link_pagamento ? (
                <>
                  <button
                    onClick={() => abrirPagamento(mensalidadeAtual)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3 font-medium"
                  >
                    Pagar agora
                  </button>

                  <button
                    onClick={() => abrirPagamento(mensalidadeAtual)}
                    className="border rounded-xl px-4 py-3 font-medium"
                  >
                    Abrir link
                  </button>
                </>
              ) : (
                <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
                  Sua academia ainda não gerou uma cobrança online para esta mensalidade.
                </div>
              )}
            </div>
          ) : null}

          {mensalidadeAtual.gateway ? (
            <p className="text-xs text-violet-600 mt-4">
              Cobrança online: {mensalidadeAtual.gateway}
              {mensalidadeAtual.gateway_status
                ? ` • ${mensalidadeAtual.gateway_status}`
                : ""}
            </p>
          ) : null}
        </section>
      ) : null}

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
                    Status: {labelStatus(item.status)}
                  </p>

                  {item.forma_pagamento ? (
                    <p className="text-sm text-blue-600">
                      Forma: {labelFormaPagamento(item.forma_pagamento)}
                    </p>
                  ) : null}

                  {item.data_pagamento ? (
                    <p className="text-sm text-green-600">
                      Pago em: {formatData(item.data_pagamento)}
                    </p>
                  ) : null}

                  {item.gateway ? (
                    <p className="text-sm text-violet-600">
                      Cobrança online: {item.gateway}
                      {item.gateway_status ? ` • ${item.gateway_status}` : ""}
                    </p>
                  ) : null}
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${corStatus(
                    item.status
                  )}`}
                >
                  {labelStatus(item.status)}
                </span>
              </div>

              {item.status !== "pago" && item.link_pagamento ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => abrirPagamento(item)}
                    className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    Pagar agora
                  </button>

                  <button
                    onClick={() => abrirPagamento(item)}
                    className="border rounded-xl px-4 py-2 text-sm font-medium"
                  >
                    Abrir link
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </section>
    </div>
  );
}