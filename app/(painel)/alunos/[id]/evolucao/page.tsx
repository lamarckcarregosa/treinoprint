"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import MapaCorporal from "@/components/MapaCorporal";
import { apiFetch } from "@/lib/apiFetch";

type Aluno = {
  id: number;
  nome: string;
  objetivo?: string;
  peso_meta?: number | string;
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
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  braco_esquerdo?: number;
  braco_direito?: number;
  coxa_esquerda?: number;
  coxa_direita?: number;
  panturrilha_esquerda?: number;
  panturrilha_direita?: number;
  foto_frente?: string;
  foto_lado?: string;
  foto_costas?: string;
  objetivo?: string;
};

function formatData(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
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
  gordura?: number,
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
  cintura?: number,
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

function normalizarMeta(meta?: string) {
  const texto = String(meta || "").toLowerCase().trim();

  if (
    texto.includes("emag") ||
    texto.includes("perda de peso") ||
    texto.includes("secar")
  ) {
    return "emagrecimento";
  }

  if (
    texto.includes("hipert") ||
    texto.includes("ganho de massa") ||
    texto.includes("massa muscular") ||
    texto.includes("crescer")
  ) {
    return "hipertrofia";
  }

  if (texto.includes("defini")) {
    return "definicao";
  }

  if (
    texto.includes("condicion") ||
    texto.includes("resist") ||
    texto.includes("saúde") ||
    texto.includes("saude")
  ) {
    return "condicionamento";
  }

  return "geral";
}

function gerarAnaliseMeta(params: {
  meta?: string;
  pesoAtual?: number;
  pesoAnterior?: number;
  gorduraAtual?: number;
  gorduraAnterior?: number;
  cinturaAtual?: number;
  cinturaAnterior?: number;
  massaMagraAtual?: number;
  massaMagraAnterior?: number;
}) {
  const meta = normalizarMeta(params.meta);

  const deltaPeso = Number(
    ((params.pesoAtual || 0) - (params.pesoAnterior || 0)).toFixed(2)
  );
  const deltaGordura = Number(
    ((params.gorduraAtual || 0) - (params.gorduraAnterior || 0)).toFixed(2)
  );
  const deltaCintura = Number(
    ((params.cinturaAtual || 0) - (params.cinturaAnterior || 0)).toFixed(2)
  );
  const deltaMassaMagra = Number(
    ((params.massaMagraAtual || 0) - (params.massaMagraAnterior || 0)).toFixed(2)
  );

  if (meta === "emagrecimento") {
    if (deltaPeso < 0 && deltaCintura < 0 && deltaGordura < 0) {
      return {
        titulo: "Evolução positiva para emagrecimento",
        status: "excelente",
        mensagem:
          "O aluno apresentou redução de peso, gordura corporal e cintura, indicando progresso consistente para emagrecimento.",
      };
    }

    if (deltaPeso < 0 || deltaGordura < 0 || deltaCintura < 0) {
      return {
        titulo: "Evolução parcial para emagrecimento",
        status: "boa",
        mensagem:
          "Há sinais de melhora em pelo menos um dos principais indicadores de emagrecimento, mas a evolução ainda não está totalmente consistente.",
      };
    }

    return {
      titulo: "Evolução abaixo do esperado para emagrecimento",
      status: "atencao",
      mensagem:
        "Os indicadores principais não mostraram redução consistente. Vale revisar treino, alimentação e frequência.",
    };
  }

  if (meta === "hipertrofia") {
    if (deltaMassaMagra > 0 && deltaGordura <= 0) {
      return {
        titulo: "Evolução positiva para hipertrofia",
        status: "excelente",
        mensagem:
          "O aluno apresentou ganho de massa magra sem aumento relevante de gordura, indicando boa evolução para hipertrofia.",
      };
    }

    if (deltaMassaMagra > 0) {
      return {
        titulo: "Ganho de massa em evolução",
        status: "boa",
        mensagem:
          "Há aumento de massa magra, mas vale acompanhar gordura corporal e medidas para refinar o processo.",
      };
    }

    return {
      titulo: "Evolução abaixo do esperado para hipertrofia",
      status: "atencao",
      mensagem:
        "Não houve ganho claro de massa magra. Pode ser necessário ajustar treino, recuperação e estratégia nutricional.",
    };
  }

  if (meta === "definicao") {
    if (deltaGordura < 0 && deltaMassaMagra >= 0) {
      return {
        titulo: "Evolução positiva para definição",
        status: "excelente",
        mensagem:
          "O aluno reduziu gordura corporal mantendo ou aumentando massa magra, cenário ideal para definição.",
      };
    }

    if (deltaGordura < 0) {
      return {
        titulo: "Definição em progresso",
        status: "boa",
        mensagem:
          "Há queda de gordura corporal, mas ainda é importante preservar melhor a massa magra durante o processo.",
      };
    }

    return {
      titulo: "Evolução abaixo do esperado para definição",
      status: "atencao",
      mensagem:
        "A redução de gordura ainda não ficou evidente. Vale revisar o plano para melhorar o processo de definição.",
    };
  }

  if (meta === "condicionamento") {
    if (deltaGordura < 0 || deltaCintura < 0 || deltaPeso < 0) {
      return {
        titulo: "Melhora geral do condicionamento",
        status: "boa",
        mensagem:
          "Os indicadores mostram melhora corporal geral, o que sugere boa resposta ao processo de condicionamento.",
      };
    }

    return {
      titulo: "Condicionamento estável",
      status: "atencao",
      mensagem:
        "Os dados mostram pouca mudança corporal. Isso não é necessariamente ruim, mas vale acompanhar frequência e desempenho.",
    };
  }

  if (deltaGordura < 0 || deltaCintura < 0 || deltaMassaMagra > 0) {
    return {
      titulo: "Evolução corporal positiva",
      status: "boa",
      mensagem:
        "Há melhora em indicadores importantes da composição corporal, mostrando progresso geral do aluno.",
    };
  }

  return {
    titulo: "Evolução corporal estável",
    status: "atencao",
    mensagem:
      "As mudanças corporais ainda estão discretas. Vale manter o acompanhamento e reavaliar nas próximas medições.",
  };
}

function corAnalise(status: string) {
  if (status === "excelente") return "text-green-600 bg-green-50 border-green-200";
  if (status === "boa") return "text-blue-600 bg-blue-50 border-blue-200";
  return "text-yellow-700 bg-yellow-50 border-yellow-200";
}

function gerarAnaliseMetaInteligente(params: {
  meta?: string;
  pesoAtual?: number;
  pesoAnterior?: number;
  gorduraAtual?: number;
  gorduraAnterior?: number;
  cinturaAtual?: number;
  cinturaAnterior?: number;
  massaMagraAtual?: number;
  massaMagraAnterior?: number;
}) {
  const meta = normalizarMeta(params.meta);

  const deltaPeso = Number(
    ((params.pesoAtual || 0) - (params.pesoAnterior || 0)).toFixed(2)
  );
  const deltaGordura = Number(
    ((params.gorduraAtual || 0) - (params.gorduraAnterior || 0)).toFixed(2)
  );
  const deltaCintura = Number(
    ((params.cinturaAtual || 0) - (params.cinturaAnterior || 0)).toFixed(2)
  );
  const deltaMassaMagra = Number(
    ((params.massaMagraAtual || 0) - (params.massaMagraAnterior || 0)).toFixed(2)
  );

  if (meta === "emagrecimento") {
    const score =
      (deltaPeso < 0 ? 1 : 0) +
      (deltaGordura < 0 ? 1 : 0) +
      (deltaCintura < 0 ? 1 : 0);

    if (score === 3) {
      return {
        titulo: "Meta inteligente: emagrecimento excelente",
        status: "excelente",
        mensagem:
          "Peso, gordura corporal e cintura evoluíram juntos. A resposta ao plano está muito boa.",
      };
    }

    if (score >= 1) {
      return {
        titulo: "Meta inteligente: emagrecimento em progresso",
        status: "boa",
        mensagem:
          "Há melhora nos principais indicadores, mas a evolução ainda pode ficar mais consistente.",
      };
    }

    return {
      titulo: "Meta inteligente: emagrecimento abaixo do esperado",
      status: "atencao",
      mensagem:
        "Os três indicadores principais não reduziram juntos. Pode ser necessário ajustar a estratégia.",
    };
  }

  if (meta === "hipertrofia") {
    if (deltaMassaMagra > 0 && deltaGordura <= 0) {
      return {
        titulo: "Meta inteligente: hipertrofia eficiente",
        status: "excelente",
        mensagem:
          "Houve aumento de massa magra sem piora importante da gordura corporal.",
      };
    }

    if (deltaMassaMagra > 0) {
      return {
        titulo: "Meta inteligente: hipertrofia parcial",
        status: "boa",
        mensagem:
          "Existe ganho de massa magra, mas ainda vale melhorar a qualidade da composição corporal.",
      };
    }

    return {
      titulo: "Meta inteligente: hipertrofia abaixo do esperado",
      status: "atencao",
      mensagem:
        "O ganho de massa magra ainda não apareceu com clareza nos dados.",
    };
  }

  if (meta === "definicao") {
    if (deltaGordura < 0 && deltaMassaMagra >= 0) {
      return {
        titulo: "Meta inteligente: definição muito boa",
        status: "excelente",
        mensagem:
          "A gordura caiu e a massa magra foi preservada ou aumentou, cenário ideal para definição.",
      };
    }

    if (deltaGordura < 0) {
      return {
        titulo: "Meta inteligente: definição em andamento",
        status: "boa",
        mensagem:
          "Há queda de gordura, mas a preservação de massa magra ainda pode melhorar.",
      };
    }

    return {
      titulo: "Meta inteligente: definição abaixo do esperado",
      status: "atencao",
      mensagem:
        "A redução de gordura ainda não ficou clara nos indicadores atuais.",
      };
  }

  if (meta === "condicionamento") {
    if (deltaPeso < 0 || deltaGordura < 0 || deltaCintura < 0) {
      return {
        titulo: "Meta inteligente: condicionamento positivo",
        status: "boa",
        mensagem:
          "Os sinais corporais sugerem melhora geral do condicionamento e da resposta física.",
      };
    }

    return {
      titulo: "Meta inteligente: condicionamento estável",
      status: "atencao",
      mensagem:
        "As mudanças corporais ainda estão discretas. Acompanhe junto com desempenho e frequência.",
      };
  }

  return {
    titulo: "Meta inteligente: evolução geral",
    status: "boa",
    mensagem:
      "O sistema detectou uma evolução corporal geral, mas sem um padrão específico dominante.",
  };
}

export default function EvolucaoAluno() {
  const params = useParams();
  const searchParams = useSearchParams();
  const alunoId = params?.id;

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setErro("");

        const [resAluno, resAvaliacoes] = await Promise.all([
          apiFetch(`/api/alunos/${alunoId}`, { cache: "no-store" }),
          apiFetch(`/api/avaliacoes`, { cache: "no-store" }),
        ]);

        const jsonAluno = await resAluno.json().catch(() => ({}));
        const jsonAvaliacoes = await resAvaliacoes.json().catch(() => []);

        if (!resAluno.ok) {
          setErro((jsonAluno as any).error || "Erro ao carregar aluno");
          return;
        }

        if (!resAvaliacoes.ok) {
          setErro((jsonAvaliacoes as any).error || "Erro ao carregar evolução corporal");
          return;
        }

        setAluno(jsonAluno);

        const lista = (Array.isArray(jsonAvaliacoes) ? jsonAvaliacoes : []).filter(
          (a: Avaliacao) => String(a.aluno_id) === String(alunoId)
        );

        setAvaliacoes(
          lista.sort((a: Avaliacao, b: Avaliacao) =>
            a.data_avaliacao.localeCompare(b.data_avaliacao)
          )
        );
      } catch {
        setErro("Erro ao carregar evolução corporal");
      } finally {
        setLoading(false);
      }
    }

    if (alunoId) carregar();
  }, [alunoId]);

  const grafico = useMemo(
    () =>
      avaliacoes.map((a) => ({
        data: formatData(a.data_avaliacao),
        peso: Number(a.peso || 0),
        gordura: Number(a.percentual_gordura || 0),
        massa: Number(a.massa_magra || 0),
      })),
    [avaliacoes]
  );

  const pesoInicial = Number(avaliacoes[0]?.peso || 0);
  const pesoAtual = Number(avaliacoes[avaliacoes.length - 1]?.peso || 0);

  const progressoPeso = pesoInicial
    ? ((pesoInicial - pesoAtual) / pesoInicial) * 100
    : 0;

  const ultima = avaliacoes[avaliacoes.length - 1];
  const anterior = avaliacoes[avaliacoes.length - 2];

  const sexoAnalise: "masculino" | "feminino" = "masculino";

  const imcAtual =
    ultima?.peso && ultima?.altura
      ? Number((ultima.peso / (ultima.altura * ultima.altura)).toFixed(2))
      : 0;

  const statusIMC = classificarIMC(imcAtual);
  const statusGordura = classificarGordura(
    ultima?.percentual_gordura,
    sexoAnalise
  );
  const statusCintura = classificarCintura(ultima?.cintura, sexoAnalise);

  const resumoAutomatico = (() => {
    if (!ultima) return "Sem avaliações suficientes para análise.";

    return `IMC ${statusIMC.toLowerCase()}, gordura corporal ${statusGordura.toLowerCase()} e cintura com ${statusCintura.toLowerCase()}.`;
  })();

  const metaUrl = searchParams.get("meta") || "";
  const metaAluno = normalizarMeta(aluno?.objetivo || ultima?.objetivo || metaUrl || "geral");

  const analiseMeta = gerarAnaliseMeta({
    meta: metaAluno,
    pesoAtual: ultima?.peso,
    pesoAnterior: anterior?.peso,
    gorduraAtual: ultima?.percentual_gordura,
    gorduraAnterior: anterior?.percentual_gordura,
    cinturaAtual: ultima?.cintura,
    cinturaAnterior: anterior?.cintura,
    massaMagraAtual: ultima?.massa_magra,
    massaMagraAnterior: anterior?.massa_magra,
  });

  const analiseMetaInteligente = gerarAnaliseMetaInteligente({
    meta: metaAluno,
    pesoAtual: ultima?.peso,
    pesoAnterior: anterior?.peso,
    gorduraAtual: ultima?.percentual_gordura,
    gorduraAnterior: anterior?.percentual_gordura,
    cinturaAtual: ultima?.cintura,
    cinturaAnterior: anterior?.cintura,
    massaMagraAtual: ultima?.massa_magra,
    massaMagraAnterior: anterior?.massa_magra,
  });

  const pesoMeta = Number(aluno?.peso_meta || 0);

  const totalNecessario = pesoInicial && pesoMeta ? pesoInicial - pesoMeta : 0;
  const totalJaEvoluido = pesoInicial && pesoAtual ? pesoInicial - pesoAtual : 0;

  const progressoMeta =
    totalNecessario > 0
      ? Math.max(0, Math.min((totalJaEvoluido / totalNecessario) * 100, 100))
      : 0;

  const faltaParaMeta =
    pesoMeta > 0 ? Number((pesoAtual - pesoMeta).toFixed(2)) : 0;

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando evolução corporal..."
      />
    );
  }

  if (erro) {
    return (
      <SystemError
        titulo="Erro ao carregar evolução"
        mensagem={erro}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-black to-zinc-800 text-white p-8">
        <h1 className="text-4xl font-black">Dashboard corporal</h1>
        <p className="text-zinc-300 mt-2">Evolução física do aluno</p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Peso inicial</p>
          <p className="text-2xl font-black">{pesoInicial} kg</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Peso atual</p>
          <p className="text-2xl font-black">{pesoAtual} kg</p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Progresso geral</p>
          <p
            className={`text-2xl font-black ${
              progressoPeso > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {progressoPeso.toFixed(1)}%
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Meta do aluno</h2>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhamento do objetivo corporal
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Objetivo</p>
            <p className="text-lg font-black text-gray-900 capitalize">
              {aluno?.objetivo || "Não definido"}
            </p>
          </div>
        </div>

        {pesoMeta > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Peso inicial</p>
                <p className="text-2xl font-black mt-1">{pesoInicial} kg</p>
              </div>

              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Peso atual</p>
                <p className="text-2xl font-black mt-1">{pesoAtual} kg</p>
              </div>

              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Peso meta</p>
                <p className="text-2xl font-black mt-1">{pesoMeta} kg</p>
              </div>

              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Falta para meta</p>
                <p
                  className={`text-2xl font-black mt-1 ${
                    faltaParaMeta <= 0 ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {faltaParaMeta <= 0 ? "Meta atingida" : `${faltaParaMeta} kg`}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-gray-700">
                  Progresso da meta
                </p>
                <p className="text-sm font-black text-gray-900">
                  {progressoMeta.toFixed(1)}%
                </p>
              </div>

              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    progressoMeta >= 100 ? "bg-green-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${progressoMeta}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {progressoMeta >= 100
                  ? "Parabéns! A meta corporal foi atingida."
                  : "A barra mostra quanto já foi alcançado em direção ao peso meta."}
              </p>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-yellow-700 text-sm">
              Defina o peso meta na ficha do aluno para acompanhar o progresso automaticamente.
            </p>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-bold mb-4">Evolução corporal</h2>

        {grafico.length === 0 ? (
          <p className="text-gray-500">Sem avaliações para este aluno.</p>
        ) : (
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={grafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="peso" stroke="#2563eb" strokeWidth={3} name="Peso" />
                <Line dataKey="gordura" stroke="#dc2626" strokeWidth={3} name="% Gordura" />
                <Line dataKey="massa" stroke="#16a34a" strokeWidth={3} name="Massa magra" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-bold mb-4">Mapa corporal</h2>

        {avaliacoes.length === 0 ? (
          <p className="text-gray-500">Sem avaliações ainda.</p>
        ) : (
          <MapaCorporal medidas={avaliacoes[avaliacoes.length - 1]} />
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">Análise corporal automática</h2>
          <span className="text-sm text-gray-500">
            Leitura rápida da última avaliação
          </span>
        </div>

        {!ultima ? (
          <p className="text-gray-500">Sem avaliações para análise.</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">IMC</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {imcAtual || 0}
                </p>
                <p className={`text-sm font-semibold mt-2 ${corStatus(statusIMC)}`}>
                  {statusIMC}
                </p>
              </div>

              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Gordura corporal</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {ultima.percentual_gordura || 0}%
                </p>
                <p className={`text-sm font-semibold mt-2 ${corStatus(statusGordura)}`}>
                  {statusGordura}
                </p>
              </div>

              <div className="rounded-2xl border border-black/5 p-4">
                <p className="text-sm text-gray-500">Cintura</p>
                <p className="text-2xl font-black text-gray-900 mt-1">
                  {ultima.cintura || 0} cm
                </p>
                <p className={`text-sm font-semibold mt-2 ${corStatus(statusCintura)}`}>
                  {statusCintura}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-gray-50 p-4">
              <p className="text-sm text-gray-500">Resumo automático</p>
              <p className="text-base font-medium text-gray-900 mt-2">
                {resumoAutomatico}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">Análise por meta</h2>
          <span className="text-sm text-gray-500 capitalize">
            Meta atual: {metaAluno}
          </span>
        </div>

        {!ultima ? (
          <p className="text-gray-500">Sem avaliações para análise por meta.</p>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-2xl border p-4 ${corAnalise(analiseMeta.status)}`}>
              <p className="text-sm font-semibold">Diagnóstico</p>
              <p className="text-xl font-black mt-1">{analiseMeta.titulo}</p>
              <p className="text-sm mt-3">{analiseMeta.mensagem}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-black/5 px-4 py-3">
                <p className="text-xs text-gray-500">Peso</p>
                <p className="font-bold text-gray-900">
                  {Number(
                    ((ultima?.peso || 0) - (anterior?.peso || 0)).toFixed(2)
                  ) > 0
                    ? "+"
                    : ""}
                  {Number(
                    ((ultima?.peso || 0) - (anterior?.peso || 0)).toFixed(2)
                  )}{" "}
                  kg
                </p>
              </div>

              <div className="rounded-xl border border-black/5 px-4 py-3">
                <p className="text-xs text-gray-500">% Gordura</p>
                <p className="font-bold text-gray-900">
                  {Number(
                    (
                      (ultima?.percentual_gordura || 0) -
                      (anterior?.percentual_gordura || 0)
                    ).toFixed(2)
                  ) > 0
                    ? "+"
                    : ""}
                  {Number(
                    (
                      (ultima?.percentual_gordura || 0) -
                      (anterior?.percentual_gordura || 0)
                    ).toFixed(2)
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-black/5 px-4 py-3">
                <p className="text-xs text-gray-500">Cintura</p>
                <p className="font-bold text-gray-900">
                  {Number(
                    ((ultima?.cintura || 0) - (anterior?.cintura || 0)).toFixed(2)
                  ) > 0
                    ? "+"
                    : ""}
                  {Number(
                    ((ultima?.cintura || 0) - (anterior?.cintura || 0)).toFixed(2)
                  )}{" "}
                  cm
                </p>
              </div>

              <div className="rounded-xl border border-black/5 px-4 py-3">
                <p className="text-xs text-gray-500">Massa magra</p>
                <p className="font-bold text-gray-900">
                  {Number(
                    (
                      (ultima?.massa_magra || 0) -
                      (anterior?.massa_magra || 0)
                    ).toFixed(2)
                  ) > 0
                    ? "+"
                    : ""}
                  {Number(
                    (
                      (ultima?.massa_magra || 0) -
                      (anterior?.massa_magra || 0)
                    ).toFixed(2)
                  )}{" "}
                  kg
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">Meta inteligente</h2>
          <span className="text-sm text-gray-500 capitalize">
            Interpretação avançada da meta
          </span>
        </div>

        {!ultima ? (
          <p className="text-gray-500">Sem avaliações para meta inteligente.</p>
        ) : (
          <div className={`rounded-2xl border p-4 ${corAnalise(analiseMetaInteligente.status)}`}>
            <p className="text-sm font-semibold">Diagnóstico inteligente</p>
            <p className="text-xl font-black mt-1">
              {analiseMetaInteligente.titulo}
            </p>
            <p className="text-sm mt-3">
              {analiseMetaInteligente.mensagem}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}