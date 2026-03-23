"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  CreditCard,
  Activity,
  IdCard,
  LogOut,
  UserCircle2,
  CheckCircle2,
} from "lucide-react";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  plano?: string | null;
  status?: string | null;
  foto_url?: string | null;
  objetivo?: string | null;
  peso_meta?: number | null;
};

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
  descanso?: string;
};

type Treino = {
  id: number;
  dia?: string;
  nivel?: string | null;
  tipo?: string | null;
  personal_nome?: string;
  exercicios?: Exercicio[];
  created_at: string;
  titulo?: string;
  objetivo?: string;
  observacoes?: string;
  origem?: string;
};

type Avaliacao = {
  id: number;
  data_avaliacao: string;
  peso?: number;
  altura?: number;
  percentual_gordura?: number;
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

type ExercicioFeito = {
  historico_impressao_id: number;
  exercicio_indice: number;
  feito: boolean;
};

function CardAtalho({
  titulo,
  icon: Icon,
  onClick,
}: {
  titulo: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white p-4 rounded-xl shadow flex flex-col items-center gap-2"
    >
      <Icon size={24} />
      <span className="text-sm font-medium">{titulo}</span>
    </button>
  );
}

function formatData(data?: string | null) {
  if (!data) return "-";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const dt = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);

  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function formatBRL(valor?: number | null) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularIMC(peso?: number, altura?: number) {
  if (!peso || !altura) return 0;
  return Number((peso / (altura * altura)).toFixed(2));
}

function calcularProgresso(total: number, feitos: number) {
  if (!total) return 0;
  return Math.round((feitos / total) * 100);
}

export default function InicioAlunoPage() {
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [treinoAtual, setTreinoAtual] = useState<Treino | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [feitos, setFeitos] = useState<ExercicioFeito[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const logado =
      typeof window !== "undefined"
        ? localStorage.getItem("treinoprint_aluno_logado")
        : null;

    if (!logado) {
      router.push("/app-aluno/login");
      return;
    }

    const carregar = async () => {
      try {
        setErro("");

        const [resAluno, resTreinos, resAvaliacoes, resFinanceiro, resFeitos] =
          await Promise.all([
            apiFetchAluno("/api/app-aluno/me", {
              cache: "no-store",
            }),
            apiFetchAluno("/api/app-aluno/treinos", {
              cache: "no-store",
            }),
            apiFetchAluno("/api/app-aluno/avaliacoes", {
              cache: "no-store",
            }),
            apiFetchAluno("/api/app-aluno/financeiro", {
              cache: "no-store",
            }),
            apiFetchAluno("/api/app-aluno/treinos/feitos", {
              cache: "no-store",
            }),
          ]);

        const jsonAluno = await resAluno.json().catch(() => ({}));
        const jsonTreinos = await resTreinos.json().catch(() => null);
        const jsonAvaliacoes = await resAvaliacoes.json().catch(() => []);
        const jsonFinanceiro = await resFinanceiro.json().catch(() => []);
        const jsonFeitos = await resFeitos.json().catch(() => []);

        if (!resAluno.ok) {
          setErro((jsonAluno as any).error || "Erro ao carregar dados do aluno");
          return;
        }

        if (!resTreinos.ok) {
          setErro((jsonTreinos as any)?.error || "Erro ao carregar treinos");
          return;
        }

        if (!resAvaliacoes.ok) {
          setErro((jsonAvaliacoes as any).error || "Erro ao carregar avaliações");
          return;
        }

        if (!resFinanceiro.ok) {
          setErro((jsonFinanceiro as any).error || "Erro ao carregar financeiro");
          return;
        }

        if (!resFeitos.ok) {
          setErro((jsonFeitos as any).error || "Erro ao carregar progresso");
          return;
        }

        let treinoNormalizado: Treino | null = null;

        if (jsonTreinos && typeof jsonTreinos === "object" && !Array.isArray(jsonTreinos)) {
          const treino = jsonTreinos as any;

          if (Array.isArray(treino.exercicios)) {
            treinoNormalizado = {
              id: Number(treino.id || 0),
              dia: treino.dia || treino.titulo || "-",
              nivel: treino.nivel || null,
              tipo: treino.tipo || null,
              personal_nome: treino.personal_nome || "",
              exercicios: treino.exercicios,
              created_at: treino.created_at || new Date().toISOString(),
              titulo: treino.titulo || treino.dia || "Treino atual",
              objetivo: treino.objetivo || "",
              observacoes: treino.observacoes || "",
              origem: treino.origem || "padrao",
            };
          }
        } else if (Array.isArray(jsonTreinos) && jsonTreinos.length > 0) {
          const treino = jsonTreinos[0] as any;

          treinoNormalizado = {
            id: Number(treino.id || 0),
            dia: treino.dia || treino.titulo || "-",
            nivel: treino.nivel || null,
            tipo: treino.tipo || null,
            personal_nome: treino.personal_nome || "",
            exercicios: Array.isArray(treino.exercicios) ? treino.exercicios : [],
            created_at: treino.created_at || new Date().toISOString(),
            titulo: treino.titulo || treino.dia || "Treino atual",
            objetivo: treino.objetivo || "",
            observacoes: treino.observacoes || "",
            origem: treino.origem || "padrao",
          };
        }

        const listaAvaliacoes = Array.isArray(jsonAvaliacoes) ? jsonAvaliacoes : [];
        const listaPagamentos = Array.isArray(jsonFinanceiro) ? jsonFinanceiro : [];
        const listaFeitos = Array.isArray(jsonFeitos) ? jsonFeitos : [];

        setAluno(jsonAluno as Aluno);
        setTreinoAtual(treinoNormalizado);
        setAvaliacoes(listaAvaliacoes);
        setPagamentos(listaPagamentos);
        setFeitos(listaFeitos);
      } catch {
        setErro("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [router]);

  const sair = () => {
    localStorage.removeItem("treinoprint_aluno_logado");
    localStorage.removeItem("treinoprint_aluno_id");
    localStorage.removeItem("treinoprint_aluno_academia_id");
    localStorage.removeItem("treinoprint_aluno_nome");
    router.push("/app-aluno/login");
  };

  const ultimaAvaliacao = useMemo(() => {
    if (avaliacoes.length === 0) return null;

    return [...avaliacoes].sort((a, b) =>
      String(b.data_avaliacao || "").localeCompare(String(a.data_avaliacao || ""))
    )[0];
  }, [avaliacoes]);

  const mensalidadeEmAberto = useMemo(() => {
    const pendentes = pagamentos
      .filter((p) => p.status !== "pago")
      .sort((a, b) =>
        String(a.vencimento || "").localeCompare(String(b.vencimento || ""))
      );

    return pendentes.length > 0 ? pendentes[0] : null;
  }, [pagamentos]);

  const resumoTreinoAtual = useMemo(() => {
    if (!treinoAtual || !Array.isArray(treinoAtual.exercicios)) {
      return {
        total: 0,
        feitosCount: 0,
        progresso: 0,
      };
    }

    const total = treinoAtual.exercicios.length;
    const feitosCount = treinoAtual.exercicios.filter((_, index) =>
      feitos.some(
        (item) =>
          Number(item.historico_impressao_id) === Number(treinoAtual.id) &&
          Number(item.exercicio_indice) === Number(index) &&
          item.feito
      )
    ).length;

    return {
      total,
      feitosCount,
      progresso: calcularProgresso(total, feitosCount),
    };
  }, [treinoAtual, feitos]);

  if (loading) {
    return <p className="p-4">Carregando...</p>;
  }

  if (erro || !aluno) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow space-y-4">
        <p className="text-red-600">{erro || "Aluno não encontrado"}</p>
        <button
          onClick={() => router.push("/app-aluno/login")}
          className="bg-black text-white rounded-xl px-4 py-3"
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-white p-5 rounded-2xl shadow">
        <div className="flex items-center gap-4">
          {aluno.foto_url ? (
            <img
              src={aluno.foto_url}
              alt={aluno.nome}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 border flex items-center justify-center text-gray-500 text-xs">
              Sem foto
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">{aluno.nome}</h1>
            <p className="text-sm text-gray-500">
              Plano: {aluno.plano || "-"}
            </p>
            <p className="text-sm text-gray-500">
              Status: {aluno.status || "-"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => router.push("/app-aluno/perfil")}
            className="flex items-center justify-center gap-2 border rounded-xl px-4 py-3"
          >
            <UserCircle2 size={18} />
            Perfil
          </button>

          <button
            onClick={sair}
            className="flex items-center justify-center gap-2 bg-black text-white rounded-xl px-4 py-3"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow space-y-2">
        <h2 className="font-bold text-gray-900">Resumo</h2>
        <p className="text-sm text-gray-600">
          Objetivo: {aluno.objetivo || "-"}
        </p>
        <p className="text-sm text-gray-600">
          Peso meta: {aluno.peso_meta ? `${aluno.peso_meta} kg` : "-"}
        </p>
      </section>

      <section className="bg-white p-5 rounded-2xl shadow space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900">Treino atual</h2>

          {treinoAtual ? (
            <button
              onClick={() => router.push("/app-aluno/treinos")}
              className="text-sm font-semibold text-black"
            >
              Ver treino
            </button>
          ) : null}
        </div>

        {!treinoAtual ? (
          <p className="text-sm text-gray-500">Nenhum treino encontrado.</p>
        ) : (
          <>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-gray-900">
                  Treino: {treinoAtual.titulo || treinoAtual.dia || "-"}
                </p>

                {treinoAtual.origem === "personalizado" ? (
                  <span className="px-2 py-1 rounded-full text-[11px] font-semibold bg-violet-600 text-white">
                    Personalizado
                  </span>
                ) : null}
              </div>

              {treinoAtual.nivel ? (
                <p className="text-sm text-gray-600">
                  Nível: {treinoAtual.nivel}
                </p>
              ) : null}

              {treinoAtual.tipo ? (
                <p className="text-sm text-gray-600">
                  Tipo: {treinoAtual.tipo}
                </p>
              ) : null}

              <p className="text-sm text-gray-600">
                Personal: {treinoAtual.personal_nome || "-"}
              </p>

              {treinoAtual.objetivo ? (
                <p className="text-sm text-gray-600">
                  Objetivo: {treinoAtual.objetivo}
                </p>
              ) : null}

              <p className="text-xs text-gray-500 mt-1">
                Atualizado em: {formatData(treinoAtual.created_at)}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {resumoTreinoAtual.feitosCount} de {resumoTreinoAtual.total} exercícios concluídos
                </span>
                <span className="font-semibold text-gray-900">
                  {resumoTreinoAtual.progresso}%
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${resumoTreinoAtual.progresso}%` }}
                />
              </div>
            </div>

            {resumoTreinoAtual.total > 0 &&
            resumoTreinoAtual.feitosCount === resumoTreinoAtual.total ? (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-green-700 text-sm font-semibold">
                <CheckCircle2 size={16} />
                Treino concluído
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="bg-white p-5 rounded-2xl shadow space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900">Última avaliação</h2>

          {ultimaAvaliacao ? (
            <button
              onClick={() => router.push("/app-aluno/avaliacoes")}
              className="text-sm font-semibold text-black"
            >
              Ver avaliações
            </button>
          ) : null}
        </div>

        {!ultimaAvaliacao ? (
          <p className="text-sm text-gray-500">Nenhuma avaliação encontrada.</p>
        ) : (
          <>
            <p className="text-sm text-gray-600">
              Data: {formatData(ultimaAvaliacao.data_avaliacao)}
            </p>
            <p className="text-sm text-gray-600">
              Peso: {ultimaAvaliacao.peso || 0} kg
            </p>
            <p className="text-sm text-gray-600">
              Gordura: {ultimaAvaliacao.percentual_gordura || 0}%
            </p>
            <p className="text-sm text-gray-600">
              IMC: {calcularIMC(ultimaAvaliacao.peso, ultimaAvaliacao.altura)}
            </p>
          </>
        )}
      </section>

      <section className="bg-white p-5 rounded-2xl shadow space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold text-gray-900">Mensalidade</h2>

          {mensalidadeEmAberto ? (
            <button
              onClick={() => router.push("/app-aluno/financeiro")}
              className="text-sm font-semibold text-black"
            >
              Ver financeiro
            </button>
          ) : null}
        </div>

        {!mensalidadeEmAberto ? (
          <p className="text-sm text-gray-500">
            Nenhuma mensalidade em aberto.
          </p>
        ) : (
          <>
            <p className="font-semibold text-gray-900">
              Competência: {mensalidadeEmAberto.competencia}
            </p>
            <p className="text-sm text-gray-600">
              Vencimento: {formatData(mensalidadeEmAberto.vencimento)}
            </p>
            <p className="text-sm text-gray-600">
              Valor: {formatBRL(mensalidadeEmAberto.valor)}
            </p>
            <p className="text-sm text-yellow-600 font-semibold">
              Status: {mensalidadeEmAberto.status}
            </p>
          </>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <CardAtalho
          titulo="Treinos"
          icon={Dumbbell}
          onClick={() => router.push("/app-aluno/treinos")}
        />

        <CardAtalho
          titulo="Avaliações"
          icon={Activity}
          onClick={() => router.push("/app-aluno/avaliacoes")}
        />

        <CardAtalho
          titulo="Financeiro"
          icon={CreditCard}
          onClick={() => router.push("/app-aluno/financeiro")}
        />

        <CardAtalho
          titulo="Carteirinha"
          icon={IdCard}
          onClick={() => router.push("/app-aluno/carteirinha")}
        />
      </section>
    </div>
  );
}