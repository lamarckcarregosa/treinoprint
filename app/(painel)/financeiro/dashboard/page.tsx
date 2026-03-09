"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

type DashboardFinanceiro = {
  resumo: {
    receitaTotal: number;
    despesasTotal: number;
    saldo: number;
    emAberto: number;
    inadimplencia: number;
    totalPagamentos: number;
    totalDespesas: number;
    receitaMesAtual?: number;
    receitaMesAnterior?: number;
    despesasMesAtual?: number;
    despesasMesAnterior?: number;
  };
  formasPagamento: {
    pix: number;
    cartao: number;
    dinheiro: number;
    boleto: number;
  };
  mensal: {
    mes: string;
    receita: number;
    despesa: number;
    saldo: number;
  }[];
  categoriasDespesas: {
    categoria: string;
    valor: number;
  }[];
  topAlunos: {
    aluno_nome: string;
    valor: number;
  }[];
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

function variacaoPercentual(atual: number, anterior: number) {
  if (!anterior && !atual) return 0;
  if (!anterior) return 100;
  return ((atual - anterior) / anterior) * 100;
}

function BadgeVariacao({
  atual,
  anterior,
  invertido = false,
}: {
  atual: number;
  anterior: number;
  invertido?: boolean;
}) {
  const variacao = variacaoPercentual(atual, anterior);
  const positiva = invertido ? variacao <= 0 : variacao >= 0;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        positiva
          ? "bg-green-100 text-green-700"
          : "bg-red-100 text-red-700"
      }`}
    >
      {variacao >= 0 ? "+" : ""}
      {variacao.toFixed(1)}%
    </span>
  );
}

function CardInfo({
  titulo,
  valor,
  subtitulo,
  cor = "text-gray-900",
  extra,
}: {
  titulo: string;
  valor: string;
  subtitulo?: string;
  cor?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
          {subtitulo ? <p className="text-xs text-gray-400 mt-2">{subtitulo}</p> : null}
        </div>
        {extra ? <div>{extra}</div> : null}
      </div>
    </div>
  );
}

const CORES = ["#16a34a", "#2563eb", "#eab308", "#3f3f46", "#dc2626", "#7c3aed", "#0891b2", "#f97316"];

export default function DashboardFinanceiroPage() {
  const router = useRouter();

  const hoje = new Date();
  const primeiroDiaAno = new Date(hoje.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const hojeStr = hoje.toISOString().slice(0, 10);

  const [inicio, setInicio] = useState(primeiroDiaAno);
  const [fim, setFim] = useState(hojeStr);

  const [dados, setDados] = useState<DashboardFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregarDashboard = async () => {
    try {
      setErro("");

      const res = await apiFetch(
        `/api/financeiro/dashboard?inicio=${inicio}&fim=${fim}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar dashboard financeiro");
        return;
      }

      setDados(json);
    } catch {
      setErro("Erro ao carregar dashboard financeiro");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarDashboard();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [inicio, fim]);

  const graficoFormas = useMemo(
    () => [
      { nome: "PIX", valor: dados?.formasPagamento.pix || 0 },
      { nome: "Cartão", valor: dados?.formasPagamento.cartao || 0 },
      { nome: "Dinheiro", valor: dados?.formasPagamento.dinheiro || 0 },
      { nome: "Boleto", valor: dados?.formasPagamento.boleto || 0 },
    ],
    [dados]
  );

  const alertaFinanceiro = useMemo(() => {
    const saldo = dados?.resumo.saldo || 0;
    const inadimplencia = dados?.resumo.inadimplencia || 0;
    const emAberto = dados?.resumo.emAberto || 0;

    if (inadimplencia > 0) {
      return {
        classe: "bg-red-50 border-red-200 text-red-700",
        texto: `Atenção: inadimplência em ${formatBRL(inadimplencia)} e total em aberto de ${formatBRL(
          emAberto
        )}.`,
      };
    }

    if (saldo < 0) {
      return {
        classe: "bg-yellow-50 border-yellow-200 text-yellow-700",
        texto: `Atenção: saldo negativo no período de ${formatBRL(saldo)}.`,
      };
    }

    return {
      classe: "bg-green-50 border-green-200 text-green-700",
      texto: `Situação saudável: saldo positivo de ${formatBRL(saldo)} no período.`,
    };
  }, [dados]);

  if (loading) {
    return <p className="p-6">Carregando dashboard financeiro...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Dashboard Financeiro</h1>
          <p className="text-gray-500 mt-2">
            Visão gerencial com indicadores, gráficos e evolução financeira
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />
          <button
            onClick={() => router.push("/financeiro")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>
        </div>
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <div className={`rounded-2xl border px-4 py-3 text-sm ${alertaFinanceiro.classe}`}>
        {alertaFinanceiro.texto}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardInfo
          titulo="Receita total"
          valor={formatBRL(dados?.resumo.receitaTotal || 0)}
          cor="text-green-600"
          extra={
            <BadgeVariacao
              atual={dados?.resumo.receitaMesAtual || 0}
              anterior={dados?.resumo.receitaMesAnterior || 0}
            />
          }
          subtitulo="Comparação mês atual x anterior"
        />

        <CardInfo
          titulo="Despesas"
          valor={formatBRL(dados?.resumo.despesasTotal || 0)}
          cor="text-red-600"
          extra={
            <BadgeVariacao
              atual={dados?.resumo.despesasMesAtual || 0}
              anterior={dados?.resumo.despesasMesAnterior || 0}
              invertido
            />
          }
          subtitulo="Comparação mês atual x anterior"
        />

        <CardInfo
          titulo="Saldo"
          valor={formatBRL(dados?.resumo.saldo || 0)}
          cor={(dados?.resumo.saldo || 0) >= 0 ? "text-blue-600" : "text-red-700"}
          subtitulo="Receita menos despesas"
        />

        <CardInfo
          titulo="Em aberto"
          valor={formatBRL(dados?.resumo.emAberto || 0)}
          cor="text-yellow-600"
          subtitulo="Pagamentos pendentes no período"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardInfo
          titulo="Inadimplência"
          valor={formatBRL(dados?.resumo.inadimplencia || 0)}
          cor="text-red-700"
          subtitulo="Pagamentos vencidos e não pagos"
        />
        <CardInfo
          titulo="Pagamentos recebidos"
          valor={String(dados?.resumo.totalPagamentos || 0)}
          subtitulo="Quantidade de pagamentos pagos"
        />
        <CardInfo
          titulo="Despesas lançadas"
          valor={String(dados?.resumo.totalDespesas || 0)}
          subtitulo="Quantidade de despesas registradas"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <h2 className="font-semibold mb-4">Receita por forma de pagamento</h2>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficoFormas}
                  dataKey="valor"
                  nameKey="nome"
                  outerRadius={110}
                  label
                >
                  {graficoFormas.map((entry, index) => (
                    <Cell key={entry.nome} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatBRL(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <h2 className="font-semibold mb-4">Receita x Despesa por mês</h2>
          <div className="h-[320px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dados?.mensal || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatBRL(value)} />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="#16a34a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Evolução da receita</h2>
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dados?.mensal || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatBRL(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="receita"
                name="Receita"
                stroke="#16a34a"
                fill="#86efac"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Evolução do saldo</h2>
        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados?.mensal || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatBRL(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="#2563eb"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Top categorias de despesa</h2>
            <span className="text-sm text-gray-500">
              {dados?.categoriasDespesas.length || 0} categoria(s)
            </span>
          </div>

          {!dados?.categoriasDespesas.length ? (
            <p className="text-gray-500">Nenhuma categoria encontrada.</p>
          ) : (
            <div className="space-y-3">
              {dados.categoriasDespesas.map((item, index) => (
                <div
                  key={`${item.categoria}-${index}`}
                  className="border rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="font-semibold">{item.categoria || "Sem categoria"}</p>
                  </div>
                  <p className="font-bold text-red-600">{formatBRL(item.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Top alunos pagantes</h2>
            <span className="text-sm text-gray-500">
              {dados?.topAlunos.length || 0} aluno(s)
            </span>
          </div>

          {!dados?.topAlunos.length ? (
            <p className="text-gray-500">Nenhum pagamento encontrado.</p>
          ) : (
            <div className="space-y-3">
              {dados.topAlunos.map((item, index) => (
                <div
                  key={`${item.aluno_nome}-${index}`}
                  className="border rounded-2xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <p className="font-semibold">{item.aluno_nome}</p>
                  </div>
                  <p className="font-bold text-green-600">{formatBRL(item.valor)}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}