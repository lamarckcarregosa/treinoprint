"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Wallet,
  TrendingDown,
  CircleDollarSign,
  BadgeDollarSign,
  Search,
  Filter,
  Pencil,
  Trash2,
  CheckCircle2,
  Plus,
  RefreshCcw,
  FolderKanban,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { apiFetch } from "@/lib/apiFetch";

type Despesa = {
  id: number;
  descricao: string;
  categoria?: string;
  valor: number;
  data_lancamento: string;
  observacoes?: string;
  tipo?: string;
  status?: string;
  data_pagamento?: string | null;
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
          {subtitulo ? <p className="text-xs text-gray-400 mt-2">{subtitulo}</p> : null}
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

function FinanceiroDespesasPageContent() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dataLancamento, setDataLancamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tipoCadastro, setTipoCadastro] = useState("variavel");

  const [salvando, setSalvando] = useState(false);
  const [despesaEditandoId, setDespesaEditandoId] = useState<number | null>(null);
  const [salvandoDespesaId, setSalvandoDespesaId] = useState<number | null>(null);
  const [marcandoPagaId, setMarcandoPagaId] = useState<number | null>(null);

  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  async function carregar() {
    try {
      setErro("");

      const res = await apiFetch("/api/financeiro/despesas", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar despesas");
        return;
      }

      setDespesas(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar despesas");
    }
  }

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
  }, []);

  const limparFormulario = () => {
    setDescricao("");
    setCategoria("");
    setValor("");
    setDataLancamento("");
    setObservacoes("");
    setTipoCadastro("variavel");
  };

  const cadastrarDespesa = async () => {
    try {
      setErro("");

      if (!descricao.trim() || !valor || !dataLancamento) {
        setErro("Preencha descrição, valor e data");
        return;
      }

      setSalvando(true);

      const res = await apiFetch("/api/financeiro/despesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          descricao: descricao.trim(),
          categoria: categoria.trim() || null,
          valor: Number(valor),
          data_lancamento: dataLancamento,
          observacoes: observacoes.trim() || null,
          tipo: tipoCadastro,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao cadastrar despesa");
        return;
      }

      limparFormulario();
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  const atualizarCampoDespesa = (
    id: number,
    campo: keyof Despesa,
    valorCampo: string | number
  ) => {
    setDespesas((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valorCampo } : item))
    );
  };

  const atualizarDespesa = async (item: Despesa) => {
    try {
      setSalvandoDespesaId(item.id);

      const res = await apiFetch(`/api/financeiro/despesas/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao atualizar despesa");
        return;
      }

      setDespesaEditandoId(null);
      await carregar();
    } finally {
      setSalvandoDespesaId(null);
    }
  };

  const marcarDespesaComoPaga = async (id: number) => {
    try {
      setMarcandoPagaId(id);

      const res = await apiFetch(`/api/financeiro/despesas/${id}/marcar-paga`, {
        method: "POST",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao marcar despesa como paga");
        return;
      }

      await carregar();
    } finally {
      setMarcandoPagaId(null);
    }
  };

  const excluirDespesa = async (id: number) => {
    const confirmar = confirm("Excluir esta despesa?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/financeiro/despesas/${id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao excluir despesa");
      return;
    }

    await carregar();
  };

  const categorias = [
    ...new Set(
      despesas
        .map((item) => (item.categoria || "").trim())
        .filter(Boolean)
    ),
  ];

  const despesasFiltradas = useMemo(() => {
    return despesas.filter((item) => {
      const matchTexto =
        !filtroTexto ||
        item.descricao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (item.observacoes || "").toLowerCase().includes(filtroTexto.toLowerCase());

      const matchCategoria =
        !filtroCategoria ||
        (item.categoria || "").toLowerCase() === filtroCategoria.toLowerCase();

      const matchTipo =
        filtroTipo === "todos" || (item.tipo || "variavel") === filtroTipo;

      const matchStatus =
        filtroStatus === "todos" || (item.status || "pendente") === filtroStatus;

      return matchTexto && matchCategoria && matchTipo && matchStatus;
    });
  }, [despesas, filtroTexto, filtroCategoria, filtroTipo, filtroStatus]);

  const totalDespesas = despesasFiltradas.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  const totalPagas = despesasFiltradas
    .filter((item) => item.status === "pago")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const totalPendentes = despesasFiltradas
    .filter((item) => item.status !== "pago")
    .reduce((acc, item) => acc + Number(item.valor || 0), 0);

  const qtdPendentes = despesasFiltradas.filter(
    (item) => item.status !== "pago"
  ).length;

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando despesas..."
      />
    );
  }

  if (erro && despesas.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar despesas"
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
              Cadastro de despesas
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Gerencie despesas fixas e variáveis da academia.
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardInfo
          titulo="Despesas filtradas"
          valor={formatBRL(totalDespesas)}
          cor="text-red-600"
          icon={TrendingDown}
        />
        <CardInfo
          titulo="Total pago"
          valor={formatBRL(totalPagas)}
          cor="text-green-600"
          icon={CircleDollarSign}
        />
        <CardInfo
          titulo="Total pendente"
          valor={formatBRL(totalPendentes)}
          cor="text-yellow-600"
          icon={Wallet}
        />
        <CardInfo
          titulo="Qtd. pendentes"
          valor={String(qtdPendentes)}
          subtitulo="Despesas ainda não pagas"
          icon={BadgeDollarSign}
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={18} className="text-zinc-700" />
          <h2 className="text-xl font-bold text-gray-900">Nova despesa</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="border rounded-xl p-3"
          />
          <input
            placeholder="Categoria"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border rounded-xl p-3"
          />
          <input
            type="number"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="border rounded-xl p-3"
          />
          <input
            type="date"
            value={dataLancamento}
            onChange={(e) => setDataLancamento(e.target.value)}
            className="border rounded-xl p-3"
          />
          <select
            value={tipoCadastro}
            onChange={(e) => setTipoCadastro(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="variavel">Variável</option>
            <option value="fixa">Fixa</option>
          </select>
        </div>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="border rounded-xl p-3 w-full min-h-24"
        />

        {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={cadastrarDespesa}
            disabled={salvando}
            className="bg-black text-white rounded-xl px-5 py-3 disabled:opacity-60 inline-flex items-center gap-2"
          >
            <Plus size={16} />
            {salvando ? "Salvando..." : "Cadastrar despesa"}
          </button>

          <button
            onClick={limparFormulario}
            className="border rounded-xl px-5 py-3"
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Despesas lançadas</h2>
            <p className="text-sm text-gray-500 mt-1">
              Filtre e gerencie todas as despesas da academia
            </p>
          </div>

          <button
            onClick={carregar}
            className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 hover:bg-zinc-50"
          >
            <RefreshCcw size={16} />
            Atualizar lista
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar despesa"
              className="border rounded-xl p-3 pl-10 w-full"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Todas categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todos">Todos tipos</option>
            <option value="fixa">Fixa</option>
            <option value="variavel">Variável</option>
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todos">Todos status</option>
            <option value="pago">Pagas</option>
            <option value="pendente">Pendentes</option>
          </select>
        </div>

        {despesasFiltradas.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhuma despesa encontrada.
          </div>
        ) : (
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
            {despesasFiltradas.map((item) => {
              const editando = despesaEditandoId === item.id;
              const despesaPaga = item.status === "pago";

              return (
                <div key={item.id} className="border rounded-2xl p-4 space-y-4">
                  {!editando ? (
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <p className="font-bold text-gray-900">{item.descricao}</p>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <StatusPill
                            label={item.categoria || "Sem categoria"}
                            tone="blue"
                          />
                          <StatusPill
                            label={item.tipo || "variavel"}
                            tone="gray"
                          />
                          <StatusPill
                            label={despesaPaga ? "Paga" : "Pendente"}
                            tone={despesaPaga ? "green" : "yellow"}
                          />
                        </div>

                        <p className="text-sm text-gray-600">
                          Data lançamento: {formatData(item.data_lancamento)}
                        </p>
                        <p className="text-sm text-gray-600">
                          Valor: {formatBRL(item.valor)}
                        </p>

                        {item.data_pagamento ? (
                          <p className="text-sm text-green-600">
                            Pago em: {formatData(item.data_pagamento)}
                          </p>
                        ) : null}

                        {item.observacoes ? (
                          <p className="text-sm text-gray-500 break-words">
                            Observações: {item.observacoes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setDespesaEditandoId(item.id)}
                          className="bg-black text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
                        >
                          <Pencil size={15} />
                          Editar
                        </button>

                        {!despesaPaga ? (
                          <button
                            onClick={() => marcarDespesaComoPaga(item.id)}
                            disabled={marcandoPagaId === item.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl disabled:opacity-60 inline-flex items-center gap-2"
                          >
                            <CheckCircle2 size={15} />
                            {marcandoPagaId === item.id
                              ? "Marcando..."
                              : "Marcar como paga"}
                          </button>
                        ) : null}

                        <button
                          onClick={() => excluirDespesa(item.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
                        >
                          <Trash2 size={15} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                          value={item.descricao}
                          onChange={(e) =>
                            atualizarCampoDespesa(item.id, "descricao", e.target.value)
                          }
                          className="border rounded-xl p-2"
                          placeholder="Descrição"
                        />

                        <input
                          value={item.categoria || ""}
                          onChange={(e) =>
                            atualizarCampoDespesa(item.id, "categoria", e.target.value)
                          }
                          className="border rounded-xl p-2"
                          placeholder="Categoria"
                        />

                        <input
                          type="number"
                          step="0.01"
                          value={item.valor}
                          onChange={(e) =>
                            atualizarCampoDespesa(item.id, "valor", Number(e.target.value))
                          }
                          className="border rounded-xl p-2"
                          placeholder="Valor"
                        />

                        <input
                          type="date"
                          value={item.data_lancamento}
                          onChange={(e) =>
                            atualizarCampoDespesa(item.id, "data_lancamento", e.target.value)
                          }
                          className="border rounded-xl p-2"
                        />

                        <select
                          value={item.tipo || "variavel"}
                          onChange={(e) =>
                            atualizarCampoDespesa(item.id, "tipo", e.target.value)
                          }
                          className="border rounded-xl p-2"
                        >
                          <option value="variavel">Variável</option>
                          <option value="fixa">Fixa</option>
                        </select>
                      </div>

                      <textarea
                        value={item.observacoes || ""}
                        onChange={(e) =>
                          atualizarCampoDespesa(item.id, "observacoes", e.target.value)
                        }
                        className="border rounded-xl p-2 w-full min-h-20"
                        placeholder="Observações"
                      />

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => atualizarDespesa(item)}
                          disabled={salvandoDespesaId === item.id}
                          className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-60"
                        >
                          {salvandoDespesaId === item.id
                            ? "Salvando..."
                            : "Salvar alterações"}
                        </button>

                        <button
                          onClick={() => setDespesaEditandoId(null)}
                          className="border px-4 py-2 rounded-xl"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function FinanceiroDespesasPage() {
  return (
    <ProtegePagina permissao="financeiro">
      <FinanceiroDespesasPageContent />
    </ProtegePagina>
  );
}