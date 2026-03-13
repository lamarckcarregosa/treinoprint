"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Printer,
  User,
  CalendarDays,
  Scale,
  Ruler,
  HeartPulse,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  foto_url?: string | null;
};

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number;
  altura?: number;
  idade?: number;
  percentual_gordura?: number;
  massa_magra?: number;
  massa_gorda?: number;
  taxa_metabolica_basal?: number;
  agua_corporal?: number;
  gordura_visceral?: number;
  peito?: number;
  costas?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  gluteo?: number;
  braco_esquerdo?: number;
  braco_direito?: number;
  coxa_esquerda?: number;
  coxa_direita?: number;
  panturrilha_esquerda?: number;
  panturrilha_direita?: number;
  foto_frente?: string;
  foto_lado?: string;
  foto_costas?: string;
};

function formatData(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function calcularIMC(peso?: number, altura?: number) {
  if (!peso || !altura) return 0;
  return Number((peso / (altura * altura)).toFixed(2));
}

function classificarIMC(imc: number) {
  if (!imc) return "-";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function CardInfo({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-xl font-black text-gray-900 mt-1">{valor}</p>
      {subtitulo ? <p className="text-[11px] text-gray-400 mt-1">{subtitulo}</p> : null}
    </div>
  );
}

function LinhaMedida({
  nome,
  valor,
}: {
  nome: string;
  valor?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-black/5 px-4 py-3">
      <span className="text-sm text-gray-600">{nome}</span>
      <span className="font-semibold text-gray-900">{valor || 0}</span>
    </div>
  );
}

export default function AvaliacaoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const nomeAcademia =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_nome") || "Minha academia"
      : "Minha academia";

  const logoAcademia =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_logo") || ""
      : "";

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        const resAval = await apiFetch(`/api/avaliacoes/${id}`, {
          cache: "no-store",
        });
        const jsonAval = await resAval.json().catch(() => ({}));

        if (!resAval.ok) {
          setErro((jsonAval as any).error || "Erro ao carregar avaliação");
          return;
        }

        setAvaliacao(jsonAval);

        const resAluno = await apiFetch(`/api/alunos/${jsonAval.aluno_id}`, {
          cache: "no-store",
        });
        const jsonAluno = await resAluno.json().catch(() => ({}));

        if (resAluno.ok) {
          setAluno(jsonAluno);
        }
      } catch {
        setErro("Erro ao carregar avaliação");
      } finally {
        setLoading(false);
      }
    };

    if (id) carregar();
  }, [id]);

  const imc = useMemo(
    () => calcularIMC(avaliacao?.peso, avaliacao?.altura),
    [avaliacao]
  );

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando avaliação..."
      />
    );
  }

  if (erro || !avaliacao) {
    return (
      <SystemError
        titulo="Erro ao carregar avaliação"
        mensagem={erro || "Não foi possível carregar a avaliação."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <main className="space-y-6 print:p-0">
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }

          .no-print {
            display: none !important;
          }

          .print-card {
            box-shadow: none !important;
            border-color: #d1d5db !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>

      <section className="no-print rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Detalhe da avaliação
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Visualização completa da avaliação física do aluno.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>
      </section>

      <div className="no-print flex flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 bg-white border border-black/10 rounded-xl px-4 py-3"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-black text-white rounded-xl px-4 py-3"
        >
          <Printer size={16} />
          Imprimir / Salvar PDF
        </button>
      </div>

      <section className="print-card bg-white rounded-3xl shadow p-6 md:p-8 border border-black/5 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b pb-6">
          <div className="flex items-center gap-4">
            {logoAcademia ? (
              <img
                src={logoAcademia}
                alt="Logo academia"
                className="w-20 h-20 object-contain rounded-2xl border p-2 bg-white"
              />
            ) : (
              <img
                src="/logo-sistema.png"
                alt="Logo sistema"
                className="w-20 h-20 object-contain rounded-2xl border p-2 bg-white"
              />
            )}

            <div>
              <p className="text-sm text-gray-500">Relatório de avaliação física</p>
              <h2 className="text-2xl font-black text-gray-900">{nomeAcademia}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Data da avaliação: {formatData(avaliacao.data_avaliacao)}
              </p>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-gray-500">Documento gerado por</p>
            <p className="font-semibold text-gray-900">TreinoPrint</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-6">
          <section className="space-y-6">
            <div className="rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={18} />
                <h3 className="font-bold text-lg">Dados do aluno</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Nome</p>
                  <p className="font-semibold text-gray-900">
                    {aluno?.nome || `Aluno #${avaliacao.aluno_id}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Telefone</p>
                  <p className="font-semibold text-gray-900">
                    {aluno?.telefone || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">CPF</p>
                  <p className="font-semibold text-gray-900">
                    {aluno?.cpf || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Data da avaliação</p>
                  <p className="font-semibold text-gray-900">
                    {formatData(avaliacao.data_avaliacao)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <HeartPulse size={18} />
                <h3 className="font-bold text-lg">Indicadores corporais</h3>
              </div>

             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <CardInfo titulo="Peso" valor={`${avaliacao.peso || 0} kg`} />
  <CardInfo titulo="Altura" valor={`${avaliacao.altura || 0} m`} />
  <CardInfo titulo="IMC" valor={imc || 0} subtitulo={classificarIMC(imc)} />
  <CardInfo titulo="% Gordura" valor={avaliacao.percentual_gordura || 0} />
  <CardInfo titulo="Massa magra" valor={`${avaliacao.massa_magra || 0} kg`} />
  <CardInfo titulo="Massa gorda" valor={`${avaliacao.massa_gorda || 0} kg`} />
  <CardInfo titulo="TMB" valor={avaliacao.taxa_metabolica_basal || 0} />
  <CardInfo titulo="% Água corporal" valor={avaliacao.agua_corporal || 0} />
</div>
            </div>

            <div className="rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Ruler size={18} />
                <h3 className="font-bold text-lg">Medidas corporais</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
  <LinhaMedida nome="Peito" valor={avaliacao.peito} />
  <LinhaMedida nome="Costas" valor={avaliacao.costas} />
  <LinhaMedida nome="Cintura" valor={avaliacao.cintura} />
  <LinhaMedida nome="Abdômen" valor={avaliacao.abdomen} />
  <LinhaMedida nome="Quadril" valor={avaliacao.quadril} />
  <LinhaMedida nome="Glúteo" valor={avaliacao.gluteo} />
  <LinhaMedida nome="Braço esquerdo" valor={avaliacao.braco_esquerdo} />
  <LinhaMedida nome="Braço direito" valor={avaliacao.braco_direito} />
  <LinhaMedida nome="Coxa esquerda" valor={avaliacao.coxa_esquerda} />
  <LinhaMedida nome="Coxa direita" valor={avaliacao.coxa_direita} />
  <LinhaMedida nome="Panturrilha esquerda" valor={avaliacao.panturrilha_esquerda} />
  <LinhaMedida nome="Panturrilha direita" valor={avaliacao.panturrilha_direita} />
</div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} />
                <h3 className="font-bold text-lg">Resumo</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Avaliação</span>
                  <span className="font-semibold text-gray-900">#{avaliacao.id}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Aluno ID</span>
                  <span className="font-semibold text-gray-900">{avaliacao.aluno_id}</span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Data</span>
                  <span className="font-semibold text-gray-900">
                    {formatData(avaliacao.data_avaliacao)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-gray-500">Classificação IMC</span>
                  <span className="font-semibold text-gray-900">
                    {classificarIMC(imc)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Scale size={18} />
                <h3 className="font-bold text-lg">Fotos</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Frente</p>
                  {avaliacao.foto_frente ? (
                    <img
                      src={avaliacao.foto_frente}
                      alt="Foto frente"
                      className="w-full h-60 object-cover rounded-2xl border"
                    />
                  ) : (
                    <div className="w-full h-60 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                      Sem foto
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Lado</p>
                  {avaliacao.foto_lado ? (
                    <img
                      src={avaliacao.foto_lado}
                      alt="Foto lado"
                      className="w-full h-60 object-cover rounded-2xl border"
                    />
                  ) : (
                    <div className="w-full h-60 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                      Sem foto
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Costas</p>
                  {avaliacao.foto_costas ? (
                    <img
                      src={avaliacao.foto_costas}
                      alt="Foto costas"
                      className="w-full h-60 object-cover rounded-2xl border"
                    />
                  ) : (
                    <div className="w-full h-60 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                      Sem foto
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="border-t pt-5 text-xs text-gray-400 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <p>TreinoPrint • Relatório de avaliação física</p>
          <p>Emitido em {new Date().toLocaleString("pt-BR")}</p>
        </div>
      </section>
    </main>
  );
}