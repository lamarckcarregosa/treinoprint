"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDollarSign,
  CalendarDays,
  Search,
  RefreshCcw,
  Wallet,
  TrendingUp,
  TrendingDown,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { apiFetch } from "@/lib/apiFetch";

type Movimento = {
  id: string | number;
  tipo: "entrada" | "saida";
  origem: "pagamento" | "despesa";
  descricao: string;
  categoria?: string | null;
  aluno_nome?: string | null;
  valor: number;
  data: string;
  status?: string | null;
  forma_pagamento?: string | null;
};

type ResumoFluxo = {
  total_entradas: number;
  total_saidas: number;
  saldo: number;
};

type FluxoResponse = {
  resumo: ResumoFluxo;
  movimentos: Movimento[];
};

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

function CardInfo({
  titulo,
  valor,
  cor = "text-gray-900",
  subtitulo,
  icon: Icon,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  subtitulo?: string;
  icon?: any;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
          {subtitulo ? (
            <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
          ) : null}
        </div>

        {Icon ? (
          <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
            <Icon size={18} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({
  label,
  tone = "gray",
}: {
  label: string;
  tone?: "green" | "yellow" | "red" | "blue" | "gray";
}) {
  const styles = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    gray: "bg-zinc-100 text-zinc-700",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[tone]}`}>
      {label}
    </span>
  );
}

function FluxoCaixaPageContent() {
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(ultimoDiaMes);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [resumo, setResumo] = useState<ResumoFluxo>({
    total_entradas: 0,
    total_saidas: 0,
    saldo: 0,
  });
  const [movimentos, setMovimentos] = useState<Movimento[]>([]);

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroOrigem, setFiltroOrigem] = useState("todas");

  const carregar = async () => {
    try {
      setErro("");

      const res = await apiFetch(
        `/api/financeiro/fluxo-caixa?inicio=${dataInicio}&fim=${dataFim}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar fluxo de caixa");
        return;
      }

      setResumo((json as FluxoResponse).resumo || {
        total_entradas: 0,
        total_saidas: 0,
        saldo: 0,
      });

      setMovimentos(Array.isArray((json as FluxoResponse).movimentos) ? (json as FluxoResponse).movimentos : []);
    } catch {
      setErro("Erro ao carregar fluxo de caixa");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregar();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [dataInicio, dataFim]);

  const movimentosFiltrados = useMemo(() => {
    return movimentos.filter((item) => {
      const termo = busca.toLowerCase().trim();

      const matchBusca =
        !termo ||
        String(item.descricao || "").toLowerCase().includes(termo) ||
        String(item.aluno_nome || "").toLowerCase().includes(termo) ||
        String(item.categoria || "").toLowerCase().includes(termo);

      const matchTipo =
        filtroTipo === "todos" || item.tipo === filtroTipo;

      const matchOrigem =
        filtroOrigem === "todas" || item.origem === filtroOrigem;

      return matchBusca && matchTipo && matchOrigem;
    });
  }, [movimentos, busca, filtroTipo, filtroOrigem]);

  const graficoPorDia = useMemo(() => {
    const mapa = new Map<
      string,
      { data: string; entradas: number; saidas: number; saldo: number }
    >();

    for (const item of movimentosFiltrados) {
      const chave = item.data;
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          data: chave,
          entradas: 0,
          saidas: 0,
          saldo: 0,
        });
      }

      const atual = mapa.get(chave)!;

      if (item.tipo === "entrada") {
        atual.entradas += Number(item.valor || 0);
      } else {
        atual.saidas += Number(item.valor || 0);
      }

      atual.saldo = atual.entradas - atual.saidas;
    }

    return Array.from(mapa.values())
      .sort((a, b) => a.data.localeCompare(b.data))
      .map((item) => ({
        ...item,
        data_label: formatData(item.data),
      }));
  }, [movimentosFiltrados]);

  const totalEntradasFiltrado = movimentosFiltrados
    .filter((item) => item.tipo === "entrada")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalSaidasFiltrado = movimentosFiltrados
    .filter((item) => item.tipo === "saida")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const saldoFiltrado = totalEntradasFiltrado - totalSaidasFiltrado;

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando fluxo de caixa..."
      />
    );
  }

  if (erro && movimentos.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar fluxo de caixa"
        mensagem={erro || "Não foi possível carregar a página."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Painel financeiro</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Fluxo de caixa
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Acompanhe entradas, saídas e saldo do período.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[260px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-lg md:text-xl font-black mt-1">
              TreinoPrint Online
            </p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-zinc-700" />
          <h2 className="text-xl font-bold text-gray-900">Período</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border rounded-xl px-4 py-3"
          />
          <button
            onClick={carregar}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 hover:bg-zinc-50"
          >
            <RefreshCcw size={16} />
            Atualizar
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardInfo
          titulo="Entradas"
          valor={formatBRL(totalEntradasFiltrado)}
          cor="text-green-600"
          icon={ArrowUpCircle}
        />
        <CardInfo
          titulo="Saídas"
          valor={formatBRL(totalSaidasFiltrado)}
          cor="text-red-600"
          icon={ArrowDownCircle}
        />
        <CardInfo
          titulo="Saldo"
          valor={formatBRL(saldoFiltrado)}
          cor={saldoFiltrado >= 0 ? "text-blue-600" : "text-red-700"}
          icon={CircleDollarSign}
        />
        <CardInfo
          titulo="Movimentos"
          valor={String(movimentosFiltrados.length)}
          subtitulo="No período filtrado"
          icon={Wallet}
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Evolução do caixa</h2>

        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graficoPorDia}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data_label" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatBRL(Number(value))}
              />
              <Line type="monotone" dataKey="entradas" stroke="#16a34a" strokeWidth={3} />
              <Line type="monotone" dataKey="saidas" stroke="#dc2626" strokeWidth={3} />
              <Line type="monotone" dataKey="saldo" stroke="#111111" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Movimentos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Entradas e saídas do período
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar descrição, aluno ou categoria"
              className="border rounded-xl p-3 pl-10 w-full"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todos">Todos os tipos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
          </select>

          <select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todas">Todas as origens</option>
            <option value="pagamento">Pagamentos</option>
            <option value="despesa">Despesas</option>
          </select>
        </div>

        {movimentosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhum movimento encontrado.
          </div>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {movimentosFiltrados.map((item) => (
              <div
                key={`${item.origem}-${item.id}`}
                className="border rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={item.tipo === "entrada" ? "Entrada" : "Saída"}
                      tone={item.tipo === "entrada" ? "green" : "red"}
                    />
                    <StatusPill
                      label={item.origem === "pagamento" ? "Pagamento" : "Despesa"}
                      tone="blue"
                    />
                    {item.status ? (
                      <StatusPill
                        label={item.status}
                        tone={item.status === "pago" ? "green" : "yellow"}
                      />
                    ) : null}
                  </div>

                  <p className="font-bold text-gray-900">
                    {item.descricao}
                  </p>

                  {item.aluno_nome ? (
                    <p className="text-sm text-gray-600">
                      Aluno: {item.aluno_nome}
                    </p>
                  ) : null}

                  {item.categoria ? (
                    <p className="text-sm text-gray-600">
                      Categoria: {item.categoria}
                    </p>
                  ) : null}

                  {item.forma_pagamento ? (
                    <p className="text-sm text-gray-600">
                      Forma de pagamento: {item.forma_pagamento}
                    </p>
                  ) : null}

                  <p className="text-sm text-gray-500">
                    Data: {formatData(item.data)}
                  </p>
                </div>

                <div className="text-right">
                  <p
                    className={`font-black text-lg ${
                      item.tipo === "entrada" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.tipo === "entrada" ? "+" : "-"} {formatBRL(item.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function FluxoCaixaPage() {
  return (
    <ProtegePagina permissao="financeiro">
      <FluxoCaixaPageContent />
    </ProtegePagina>
  );
}