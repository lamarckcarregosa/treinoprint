"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Camera,
  ChartColumnBig,
  Printer,
  Scale,
  Ruler,
  TrendingUp,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import MapaCorporal from "@/components/MapaCorporal";
import { apiFetch } from "@/lib/apiFetch";

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number | null;
  altura?: number | null;
  idade?: number | null;
  percentual_gordura?: number | null;
  massa_magra?: number | null;
  massa_gorda?: number | null;
  taxa_metabolica_basal?: number | null;
  agua_corporal?: number | null;
  gordura_visceral?: number | null;

  peito?: number | null;
  costas?: number | null;
  cintura?: number | null;
  abdomen?: number | null;
  quadril?: number | null;
  gluteo?: number | null;

  braco_esquerdo?: number | null;
  braco_direito?: number | null;

  biceps_esquerdo?: number | null;
  biceps_direito?: number | null;
  triceps_esquerdo?: number | null;
  triceps_direito?: number | null;
  antebraco_esquerdo?: number | null;
  antebraco_direito?: number | null;
  pulso_esquerdo?: number | null;
  pulso_direito?: number | null;

  coxa_esquerda?: number | null;
  coxa_direita?: number | null;
  panturrilha_esquerda?: number | null;
  panturrilha_direita?: number | null;

  foto_frente?: string | null;
  foto_lado?: string | null;
  foto_costas?: string | null;
  objetivo?: string | null;
  created_at?: string | null;
};

type Aluno = {
  id: number;
  nome: string;
  sexo?: string | null;
  objetivo?: string | null;
  peso_meta?: number | string | null;
};

function formatData(d?: string | null) {
  if (!d) return "-";
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatNumber(v?: number | null, digits = 1) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return Number(v).toFixed(digits);
}

function deltaValue(atual?: number | null, anterior?: number | null) {
  if (atual === null || atual === undefined) return null;
  if (anterior === null || anterior === undefined) return null;
  return Number((Number(atual) - Number(anterior)).toFixed(2));
}

function deltaLabel(atual?: number | null, anterior?: number | null, sufixo = "") {
  const delta = deltaValue(atual, anterior);
  if (delta === null) return "-";
  const sinal = delta > 0 ? "+" : "";
  return `${sinal}${delta}${sufixo}`;
}

function deltaColor(delta: number | null, invert = false) {
  if (delta === null || delta === 0) return "text-zinc-500";
  if (!invert) return delta > 0 ? "text-green-600" : "text-red-600";
  return delta < 0 ? "text-green-600" : "text-red-600";
}

function classificarIMC(imc: number) {
  if (!imc) return "Sem dados";
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25) return "Peso normal";
  if (imc < 30) return "Sobrepeso";
  if (imc < 35) return "Obesidade grau I";
  if (imc < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

function classificarGordura(
  gordura?: number | null,
  sexo: "masculino" | "feminino" = "masculino"
) {
  const g = Number(gordura || 0);
  if (!g) return "Sem dados";

  if (sexo === "masculino") {
    if (g < 6) return "Muito baixa";
    if (g < 14) return "Atlética";
    if (g < 18) return "Adequada";
    if (g < 25) return "Elevada";
    return "Alta";
  }

  if (g < 14) return "Muito baixa";
  if (g < 21) return "Atlética";
  if (g < 25) return "Adequada";
  if (g < 32) return "Elevada";
  return "Alta";
}

function classificarCintura(
  cintura?: number | null,
  sexo: "masculino" | "feminino" = "masculino"
) {
  const c = Number(cintura || 0);
  if (!c) return "Sem dados";

  if (sexo === "masculino") {
    if (c < 94) return "Risco baixo";
    if (c < 102) return "Risco moderado";
    return "Risco alto";
  }

  if (c < 80) return "Risco baixo";
  if (c < 88) return "Risco moderado";
  return "Risco alto";
}

function corStatus(valor: string) {
  const texto = valor.toLowerCase();

  if (
    texto.includes("normal") ||
    texto.includes("adequada") ||
    texto.includes("baixo") ||
    texto.includes("atlética")
  ) {
    return "text-green-600";
  }

  if (
    texto.includes("moderado") ||
    texto.includes("elevada") ||
    texto.includes("sobrepeso")
  ) {
    return "text-yellow-600";
  }

  if (
    texto.includes("alto") ||
    texto.includes("alta") ||
    texto.includes("obesidade")
  ) {
    return "text-red-600";
  }

  return "text-gray-600";
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  helper,
  accent = "text-black",
  icon: Icon,
}: {
  label: string;
  value: string;
  helper?: string;
  accent?: string;
  icon?: any;
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{label}</p>
        {Icon ? <Icon size={18} className={accent} /> : null}
      </div>
      <p className={`mt-3 text-3xl font-black ${accent}`}>{value}</p>
      {helper ? <p className="mt-2 text-sm text-zinc-500">{helper}</p> : null}
    </div>
  );
}

