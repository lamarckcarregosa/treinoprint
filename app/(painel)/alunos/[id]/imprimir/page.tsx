"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  data_nascimento?: string;
  plano?: string;
  data_matricula?: string;
  status?: string;
  foto_url?: string;
};

type Pagamento = {
  id: number;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status: string;
  forma_pagamento?: string | null;
};

type Impressao = {
  id: number;
  dia?: string;
  nivel?: string;
  personal_nome?: string;
  created_at: string;
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

export default function ImprimirFichaAlunoPage() {
  const params = useParams();
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [impressoes, setImpressoes] = useState<Impressao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const id = String(params.id);

        const [resAluno, resPagamentos, resImpressoes] = await Promise.all([
          apiFetch(`/api/alunos/${id}`, { cache: "no-store" }),
          apiFetch(`/api/alunos/${id}/pagamentos`, { cache: "no-store" }),
          apiFetch(`/api/alunos/${id}/impressoes`, { cache: "no-store" }),
        ]);

        const jsonAluno = await resAluno.json().catch(() => ({}));
        const jsonPagamentos = await resPagamentos.json().catch(() => []);
        const jsonImpressoes = await resImpressoes.json().catch(() => []);

        if (!resAluno.ok) {
          setErro(jsonAluno.error || "Erro ao carregar aluno");
          return;
        }

        if (!resPagamentos.ok) {
          setErro(jsonPagamentos.error || "Erro ao carregar pagamentos");
          return;
        }

        if (!resImpressoes.ok) {
          setErro(jsonImpressoes.error || "Erro ao carregar impressões");
          return;
        }

        setAluno(jsonAluno);
        setPagamentos(Array.isArray(jsonPagamentos) ? jsonPagamentos : []);
        setImpressoes(Array.isArray(jsonImpressoes) ? jsonImpressoes : []);
      } catch {
        setErro("Erro ao carregar ficha para impressão");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [params.id]);

  useEffect(() => {
    if (!loading && aluno) {
      const timer = setTimeout(() => {
        window.print();
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [loading, aluno]);

  if (loading) return <p className="p-6">Carregando ficha...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!aluno) return <p className="p-6">Aluno não encontrado.</p>;

  const totalPago = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalEmAberto = pagamentos
    .filter((p) => p.status === "pendente")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  return (
    <>
      <style jsx global>{`
        @page {
          size: A4;
          margin: 10mm;
        }

        /* tela */
        .ficha-print-root {
          background: #ffffff;
          min-height: 100vh;
          color: #000000;
        }

        /* impressão */
        @media print {
          html,
          body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /*
            Isso derrota regras globais do cupom do tipo:
            body * { visibility:hidden }
          */
          body * {
            visibility: hidden !important;
          }

          .ficha-print-root,
          .ficha-print-root * {
            visibility: visible !important;
          }

          .ficha-print-root {
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
          }

          .ficha-print-hide {
            display: none !important;
          }

          .ficha-print-card {
            box-shadow: none !important;
            border: 1px solid #d4d4d4 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <main className="ficha-print-root p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="ficha-print-hide flex justify-between">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg border"
            >
              Voltar
            </button>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              Imprimir novamente
            </button>
          </div>

          <section className="ficha-print-card rounded-2xl p-6">
            <div className="flex items-start gap-6">
              {aluno.foto_url ? (
                <img
                  src={aluno.foto_url}
                  alt={aluno.nome}
                  className="w-28 h-28 rounded-full object-cover border"
                />
              ) : (
                <div className="w-28 h-28 rounded-full border bg-gray-100 flex items-center justify-center text-gray-500">
                  Sem foto
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm flex-1">
                <p><strong>Nome:</strong> {aluno.nome}</p>
                <p><strong>Telefone:</strong> {aluno.telefone || "-"}</p>
                <p><strong>CPF:</strong> {aluno.cpf || "-"}</p>
                <p><strong>Plano:</strong> {aluno.plano || "-"}</p>
                <p><strong>Status:</strong> {aluno.status || "-"}</p>
                <p><strong>Nascimento:</strong> {formatData(aluno.data_nascimento)}</p>
                <p><strong>Matrícula:</strong> {formatData(aluno.data_matricula)}</p>
                <p><strong>Endereço:</strong> {aluno.endereco || "-"}</p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-4">
            <div className="ficha-print-card rounded-2xl p-4">
              <p className="text-sm text-gray-500">Total pago</p>
              <p className="text-xl font-bold">{formatBRL(totalPago)}</p>
            </div>

            <div className="ficha-print-card rounded-2xl p-4">
              <p className="text-sm text-gray-500">Em aberto</p>
              <p className="text-xl font-bold">{formatBRL(totalEmAberto)}</p>
            </div>

            <div className="ficha-print-card rounded-2xl p-4">
              <p className="text-sm text-gray-500">Treinos impressos</p>
              <p className="text-xl font-bold">{impressoes.length}</p>
            </div>
          </section>

          <section className="ficha-print-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">Histórico financeiro</h2>

            {pagamentos.length === 0 ? (
              <p>Nenhuma mensalidade encontrada.</p>
            ) : (
              <div className="space-y-2">
                {pagamentos.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-3 flex justify-between gap-4"
                  >
                    <div>
                      <p><strong>Competência:</strong> {item.competencia}</p>
                      <p><strong>Vencimento:</strong> {formatData(item.vencimento)}</p>
                      <p><strong>Status:</strong> {item.status}</p>
                      <p><strong>Forma:</strong> {item.forma_pagamento || "-"}</p>
                    </div>

                    <div className="text-right">
                      <p><strong>{formatBRL(item.valor)}</strong></p>
                      <p>{formatData(item.data_pagamento)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ficha-print-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">Treinos impressos recentes</h2>

            {impressoes.length === 0 ? (
              <p>Nenhum treino impresso encontrado.</p>
            ) : (
              <div className="space-y-2">
                {impressoes.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-xl p-3 flex justify-between gap-4"
                  >
                    <div>
                      <p><strong>Treino:</strong> {item.dia || "-"}</p>
                      <p><strong>Nível:</strong> {item.nivel || "-"}</p>
                      <p><strong>Personal:</strong> {item.personal_nome || "-"}</p>
                    </div>

                    <div>
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}