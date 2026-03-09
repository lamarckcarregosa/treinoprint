"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";

type Pagamento = {
  id: number;
  aluno_nome: string;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  forma_pagamento?: string | null;
  status: string;
};

type Academia = {
  nome?: string;
  logo_url?: string;
  endereco?: string;
  cnpj?: string;
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

function formatBRL(valor: number | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

export default function ComprovanteCupomPage() {
  const params = useParams();
  const router = useRouter();

  const [pagamento, setPagamento] = useState<Pagamento | null>(null);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const id = String(params.id);

        const [resPagamento, resAcademia] = await Promise.all([
          apiFetch(`/api/financeiro/pagamentos/${id}`, { cache: "no-store" }),
          apiFetch("/api/minha-academia", { cache: "no-store" }),
        ]);

        const jsonPagamento = await resPagamento.json().catch(() => ({}));
        const jsonAcademia = await resAcademia.json().catch(() => ({}));

        if (!resPagamento.ok) {
          setErro(jsonPagamento.error || "Erro ao carregar comprovante");
          return;
        }

        if (!resAcademia.ok) {
          setErro(jsonAcademia.error || "Erro ao carregar academia");
          return;
        }

        setPagamento(jsonPagamento);
        setAcademia(jsonAcademia);
      } catch {
        setErro("Erro ao carregar comprovante");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [params.id]);

  const urlVerificacao =
    typeof window !== "undefined" && pagamento
      ? `${window.location.origin}/financeiro/comprovante/${pagamento.id}`
      : "";

  if (loading) return <p className="p-6">Carregando comprovante...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!pagamento) return <p className="p-6">Pagamento não encontrado.</p>;

  return (
    <>
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            overflow: visible !important;
          }

          body * {
            visibility: hidden !important;
          }

          .comprovante-print-root,
          .comprovante-print-root * {
            visibility: visible !important;
          }

          .comprovante-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            max-width: 80mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .cupom-box {
            width: 80mm !important;
            max-width: 80mm !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 flex justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="no-print flex justify-between mb-4">
           <button
  onClick={() => {
    window.close();
    setTimeout(() => {
      window.location.href = "/pagamentos";
    }, 300);
  }}
  className="px-4 py-2 rounded-lg border bg-white"
>
  Fechar
</button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              Imprimir
            </button>
          </div>

          <section className="comprovante-print-root">
            <div className="cupom-box bg-white border rounded-2xl shadow p-4 text-[13px] leading-5 font-mono">
              <div className="text-center">
                {academia?.logo_url ? (
                  <img
                    src={academia.logo_url}
                    alt="Logo da academia"
                    style={{
                      width: "70px",
                      margin: "0 auto 6px auto",
                      display: "block",
                    }}
                  />
                ) : null}

                <p className="font-bold text-lg">
                  {academia?.nome || "TREINOPRINT"}
                </p>

                {academia?.cnpj ? <p>CNPJ: {academia.cnpj}</p> : null}
                {academia?.endereco ? <p>{academia.endereco}</p> : null}

                <p>COMPROVANTE DE PAGAMENTO</p>
                <p>{new Date().toLocaleString("pt-BR")}</p>
              </div>

              <div className="border-t border-dashed my-3" />

              <div className="space-y-1">
                <div className="flex justify-between gap-3">
                  <span>ID:</span>
                  <span>{pagamento.id}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Aluno:</span>
                  <span className="text-right">{pagamento.aluno_nome}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Competência:</span>
                  <span>{pagamento.competencia}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Vencimento:</span>
                  <span>{formatData(pagamento.vencimento)}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Pagamento:</span>
                  <span>{formatData(pagamento.data_pagamento)}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Forma:</span>
                  <span className="uppercase">
                    {pagamento.forma_pagamento || "-"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span>Status:</span>
                  <span className="uppercase">{pagamento.status}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-3" />

              <div className="text-center">
                <p className="text-xs">VALOR RECEBIDO</p>
                <p className="text-2xl font-bold">{formatBRL(pagamento.valor)}</p>
              </div>

              <div className="border-t border-dashed my-3" />

              {urlVerificacao ? (
                <div className="flex justify-center my-4">
                  <QRCode value={urlVerificacao} size={90} />
                </div>
              ) : null}

              <div className="text-center text-xs space-y-1">
                <p>Guarde este comprovante.</p>
                <p>Emitido pelo sistema TreinoPrint.</p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}