function MedidaLinha({
  label,
  atual,
  anterior,
  sufixo = " cm",
  invert = false,
}: {
  label: string;
  atual?: number | null;
  anterior?: number | null;
  sufixo?: string;
  invert?: boolean;
}) {
  const delta = deltaValue(atual, anterior);

  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-bold text-gray-900">
          {atual !== null && atual !== undefined ? `${formatNumber(atual)}${sufixo}` : "-"}
        </p>
      </div>

      <div className={`text-sm font-semibold ${deltaColor(delta, invert)}`}>
        {delta !== null ? deltaLabel(atual, anterior, sufixo) : "-"}
      </div>
    </div>
  );
}

function FotoCard({ titulo, url }: { titulo: string; url?: string | null }) {
  return (
    <div className="space-y-3 rounded-2xl border border-black/5 p-4">
      <div className="flex items-center gap-2">
        <Camera size={16} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">{titulo}</p>
      </div>

      {url ? (
        <img
          src={url}
          alt={titulo}
          className="h-72 w-full rounded-xl border object-cover"
        />
      ) : (
        <div className="flex h-72 w-full items-center justify-center rounded-xl border bg-zinc-50 text-zinc-400">
          Sem foto
        </div>
      )}
    </div>
  );
}

function AvaliacaoPageContent() {
  const params = useParams();
  const router = useRouter();
  const avaliacaoId = params?.id;

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [avaliacaoAnterior, setAvaliacaoAnterior] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");

        const resAtual = await apiFetch(`/api/avaliacoes/${avaliacaoId}`, {
          cache: "no-store",
        });

        const jsonAtual = await resAtual.json().catch(() => ({}));

        if (!resAtual.ok) {
          setErro((jsonAtual as any).error || "Erro ao carregar avaliação");
          return;
        }

        const atual = jsonAtual as Avaliacao;
        setAvaliacao(atual);

        const [resAluno, resAvaliacoes] = await Promise.all([
          apiFetch(`/api/alunos/${atual.aluno_id}`, {
            cache: "no-store",
          }),
          apiFetch(`/api/avaliacoes`, {
            cache: "no-store",
          }),
        ]);

        const jsonAluno = await resAluno.json().catch(() => ({}));
        const jsonAvaliacoes = await resAvaliacoes.json().catch(() => []);

        if (resAluno.ok) {
          setAluno(jsonAluno as Aluno);
        }

        if (resAvaliacoes.ok) {
          const lista = (Array.isArray(jsonAvaliacoes) ? jsonAvaliacoes : [])
            .filter((a: Avaliacao) => String(a.aluno_id) === String(atual.aluno_id))
            .sort((a: Avaliacao, b: Avaliacao) =>
              a.data_avaliacao.localeCompare(b.data_avaliacao)
            );

          const idx = lista.findIndex(
            (a: Avaliacao) => String(a.id) === String(atual.id)
          );

          if (idx > 0) {
            setAvaliacaoAnterior(lista[idx - 1]);
          }
        }
      } catch {
        setErro("Erro ao carregar avaliação");
      } finally {
        setLoading(false);
      }
    }

    if (avaliacaoId) carregar();
  }, [avaliacaoId]);

  const sexoAnalise: "masculino" | "feminino" =
  aluno?.sexo === "feminino" ? "feminino" : "masculino";

  const imcAtual =
    avaliacao?.peso && avaliacao?.altura
      ? Number((avaliacao.peso / (avaliacao.altura * avaliacao.altura)).toFixed(2))
      : 0;

  const statusIMC = classificarIMC(imcAtual);
  const statusGordura = classificarGordura(avaliacao?.percentual_gordura, sexoAnalise);
  const statusCintura = classificarCintura(avaliacao?.cintura, sexoAnalise);

  const resumoAutomatico = useMemo(() => {
    if (!avaliacao) return "Sem dados para análise.";
    return `IMC ${statusIMC.toLowerCase()}, gordura corporal ${statusGordura.toLowerCase()} e cintura com ${statusCintura.toLowerCase()}.`;
  }, [avaliacao, statusIMC, statusGordura, statusCintura]);

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
        mensagem={erro || "Avaliação não encontrada"}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 px-4 py-4 md:px-6 xl:px-8">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <p className="text-sm text-zinc-300">Avaliação física</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              {aluno?.nome || "Aluno"}
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Visualização da avaliação com composição corporal, fotos e comparação por grupos musculares.
            </p>
          </div>

          <div className="rounded-[24px] bg-white/10 p-5 backdrop-blur">
            <p className="text-sm text-white/70">Data da avaliação</p>
            <p className="mt-1 text-2xl font-black">
              {formatData(avaliacao.data_avaliacao)}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/60">Objetivo</p>
                <p className="text-base font-bold capitalize">
                  {aluno?.objetivo || avaliacao?.objetivo || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Peso meta</p>
                <p className="text-base font-bold">
                  {aluno?.peso_meta ? `${aluno.peso_meta} kg` : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Comparação</p>
                <p className="text-base font-bold">
                  {avaliacaoAnterior ? "Com avaliação anterior" : "Primeira avaliação"}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/60">Aluno</p>
                <p className="text-base font-bold">{aluno?.id || avaliacao.aluno_id}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Peso"
          value={`${formatNumber(avaliacao.peso)} kg`}
          helper={
            avaliacaoAnterior
              ? `Variação: ${deltaLabel(avaliacao.peso, avaliacaoAnterior.peso, " kg")}`
              : "Primeira avaliação"
          }
          accent="text-blue-600"
          icon={Scale}
        />

        <StatCard
          label="% Gordura"
          value={`${formatNumber(avaliacao.percentual_gordura)}%`}
          helper={statusGordura}
          accent="text-red-600"
          icon={Activity}
        />

        <StatCard
          label="IMC"
          value={String(imcAtual || 0)}
          helper={statusIMC}
          accent="text-zinc-900"
          icon={TrendingUp}
        />

        <StatCard
          label="Cintura"
          value={`${formatNumber(avaliacao.cintura)} cm`}
          helper={statusCintura}
          accent="text-amber-600"
          icon={Ruler}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-white"
        >
          <Printer size={16} />
          Imprimir
        </button>

        <button
          onClick={() => router.push(`/alunos/${avaliacao.aluno_id}/evolucao`)}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-3"
        >
          <ChartColumnBig size={16} />
          Dashboard corporal
        </button>
      </div>

      <Card
        title="Resumo automático"
        subtitle="Leitura rápida dos principais indicadores."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">IMC</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{imcAtual || 0}</p>
            <p className={`mt-2 text-sm font-semibold ${corStatus(statusIMC)}`}>
              {statusIMC}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Gordura corporal</p>
            <p className="mt-1 text-2xl font-black text-gray-900">
              {formatNumber(avaliacao.percentual_gordura)}%
            </p>
            <p className={`mt-2 text-sm font-semibold ${corStatus(statusGordura)}`}>
              {statusGordura}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Cintura</p>
            <p className="mt-1 text-2xl font-black text-gray-900">
              {formatNumber(avaliacao.cintura)} cm
            </p>
            <p className={`mt-2 text-sm font-semibold ${corStatus(statusCintura)}`}>
              {statusCintura}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Resumo automático</p>
          <p className="mt-2 text-base font-medium text-gray-900">
            {resumoAutomatico}
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card
          title="Mapa corporal"
          subtitle="Visualização atual das medidas."
        >
          <MapaCorporal
  medidas={avaliacao}
  sexo={aluno?.sexo === "feminino" ? "feminino" : "masculino"}
/>
        </Card>

        <Card
          title="Comparação com a avaliação anterior"
          subtitle="Variações principais entre esta avaliação e a anterior."
        >
          {!avaliacaoAnterior ? (
            <p className="text-gray-500">Esta é a primeira avaliação do aluno.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <MedidaLinha label="Peso" atual={avaliacao.peso} anterior={avaliacaoAnterior.peso} sufixo=" kg" invert />
              <MedidaLinha label="% Gordura" atual={avaliacao.percentual_gordura} anterior={avaliacaoAnterior.percentual_gordura} sufixo="%" invert />
              <MedidaLinha label="Cintura" atual={avaliacao.cintura} anterior={avaliacaoAnterior.cintura} invert />
              <MedidaLinha label="Abdômen" atual={avaliacao.abdomen} anterior={avaliacaoAnterior.abdomen} invert />
              <MedidaLinha label="Massa magra" atual={avaliacao.massa_magra} anterior={avaliacaoAnterior.massa_magra} sufixo=" kg" />
              <MedidaLinha label="Quadril" atual={avaliacao.quadril} anterior={avaliacaoAnterior.quadril} />
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Composição corporal"
        subtitle="Indicadores completos da avaliação."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Peso</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.peso)} kg</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Altura</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.altura, 2)} m</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">% Gordura</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.percentual_gordura)}%</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">IMC</p>
            <p className="mt-1 text-xl font-black">{imcAtual || 0}</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Massa magra</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.massa_magra)} kg</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Massa gorda</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.massa_gorda)} kg</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Água corporal</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.agua_corporal)}%</p>
          </div>
          <div className="rounded-xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Gordura visceral</p>
            <p className="mt-1 text-xl font-black">{formatNumber(avaliacao.gordura_visceral)}</p>
          </div>
        </div>
      </Card>

      <Card
        title="Medidas organizadas por região"
        subtitle="Agora com divisão muscular mais detalhada."
      >
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">Tronco</h3>
            <MedidaLinha label="Peito" atual={avaliacao.peito} anterior={avaliacaoAnterior?.peito} />
            <MedidaLinha label="Costas" atual={avaliacao.costas} anterior={avaliacaoAnterior?.costas} />
            <MedidaLinha label="Cintura" atual={avaliacao.cintura} anterior={avaliacaoAnterior?.cintura} invert />
            <MedidaLinha label="Abdômen" atual={avaliacao.abdomen} anterior={avaliacaoAnterior?.abdomen} invert />
            <MedidaLinha label="Quadril" atual={avaliacao.quadril} anterior={avaliacaoAnterior?.quadril} />
            <MedidaLinha label="Glúteo" atual={avaliacao.gluteo} anterior={avaliacaoAnterior?.gluteo} />
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">Membros superiores</h3>
            <MedidaLinha label="Bíceps esquerdo" atual={avaliacao.biceps_esquerdo} anterior={avaliacaoAnterior?.biceps_esquerdo} />
            <MedidaLinha label="Bíceps direito" atual={avaliacao.biceps_direito} anterior={avaliacaoAnterior?.biceps_direito} />
            <MedidaLinha label="Tríceps esquerdo" atual={avaliacao.triceps_esquerdo} anterior={avaliacaoAnterior?.triceps_esquerdo} />
            <MedidaLinha label="Tríceps direito" atual={avaliacao.triceps_direito} anterior={avaliacaoAnterior?.triceps_direito} />
            <MedidaLinha label="Antebraço esquerdo" atual={avaliacao.antebraco_esquerdo} anterior={avaliacaoAnterior?.antebraco_esquerdo} />
            <MedidaLinha label="Antebraço direito" atual={avaliacao.antebraco_direito} anterior={avaliacaoAnterior?.antebraco_direito} />
            <MedidaLinha label="Pulso esquerdo" atual={avaliacao.pulso_esquerdo} anterior={avaliacaoAnterior?.pulso_esquerdo} />
            <MedidaLinha label="Pulso direito" atual={avaliacao.pulso_direito} anterior={avaliacaoAnterior?.pulso_direito} />
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900">Membros inferiores</h3>
            <MedidaLinha label="Coxa esquerda" atual={avaliacao.coxa_esquerda} anterior={avaliacaoAnterior?.coxa_esquerda} />
            <MedidaLinha label="Coxa direita" atual={avaliacao.coxa_direita} anterior={avaliacaoAnterior?.coxa_direita} />
            <MedidaLinha label="Panturrilha esquerda" atual={avaliacao.panturrilha_esquerda} anterior={avaliacaoAnterior?.panturrilha_esquerda} />
            <MedidaLinha label="Panturrilha direita" atual={avaliacao.panturrilha_direita} anterior={avaliacaoAnterior?.panturrilha_direita} />
          </div>
        </div>
      </Card>

      <Card
        title="Registro fotográfico"
        subtitle="Comparação visual da avaliação."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <FotoCard titulo="Foto frente" url={avaliacao.foto_frente} />
          <FotoCard titulo="Foto lado" url={avaliacao.foto_lado} />
          <FotoCard titulo="Foto costas" url={avaliacao.foto_costas} />
        </div>
      </Card>
    </main>
  );
}

export default function AvaliacaoPage() {
  return (
    <ProtegePagina permissao="imprimir">
      <AvaliacaoPageContent />
    </ProtegePagina>
  );
}