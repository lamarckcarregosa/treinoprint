"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { apiFetch } from "@/lib/apiFetch";

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

type Academia = {
  id: string;
  nome?: string;
  logo_url?: string;
  telefone?: string;
  cnpj?: string;
};

function formatData(data?: string | null) {
  if (!data) return "-";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const dt = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);

  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function limitarTexto(texto?: string, max = 26) {
  if (!texto) return "-";
  return texto.length > max ? `${texto.slice(0, max)}...` : texto;
}

export default function CarteirinhaAlunoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [imprimindo, setImprimindo] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");

      const [resAluno, resAcademia] = await Promise.all([
        apiFetch(`/api/alunos/${id}`, { cache: "no-store" }),
        apiFetch("/api/minha-academia", { cache: "no-store" }),
      ]);

      const jsonAluno = await resAluno.json().catch(() => ({}));
      const jsonAcademia = await resAcademia.json().catch(() => ({}));

      if (!resAluno.ok) {
        setErro((jsonAluno as any).error || "Erro ao carregar aluno");
        return;
      }

      if (!resAcademia.ok) {
        setErro((jsonAcademia as any).error || "Erro ao carregar academia");
        return;
      }

      setAluno(jsonAluno as Aluno);
      setAcademia(jsonAcademia as Academia);
    } catch {
      setErro("Erro ao carregar carteirinha");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  const imprimir = async () => {
    try {
      setImprimindo(true);

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const imagens = Array.from(document.images);

      await Promise.all(
        imagens.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(true);
          });
        })
      );

      await new Promise((resolve) => setTimeout(resolve, 500));

      window.print();
    } finally {
      setTimeout(() => setImprimindo(false), 300);
    }
  };

  if (loading) return <p className="p-6">Carregando carteirinha...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!aluno) return <p className="p-6">Aluno não encontrado.</p>;

  const qrValue =
    typeof window !== "undefined"
      ? `${window.location.origin}/alunos/${aluno.id}`
      : `aluno-${aluno.id}`;

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <style jsx global>{`
        @page {
          size: 86mm 54mm;
          margin: 0;
        }

        @media print {
          html,
          body {
            width: 86mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden;
          }

          .print-area,
          .print-area * {
            visibility: visible;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 86mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .card-print {
            width: 86mm !important;
            height: 54mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: 1px solid #ddd !important;
            overflow: hidden !important;
            page-break-after: always;
            break-after: page;
          }

          .card-print:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>

      <div className="w-full max-w-md">
        <div className="no-print flex justify-between mb-4 gap-3">
          <button
            onClick={() => router.push(`/alunos/${id}`)}
            className="px-4 py-2 rounded-lg border bg-white"
          >
            Voltar
          </button>

          <button
            onClick={imprimir}
            disabled={imprimindo}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-60"
          >
            {imprimindo ? "Preparando..." : "Imprimir"}
          </button>
        </div>

        <div className="print-area">
          <section className="card-print bg-white w-[325px] h-[204px] rounded-2xl shadow-lg overflow-hidden border mx-auto">
            <div className="bg-black text-white px-3 py-2 flex items-center gap-2 h-[52px]">
              {academia?.logo_url ? (
                <img
                  src={academia.logo_url}
                  alt="Logo da academia"
                  className="h-9 w-9 object-contain rounded-md bg-white p-1 shrink-0"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-white/20 shrink-0" />
              )}

              <div className="min-w-0">
                <p className="font-black text-sm leading-tight truncate">
                  {academia?.nome || "Academia"}
                </p>
                <p className="text-[10px] opacity-80 leading-tight">
                  Carteirinha do aluno
                </p>
              </div>
            </div>

            <div className="p-3 flex gap-3 h-[152px]">
              <div className="w-[76px] shrink-0">
                {aluno.foto_url ? (
                  <img
                    src={aluno.foto_url}
                    alt={aluno.nome}
                    className="w-[76px] h-[96px] rounded-xl object-cover border"
                  />
                ) : (
                  <div className="w-[76px] h-[96px] rounded-xl bg-gray-100 border flex items-center justify-center text-[10px] text-gray-500 text-center">
                    Sem foto
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="min-w-0">
                  <h1 className="font-black text-[15px] leading-tight text-gray-900 break-words">
                    {limitarTexto(aluno.nome, 32)}
                  </h1>

                  <div className="mt-2 space-y-1 text-[11px] text-gray-700 leading-tight">
                    <p className="truncate">
                      <strong>Plano:</strong> {aluno.plano || "-"}
                    </p>
                    <p className="truncate">
                      <strong>Status:</strong> {aluno.status || "-"}
                    </p>
                    <p className="truncate">
                      <strong>Matrícula:</strong> {formatData(aluno.data_matricula)}
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 leading-tight space-y-0.5">
                  <p className="truncate">
                    <strong>ID:</strong> {aluno.id}
                  </p>
                  <p className="truncate">
                    <strong>CPF:</strong> {aluno.cpf || "-"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="card-print bg-white w-[325px] h-[204px] rounded-2xl shadow-lg overflow-hidden border mt-4 mx-auto">
            <div className="h-full p-3 flex gap-3">
              <div className="w-[98px] shrink-0 flex flex-col items-center justify-center">
                <div className="bg-white p-1.5 rounded-xl border">
                  <QRCode value={qrValue} size={82} />
                </div>

                <p className="text-[10px] text-gray-500 mt-2 text-center leading-tight">
                  Apresente este QR Code
                  <br />
                  na recepção
                </p>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-[11px] text-gray-900">
                    Dados do aluno
                  </p>

                  <div className="mt-2 space-y-1 text-[10px] text-gray-700 leading-tight">
                    <p className="truncate">
                      <strong>Telefone:</strong> {aluno.telefone || "-"}
                    </p>
                    <p className="truncate">
                      <strong>Nascimento:</strong> {formatData(aluno.data_nascimento)}
                    </p>
                    <p className="break-words">
                      <strong>Endereço:</strong> {limitarTexto(aluno.endereco, 42)}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-2 text-[10px] text-gray-500 leading-tight">
                  <p className="truncate">{academia?.nome || "Academia"}</p>
                  {academia?.telefone ? <p>Tel: {academia.telefone}</p> : null}
                  {academia?.cnpj ? <p>CNPJ: {academia.cnpj}</p> : null}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}