"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PixPayload } from "pix-payload";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, ArrowRight } from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { apiFetch } from "@/lib/apiFetch";

type Resumo = {
  receitaMes: number;
  emAberto: number;
  despesasMes: number;
  inadimplencia: number;
  saldo: number;
  totalInadimplentes: number;
};

type InadimplenteAgrupado = {
  aluno_id: number;
  aluno_nome: string;
  telefone?: string;
  total_em_aberto: number;
  qtd_parcelas: number;
  maior_dias_atraso: number;
  itens: {
    id: number;
    competencia: string;
    valor: number;
    vencimento: string;
    dias_atraso: number;
  }[];
};

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

type Pagamento = {
  id: number;
  aluno_id: number;
  aluno_nome: string;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status: string;
  forma_pagamento?: string | null;
};

function formatBRL(valor: number | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CardInfo({
  titulo,
  valor,
  cor = "text-gray-900",
  subtitulo,
}: {
  titulo: string;
  valor: string;
  cor?: string;
  subtitulo?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
      {subtitulo ? <p className="text-xs text-gray-400 mt-2">{subtitulo}</p> : null}
    </div>
  );
}

function QuickCard({
  title,
  description,
  onClick,
  disabled = false,
}: {
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group w-full text-left rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-sm hover:shadow-md transition disabled:opacity-60"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm text-zinc-900">{title}</p>
          <p className="text-xs text-zinc-500 mt-1">{description}</p>
        </div>
        <ArrowRight size={16} className="text-zinc-400 transition group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function FinanceiroPageContent() {
  const router = useRouter();

  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(ultimoDiaMes);

  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [inadimplentes, setInadimplentes] = useState<InadimplenteAgrupado[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const [despesaEditandoId, setDespesaEditandoId] = useState<number | null>(null);
  const [salvandoDespesaId, setSalvandoDespesaId] = useState<number | null>(null);
  const [marcandoPagaId, setMarcandoPagaId] = useState<number | null>(null);

  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dataLancamento, setDataLancamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [competencia, setCompetencia] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [statusFiltro, setStatusFiltro] = useState("pendente");

  const [filtroDespesaTexto, setFiltroDespesaTexto] = useState("");
  const [filtroDespesaCategoria, setFiltroDespesaCategoria] = useState("");
  const [filtroDespesaTipo, setFiltroDespesaTipo] = useState("todos");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [gerandoMensalidades, setGerandoMensalidades] = useState(false);
  const [gerandoDespesasFixas, setGerandoDespesasFixas] = useState(false);
  const [gerandoTudoLoading, setGerandoTudoLoading] = useState(false);
  const [erro, setErro] = useState("");

  const [pagamentoSelecionado, setPagamentoSelecionado] = useState<Pagamento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  const [pixQrCode, setPixQrCode] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [gerandoPix, setGerandoPix] = useState(false);

  const carregarTudo = async () => {
    try {
      setErro("");

      const [resResumo, resInadimplentes, resDespesas, resPagamentos] =
        await Promise.all([
          apiFetch(`/api/financeiro/resumo?inicio=${dataInicio}&fim=${dataFim}`, {
            cache: "no-store",
          }),
          apiFetch("/api/financeiro/inadimplentes", { cache: "no-store" }),
          apiFetch("/api/financeiro/despesas", { cache: "no-store" }),
          apiFetch(
            `/api/financeiro/pagamentos?status=${statusFiltro}&competencia=${competencia}`,
            { cache: "no-store" }
          ),
        ]);

      const jsonResumo = await resResumo.json().catch(() => ({}));
      const jsonInadimplentes = await resInadimplentes.json().catch(() => []);
      const jsonDespesas = await resDespesas.json().catch(() => []);
      const jsonPagamentos = await resPagamentos.json().catch(() => []);

      if (!resResumo.ok) {
        setErro((jsonResumo as any).error || "Erro ao carregar resumo");
        return;
      }

      if (!resInadimplentes.ok) {
        setErro((jsonInadimplentes as any).error || "Erro ao carregar inadimplência");
        return;
      }

      if (!resDespesas.ok) {
        setErro((jsonDespesas as any).error || "Erro ao carregar despesas");
        return;
      }

      if (!resPagamentos.ok) {
        setErro((jsonPagamentos as any).error || "Erro ao carregar pagamentos");
        return;
      }

      setResumo(jsonResumo as Resumo);
      setInadimplentes(Array.isArray(jsonInadimplentes) ? jsonInadimplentes : []);
      setDespesas(Array.isArray(jsonDespesas) ? jsonDespesas : []);
      setPagamentos(Array.isArray(jsonPagamentos) ? jsonPagamentos : []);
    } catch {
      setErro("Erro ao carregar financeiro");
    }
  };

  const gerarPix = async (valor: number) => {
    try {
      setGerandoPix(true);

      const pix = new PixPayload({
        pixKey: "79996320601",
        merchantName: "TREINOPRINT",
        merchantCity: "POCO VERDE",
        amount: valor.toFixed(2),
        message: "Mensalidade Academia",
      });

      const payload = pix.getPayload();
      const qr = await QRCode.toDataURL(payload);

      setPixQrCode(qr);
      setPixCopiaECola(payload);
    } finally {
      setGerandoPix(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarTudo();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [statusFiltro, competencia, dataInicio, dataFim]);

  const cadastrarDespesa = async () => {
    try {
      setErro("");

      if (!descricao || !valor || !dataLancamento) {
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
          descricao,
          categoria,
          valor: Number(valor),
          data_lancamento: dataLancamento,
          observacoes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao cadastrar despesa");
        return;
      }

      setDescricao("");
      setCategoria("");
      setValor("");
      setDataLancamento("");
      setObservacoes("");

      await carregarTudo();
    } finally {
      setSalvando(false);
    }
  };

  const confirmarPagamento = async () => {
    if (!pagamentoSelecionado) return;

    try {
      setSalvandoPagamento(true);

      const res = await apiFetch(
        `/api/financeiro/pagamentos/${pagamentoSelecionado.id}/marcar-pago`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            forma_pagamento: formaPagamento,
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao registrar pagamento");
        return;
      }

      setPagamentoSelecionado(null);
      setFormaPagamento("pix");
      setPixQrCode("");
      setPixCopiaECola("");
      await carregarTudo();
    } finally {
      setSalvandoPagamento(false);
    }
  };

  const estornarPagamento = async (id: number) => {
    const confirmar = confirm("Estornar este pagamento?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/financeiro/pagamentos/${id}/estornar`, {
      method: "POST",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao estornar pagamento");
      return;
    }

    await carregarTudo();
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
      alert("Despesa atualizada com sucesso");
      await carregarTudo();
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

      await carregarTudo();
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

    await carregarTudo();
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

  const gerarMensalidades = async () => {
    try {
      setErro("");
      setGerandoMensalidades(true);

      const res = await apiFetch("/api/financeiro/gerar-mensalidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competencia }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao gerar mensalidades");
        return;
      }

      alert(`Mensalidades geradas: ${(json as any).total || 0}`);
      await carregarTudo();
    } finally {
      setGerandoMensalidades(false);
    }
  };

  const gerarDespesasFixas = async () => {
    try {
      setErro("");
      setGerandoDespesasFixas(true);

      const res = await apiFetch("/api/financeiro/gerar-despesas-fixas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competencia }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao gerar despesas fixas");
        return;
      }

      alert(`Despesas fixas geradas: ${(json as any).total || 0}`);
      await carregarTudo();
    } finally {
      setGerandoDespesasFixas(false);
    }
  };

  const gerarTudo = async () => {
    try {
      setErro("");
      setGerandoTudoLoading(true);

      const res = await apiFetch("/api/financeiro/gerar-tudo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ competencia }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao gerar tudo");
        return;
      }

      alert(
        `Mensalidades geradas: ${(json as any).mensalidades_geradas || 0}\nDespesas fixas geradas: ${(json as any).despesas_fixas_geradas || 0}`
      );
      await carregarTudo();
    } finally {
      setGerandoTudoLoading(false);
    }
  };

  const exportarExcel = async () => {
    const academiaId = localStorage.getItem("treinoprint_academia_id");

    const res = await fetch(
      `/api/financeiro/exportar-excel?inicio=${dataInicio}&fim=${dataFim}`,
      {
        headers: {
          "x-academia-id": academiaId || "",
        },
      }
    );

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert((json as any).error || "Erro ao exportar Excel");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "financeiro.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);
  };

  const exportarPDF = () => {
    const url = `/financeiro/relatorio?inicio=${dataInicio}&fim=${dataFim}`;
    window.open(url, "_blank");
  };

  const abrirComprovante = (id: number) => {
    window.open(`/financeiro/comprovante/${id}`, "_blank");
  };

  const cobrarWhatsApp = (
    nome: string,
    valorTotal: number,
    competenciaRef: string,
    telefone?: string
  ) => {
    if (!telefone) {
      alert("Aluno sem telefone cadastrado");
      return;
    }

    const telefoneLimpo = telefone.replace(/\D/g, "");
    const msg = `Olá, ${nome}. Identificamos mensalidade em aberto referente a ${competenciaRef}, no valor de ${formatBRL(
      valorTotal
    )}. Favor verificar o pagamento.`;

    const url = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const graficoFinanceiro = useMemo(
    () => [
      { nome: "Receita", valor: resumo?.receitaMes || 0 },
      { nome: "Despesas", valor: resumo?.despesasMes || 0 },
      { nome: "Em aberto", valor: resumo?.emAberto || 0 },
    ],
    [resumo]
  );

  const totalParcelasAtrasadas = inadimplentes.reduce(
    (acc, item) => acc + item.qtd_parcelas,
    0
  );

  const maiorAtrasoDias = inadimplentes.reduce(
    (acc, item) => Math.max(acc, item.maior_dias_atraso),
    0
  );

  const categoriasDespesas = [
    ...new Set(
      despesas
        .map((d) => (d.categoria || "").trim())
        .filter(Boolean)
    ),
  ];

  const despesasFiltradas = despesas.filter((item) => {
    const matchTexto =
      !filtroDespesaTexto ||
      item.descricao.toLowerCase().includes(filtroDespesaTexto.toLowerCase()) ||
      (item.observacoes || "").toLowerCase().includes(filtroDespesaTexto.toLowerCase());

    const matchCategoria =
      !filtroDespesaCategoria ||
      (item.categoria || "").toLowerCase() === filtroDespesaCategoria.toLowerCase();

    const tipoItem = item.tipo || "variavel";
    const matchTipo =
      filtroDespesaTipo === "todos" || tipoItem === filtroDespesaTipo;

    return matchTexto && matchCategoria && matchTipo;
  });

  const alertaTop =
    (resumo?.inadimplencia || 0) > 0
      ? `Atenção: ${inadimplentes.length} aluno(s) inadimplente(s), ${totalParcelasAtrasadas} parcela(s) atrasada(s), total em aberto de ${formatBRL(
          resumo?.inadimplencia || 0
        )}.`
      : "Nenhuma inadimplência no momento.";

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando financeiro..."
      />
    );
  }

  if (erro && !resumo && inadimplentes.length === 0 && despesas.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar financeiro"
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
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Bem-vindo ao Financeiro
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Controle inadimplência, pagamentos, despesas e mensalidades da academia.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Acessos rápidos</h2>
          <p className="text-sm text-gray-500 mt-1">
            Atalhos rápidos do módulo financeiro
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
          <QuickCard
            title={gerandoTudoLoading ? "Gerando..." : "Gerar tudo"}
            description="Gera mensalidades e despesas fixas"
            onClick={gerarTudo}
            disabled={gerandoTudoLoading}
          />

          <QuickCard
            title="Fluxo de caixa"
            description="Entradas e saídas do período"
            onClick={() => router.push("/financeiro/fluxo-caixa")}
          />

          <QuickCard
            title="Cadastro de despesas"
            description="Gerencie despesas fixas e variáveis"
            onClick={() => router.push("/financeiro/despesas")}
          />

          <QuickCard
            title="Mensalidades dos alunos"
            description="Consulta e controle das cobranças"
            onClick={() => router.push("/financeiro/alunos")}
          />

          <QuickCard
            title="Dashboard financeiro"
            description="Indicadores e visão geral"
            onClick={() => router.push("/financeiro/dashboard")}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
          onClick={exportarExcel}
          className="bg-emerald-700 text-white px-5 py-3 rounded-xl"
        >
          Exportar Excel
        </button>
        <button
          onClick={exportarPDF}
          className="bg-red-600 text-white px-5 py-3 rounded-xl"
        >
          Exportar PDF
        </button>
      </div>

      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          (resumo?.inadimplencia || 0) > 0
            ? "bg-red-50 border-red-200 text-red-700"
            : "bg-green-50 border-green-200 text-green-700"
        }`}
      >
        {alertaTop}
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <CardInfo
          titulo="Receita do período"
          valor={formatBRL(resumo?.receitaMes || 0)}
          cor="text-green-600"
        />
        <CardInfo
          titulo="Em aberto"
          valor={formatBRL(resumo?.emAberto || 0)}
          cor="text-yellow-600"
        />
        <CardInfo
          titulo="Despesas"
          valor={formatBRL(resumo?.despesasMes || 0)}
          cor="text-red-600"
        />
        <CardInfo
          titulo="Saldo"
          valor={formatBRL(resumo?.saldo || 0)}
          cor={(resumo?.saldo || 0) >= 0 ? "text-blue-600" : "text-red-700"}
        />
        <CardInfo
          titulo="Alunos inadimplentes"
          valor={String(inadimplentes.length)}
          subtitulo="Quantidade de alunos"
        />
        <CardInfo
          titulo="Maior atraso"
          valor={`${maiorAtrasoDias} dias`}
          subtitulo="Maior atraso encontrado"
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Visão financeira</h2>

        <div className="h-[320px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={graficoFinanceiro}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatBRL(Number(value))} />
              <Line type="monotone" dataKey="valor" stroke="#111" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-2xl shadow p-6 space-y-4 border border-black/5">
          <h2 className="font-semibold">Gerar mensalidades</h2>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="border rounded-xl p-3"
            />

            <button
              onClick={gerarMensalidades}
              disabled={gerandoMensalidades}
              className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60"
            >
              {gerandoMensalidades ? "Gerando..." : "Gerar mensalidades"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow p-6 space-y-4 border border-black/5">
          <h2 className="font-semibold">Gerar despesas fixas</h2>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
              className="border rounded-xl p-3"
            />

            <button
              onClick={gerarDespesasFixas}
              disabled={gerandoDespesasFixas}
              className="bg-zinc-800 text-white rounded-xl px-5 py-3 disabled:opacity-60"
            >
              {gerandoDespesasFixas ? "Gerando..." : "Gerar despesas fixas"}
            </button>
          </div>
        </section>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-semibold">Inadimplência por aluno</h2>
          <span className="text-sm text-gray-500">
            {inadimplentes.length} aluno(s) com atraso
          </span>
        </div>

        {inadimplentes.length === 0 ? (
          <p className="text-gray-500">Nenhum aluno inadimplente.</p>
        ) : (
          <div className="space-y-4">
            {inadimplentes.map((item) => (
              <div key={item.aluno_id} className="border rounded-2xl p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.aluno_nome}</p>
                    <p className="text-sm text-gray-500">
                      {item.qtd_parcelas} parcela(s) em atraso • maior atraso de{" "}
                      {item.maior_dias_atraso} dias
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-red-600 font-semibold">
                      Total em aberto: {formatBRL(item.total_em_aberto)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {item.itens.map((parcela) => (
                    <div
                      key={parcela.id}
                      className="rounded-xl border px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          Competência: {parcela.competencia}
                        </p>
                        <p className="text-sm text-gray-500">
                          Vencimento: {parcela.vencimento} • {parcela.dias_atraso} dias de atraso
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-red-600">
                          {formatBRL(parcela.valor)}
                        </span>
                        <button
                          onClick={async () => {
                            setPagamentoSelecionado({
                              id: parcela.id,
                              aluno_id: item.aluno_id,
                              aluno_nome: item.aluno_nome,
                              competencia: parcela.competencia,
                              valor: parcela.valor,
                              vencimento: parcela.vencimento,
                              status: "pendente",
                            });
                            setFormaPagamento("pix");
                            await gerarPix(parcela.valor);
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2"
                        >
                          Receber pagamento
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2">
                    <button
                      onClick={() =>
                        cobrarWhatsApp(
                          item.aluno_nome,
                          item.total_em_aberto,
                          item.itens[0]?.competencia || "",
                          item.telefone
                        )
                      }
                      className="bg-green-700 hover:bg-green-800 text-white rounded-xl px-4 py-2"
                    >
                      Cobrar no WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
          <h2 className="font-semibold">Despesas lançadas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full xl:w-auto">
            <input
              value={filtroDespesaTexto}
              onChange={(e) => setFiltroDespesaTexto(e.target.value)}
              placeholder="Buscar despesa"
              className="border rounded-xl p-3"
            />

            <select
              value={filtroDespesaCategoria}
              onChange={(e) => setFiltroDespesaCategoria(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="">Todas categorias</option>
              {categoriasDespesas.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={filtroDespesaTipo}
              onChange={(e) => setFiltroDespesaTipo(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="todos">Todos tipos</option>
              <option value="fixa">Fixa</option>
              <option value="variavel">Variável</option>
            </select>
          </div>
        </div>

        {despesasFiltradas.length === 0 ? (
          <p className="text-gray-500">Nenhuma despesa encontrada.</p>
        ) : (
          <div className="space-y-3">
            {despesasFiltradas.map((item) => {
              const editando = despesaEditandoId === item.id;
              const despesaPaga = item.status === "pago";

              return (
                <div key={item.id} className="border rounded-2xl p-4 space-y-4">
                  {!editando ? (
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-900">{item.descricao}</p>
                        <p className="text-sm text-gray-600">
                          Categoria: {item.categoria || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Tipo: {item.tipo || "variavel"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Data lançamento: {item.data_lancamento || "-"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Valor: {formatBRL(item.valor)}
                        </p>
                        <p className="text-sm">
                          Status:{" "}
                          <span
                            className={
                              despesaPaga
                                ? "text-green-600 font-semibold"
                                : "text-yellow-600 font-semibold"
                            }
                          >
                            {despesaPaga ? "Paga" : "Pendente"}
                          </span>
                        </p>
                        {item.data_pagamento ? (
                          <p className="text-sm text-green-600">
                            Pago em: {item.data_pagamento}
                          </p>
                        ) : null}
                        {item.observacoes ? (
                          <p className="text-sm text-gray-500">
                            Observações: {item.observacoes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => setDespesaEditandoId(item.id)}
                          className="bg-black text-white px-4 py-2 rounded-xl"
                        >
                          Editar
                        </button>

                        {!despesaPaga ? (
                          <button
                            onClick={() => marcarDespesaComoPaga(item.id)}
                            disabled={marcandoPagaId === item.id}
                            className="bg-green-600 text-white px-4 py-2 rounded-xl disabled:opacity-60"
                          >
                            {marcandoPagaId === item.id
                              ? "Marcando..."
                              : "Marcar como paga"}
                          </button>
                        ) : null}

                        <button
                          onClick={() => excluirDespesa(item.id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-xl"
                        >
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

      {pagamentoSelecionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-xl font-bold text-center">
              Registrar pagamento
            </h2>

            <div className="text-sm text-gray-600 text-center">
              <p className="font-semibold">{pagamentoSelecionado.aluno_nome}</p>
              <p>Competência: {pagamentoSelecionado.competencia}</p>
              <p className="text-lg font-bold mt-2">
                {formatBRL(pagamentoSelecionado.valor)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  setFormaPagamento("pix");
                  await gerarPix(pagamentoSelecionado.valor);
                }}
                className={`rounded-xl py-3 border font-medium ${
                  formaPagamento === "pix"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white"
                }`}
              >
                PIX
              </button>

              <button
                onClick={() => setFormaPagamento("cartao")}
                className={`rounded-xl py-3 border font-medium ${
                  formaPagamento === "cartao"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white"
                }`}
              >
                Cartão
              </button>

              <button
                onClick={() => setFormaPagamento("dinheiro")}
                className={`rounded-xl py-3 border font-medium ${
                  formaPagamento === "dinheiro"
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white"
                }`}
              >
                Dinheiro
              </button>

              <button
                onClick={() => setFormaPagamento("boleto")}
                className={`rounded-xl py-3 border font-medium ${
                  formaPagamento === "boleto"
                    ? "bg-gray-800 text-white border-gray-800"
                    : "bg-white"
                }`}
              >
                Boleto
              </button>
            </div>

            {formaPagamento === "pix" ? (
              <div className="space-y-3 border rounded-2xl p-4 bg-gray-50">
                <p className="text-sm font-semibold text-center">
                  Pagamento via PIX
                </p>

                {gerandoPix ? (
                  <p className="text-sm text-gray-500 text-center">
                    Gerando QR Code...
                  </p>
                ) : pixQrCode ? (
                  <>
                    <div className="flex justify-center">
                      <img
                        src={pixQrCode}
                        alt="QR Code Pix"
                        className="w-52 h-52"
                      />
                    </div>

                    <textarea
                      value={pixCopiaECola}
                      readOnly
                      className="w-full border rounded-xl p-3 text-sm min-h-28"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(pixCopiaECola);
                        alert("Código PIX copiado");
                      }}
                      className="w-full border rounded-xl py-3"
                    >
                      Copiar código PIX
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="flex gap-3">
              <button
                onClick={confirmarPagamento}
                disabled={salvandoPagamento}
                className="flex-1 bg-black text-white rounded-xl py-3 disabled:opacity-60"
              >
                {salvandoPagamento ? "Salvando..." : "Confirmar pagamento"}
              </button>

              <button
                onClick={() => {
                  setPagamentoSelecionado(null);
                  setFormaPagamento("pix");
                  setPixQrCode("");
                  setPixCopiaECola("");
                }}
                className="flex-1 border rounded-xl py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <ProtegePagina permissao="financeiro">
      <FinanceiroPageContent />
    </ProtegePagina>
  );
}