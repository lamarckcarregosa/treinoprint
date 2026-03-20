"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import ProtegePagina from "@/components/ProtegePagina";
import {
  Activity,
  Wallet,
  Link2,
  Receipt,
  RotateCcw,
  Copy,
  QrCode,
  CreditCard,
  Banknote,
  CircleDollarSign,
  MessageCircle,
  Download,
  Send,
  ArrowLeft,
} from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { apiFetch } from "@/lib/apiFetch";
import { useRouter } from "next/navigation";

type Pagamento = {
  id: number;
  aluno_id: number;
  aluno_nome: string;
  aluno_telefone?: string | null;
  aluno_cpf?: string | null;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status: string;
  forma_pagamento?: string | null;
  gateway?: string | null;
  gateway_status?: string | null;
  link_pagamento?: string | null;
};

type ConfigPixAcademia = {
  chave_pix: string;
  tipo_chave_pix: string;
  nome_recebedor_pix: string;
  cidade_pix: string;
  descricao_pix: string;
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

function labelFormaPagamento(forma?: string | null) {
  const valor = String(forma || "").trim();

  const mapa: Record<string, string> = {
    pix: "Pix",
    cartao: "Cartão",
    dinheiro: "Dinheiro",
    boleto: "Boleto",
    cartao_maquina: "Cartão máquina",
    pix_manual: "Pix manual",
    mercado_pago: "Mercado Pago",
    mercado_pago_pix: "Mercado Pago Pix",
    mercado_pago_cartao: "Mercado Pago Cartão",
    mercado_pago_boleto: "Mercado Pago Boleto",
  };

  return mapa[valor] || valor || "-";
}

function removerAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function somenteNumeros(valor?: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarChavePix(chave: string, tipo?: string | null) {
  const valor = String(chave || "").trim();
  const tipoNormalizado = String(tipo || "").trim().toLowerCase();

  if (
    tipoNormalizado === "cpf" ||
    tipoNormalizado === "cnpj" ||
    tipoNormalizado === "telefone"
  ) {
    return somenteNumeros(valor);
  }

  return valor;
}

function emv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16CCITT(str: string) {
  let crc = 0xffff;

  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;

    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function montarPayloadPixEstatico(params: {
  chavePix: string;
  tipoChavePix?: string | null;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  descricao?: string;
}) {
  const chavePix = normalizarChavePix(params.chavePix, params.tipoChavePix);

  const nomeRecebedor = removerAcentos(
    String(params.nomeRecebedor || "").trim().toUpperCase()
  ).slice(0, 25);

  const cidade = removerAcentos(
    String(params.cidade || "").trim().toUpperCase()
  ).slice(0, 15);

  const valorFormatado = Number(params.valor || 0).toFixed(2);

  const descricao = removerAcentos(
    String(params.descricao || "").trim()
  ).slice(0, 50);

  const merchantAccountInfo =
    emv("00", "BR.GOV.BCB.PIX") +
    emv("01", chavePix) +
    (descricao ? emv("02", descricao) : "");

  const additionalDataField = emv("05", "***");

  const payloadSemCRC =
    emv("00", "01") +
    emv("26", merchantAccountInfo) +
    emv("52", "0000") +
    emv("53", "986") +
    emv("54", valorFormatado) +
    emv("58", "BR") +
    emv("59", nomeRecebedor) +
    emv("60", cidade) +
    emv("62", additionalDataField) +
    "6304";

  const crc = crc16CCITT(payloadSemCRC);

  return payloadSemCRC + crc;
}

function getStatusVisual(item: Pagamento) {
  if (item.status === "pago") {
    return {
      label: "Pago",
      className: "bg-green-100 text-green-700",
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${item.vencimento}T00:00:00`);

  if (!Number.isNaN(vencimento.getTime()) && vencimento < hoje) {
    return {
      label: "Vencido",
      className: "bg-red-100 text-red-700",
    };
  }

  return {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-700",
  };
}

function isVencido(item: Pagamento) {
  if (item.status === "pago") return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const vencimento = new Date(`${item.vencimento}T00:00:00`);

  return !Number.isNaN(vencimento.getTime()) && vencimento < hoje;
}

function escapeCsv(valor: unknown) {
  const texto = String(valor ?? "");
  if (texto.includes(",") || texto.includes('"') || texto.includes("\n")) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

function PagamentosPageContent() {
  const router = useRouter();

  const hoje = new Date();
  const competenciaAtual = hoje.toISOString().slice(0, 7);

  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id") || ""
      : "";

  const [configPix, setConfigPix] = useState<ConfigPixAcademia>({
    chave_pix: "",
    tipo_chave_pix: "",
    nome_recebedor_pix: "",
    cidade_pix: "",
    descricao_pix: "Mensalidade",
  });

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [statusFiltro, setStatusFiltro] = useState("pendente");
  const [busca, setBusca] = useState("");
  const [somenteVencidos, setSomenteVencidos] = useState(false);
  const [formaFiltro, setFormaFiltro] = useState("");
  const [gatewayFiltro, setGatewayFiltro] = useState("");

  const [pagamentoSelecionado, setPagamentoSelecionado] =
    useState<Pagamento | null>(null);

  const [formaPagamento, setFormaPagamento] = useState("pix_manual");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  const [pixQrCode, setPixQrCode] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [gerandoPix, setGerandoPix] = useState(false);

  const [gerandoCobrancaId, setGerandoCobrancaId] = useState<number | null>(
    null
  );
  const [gerandoCobrancasMes, setGerandoCobrancasMes] = useState(false);
  const [gerandoLinksLote, setGerandoLinksLote] = useState(false);

  const carregarConfigAcademia = async () => {
    const res = await apiFetch("/api/minha-academia", { cache: "no-store" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar academia");
    }

    setConfigPix({
      chave_pix: (json as any).chave_pix || "",
      tipo_chave_pix: (json as any).tipo_chave_pix || "",
      nome_recebedor_pix:
        (json as any).nome_recebedor_pix || (json as any).nome || "",
      cidade_pix: (json as any).cidade_pix || "",
      descricao_pix: (json as any).descricao_pix || "Mensalidade",
    });
  };

  const carregarPagamentos = async () => {
    try {
      setErro("");

      const res = await apiFetch(
        `/api/financeiro/pagamentos?status=${statusFiltro}&competencia=${competencia}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar pagamentos");
        return;
      }

      setPagamentos(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar pagamentos");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await Promise.all([carregarPagamentos(), carregarConfigAcademia()]);
      } catch (error: any) {
        setErro(error?.message || "Erro ao carregar pagamentos");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [competencia, statusFiltro]);

  const gerarPixPayload = async (item: Pagamento) => {
    try {
      setGerandoPix(true);

      if (!configPix.chave_pix) {
        alert("A academia não possui chave PIX cadastrada nas configurações.");
        return;
      }

      if (!configPix.nome_recebedor_pix) {
        alert("Informe o nome do recebedor PIX nas configurações da academia.");
        return;
      }

      if (!configPix.cidade_pix) {
        alert("Informe a cidade PIX nas configurações da academia.");
        return;
      }

      const payload = montarPayloadPixEstatico({
        chavePix: configPix.chave_pix,
        tipoChavePix: configPix.tipo_chave_pix,
        nomeRecebedor: configPix.nome_recebedor_pix,
        cidade: configPix.cidade_pix,
        valor: Number(item.valor || 0),
        descricao: `${
          configPix.descricao_pix || "Mensalidade"
        } ${item.competencia}`,
      });

      const qr = await QRCode.toDataURL(payload, {
        width: 512,
        margin: 2,
      });

      setPixQrCode(qr);
      setPixCopiaECola(payload);
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar PIX");
    } finally {
      setGerandoPix(false);
    }
  };

  const abrirRecebimento = async (item: Pagamento) => {
    setPagamentoSelecionado(item);
    setFormaPagamento("pix_manual");
    setPixQrCode("");
    setPixCopiaECola("");
    await gerarPixPayload(item);
  };

  const confirmarPagamento = async () => {
    if (!pagamentoSelecionado) return;

    try {
      setSalvandoPagamento(true);

      const res = await apiFetch("/api/pagamentos/receber-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagamento_id: pagamentoSelecionado.id,
          forma_pagamento: formaPagamento,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao registrar pagamento");
        return;
      }

      setPagamentoSelecionado(null);
      setFormaPagamento("pix_manual");
      setPixQrCode("");
      setPixCopiaECola("");
      await carregarPagamentos();
    } finally {
      setSalvandoPagamento(false);
    }
  };

  const gerarCobrancaOnline = async (item: Pagamento) => {
    try {
      setGerandoCobrancaId(item.id);

      const res = await apiFetch("/api/pagamentos/mercadopago/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagamento_id: item.id,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao gerar cobrança online");
        return;
      }

      await carregarPagamentos();

      if ((json as any).link) {
        window.open((json as any).link, "_blank");
      } else if ((json as any).init_point) {
        window.open((json as any).init_point, "_blank");
      } else {
        alert("Cobrança gerada com sucesso");
      }
    } finally {
      setGerandoCobrancaId(null);
    }
  };

  const gerarCobrancasDoMes = async () => {
    try {
      if (!academiaId) {
        alert("Academia não identificada");
        return;
      }

      setGerandoCobrancasMes(true);

      const res = await apiFetch("/api/pagamentos/mercadopago/gerar-mes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          competencia,
          academia_id: academiaId,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao gerar cobranças do mês");
        return;
      }

      alert(`${(json as any).total_gerado || 0} cobranças criadas`);
      await carregarPagamentos();
    } finally {
      setGerandoCobrancasMes(false);
    }
  };

  const gerarLinksEmLote = async () => {
    const pendentesSemLink = pagamentosFiltrados.filter(
      (item) => item.status !== "pago" && !item.link_pagamento
    );

    if (pendentesSemLink.length === 0) {
      alert("Não há cobranças pendentes sem link para gerar.");
      return;
    }

    const confirmar = window.confirm(
      `Gerar links de cobrança para ${pendentesSemLink.length} mensalidade(s)?`
    );
    if (!confirmar) return;

    try {
      setGerandoLinksLote(true);

      for (const item of pendentesSemLink) {
        const res = await apiFetch("/api/pagamentos/mercadopago/criar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pagamento_id: item.id,
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(
            (json as any).error ||
              `Erro ao gerar link da mensalidade de ${item.aluno_nome}`
          );
          return;
        }
      }

      await carregarPagamentos();
      alert("Links gerados com sucesso.");
    } finally {
      setGerandoLinksLote(false);
    }
  };

  const abrirLinkPagamento = (link?: string | null) => {
    if (!link) {
      alert("Link de pagamento ainda não gerado.");
      return;
    }

    window.open(link, "_blank");
  };

  const abrirWhatsappCobranca = (item: Pagamento) => {
    const telefone = somenteNumeros(item.aluno_telefone);

    if (!telefone) {
      alert("Aluno sem telefone cadastrado.");
      return;
    }

    const statusVisual = getStatusVisual(item).label;

    const mensagem = [
      `Olá, ${item.aluno_nome}!`,
      `Sua mensalidade da competência ${item.competencia} está ${statusVisual.toLowerCase()}.`,
      `Valor: ${formatBRL(item.valor)}`,
      `Vencimento: ${formatData(item.vencimento)}`,
      item.link_pagamento ? `Link para pagamento: ${item.link_pagamento}` : "",
      "Qualquer dúvida, estamos à disposição.",
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(
      mensagem
    )}`;

    window.open(url, "_blank");
  };

  const exportarCsv = () => {
    if (pagamentosFiltrados.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const linhas = [
      [
        "Aluno",
        "Competência",
        "Valor",
        "Vencimento",
        "Status",
        "Pago em",
        "Forma de pagamento",
        "Gateway",
        "Status gateway",
        "Link pagamento",
      ].join(","),
      ...pagamentosFiltrados.map((item) =>
        [
          escapeCsv(item.aluno_nome),
          escapeCsv(item.competencia),
          escapeCsv(Number(item.valor || 0).toFixed(2)),
          escapeCsv(item.vencimento),
          escapeCsv(item.status),
          escapeCsv(item.data_pagamento || ""),
          escapeCsv(labelFormaPagamento(item.forma_pagamento)),
          escapeCsv(item.gateway || ""),
          escapeCsv(item.gateway_status || ""),
          escapeCsv(item.link_pagamento || ""),
        ].join(",")
      ),
    ];

    const csv = "\uFEFF" + linhas.join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `pagamentos-${competencia}-${statusFiltro}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  const estornarPagamento = async (id: number) => {
    const confirmar = confirm("Deseja estornar este pagamento?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/financeiro/pagamentos/${id}/estornar`, {
      method: "POST",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao estornar pagamento");
      return;
    }

    await carregarPagamentos();
  };

  const abrirComprovante = (id: number) => {
    window.open(`/financeiro/comprovante/${id}`, "_blank");
  };

  const pagamentosFiltrados = pagamentos.filter((item) => {
    const termo = busca.toLowerCase();

    const bateBusca =
      item.aluno_nome.toLowerCase().includes(termo) ||
      String(item.competencia || "").toLowerCase().includes(termo) ||
      String(item.status || "").toLowerCase().includes(termo) ||
      String(item.forma_pagamento || "").toLowerCase().includes(termo) ||
      String(item.gateway || "").toLowerCase().includes(termo);

    const bateVencido = !somenteVencidos || isVencido(item);
    const bateForma = !formaFiltro || item.forma_pagamento === formaFiltro;
    const bateGateway = !gatewayFiltro || item.gateway === gatewayFiltro;

    return bateBusca && bateVencido && bateForma && bateGateway;
  });

  const totalLista = pagamentosFiltrados.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

  const totalPagoLista = useMemo(() => {
    return pagamentosFiltrados
      .filter((item) => item.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }, [pagamentosFiltrados]);

  const totalPendenteLista = useMemo(() => {
    return pagamentosFiltrados
      .filter((item) => item.status !== "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
  }, [pagamentosFiltrados]);

  const totalVencidos = useMemo(() => {
    return pagamentosFiltrados.filter((item) => isVencido(item)).length;
  }, [pagamentosFiltrados]);

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando pagamentos..."
      />
    );
  }

  if (erro && pagamentos.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar pagamentos"
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
            <h1 className="mt-1 text-5xl font-black md:text-4x1">
              Pagamentos
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Receba mensalidades no balcão, gere cobranças online e acompanhe os
              pagamentos da academia.
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

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="border rounded-xl p-3"
          />

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagas</option>
          </select>

          <select
            value={formaFiltro}
            onChange={(e) => setFormaFiltro(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Todas as formas de pagamento</option>
            <option value="pix_manual">Pix manual</option>
            <option value="cartao_maquina">Cartão máquina</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="mercado_pago_pix">Mercado Pago Pix</option>
            <option value="mercado_pago_cartao">Mercado Pago Cartão</option>
            <option value="mercado_pago_boleto">Mercado Pago Boleto</option>
          </select>

          <select
            value={gatewayFiltro}
            onChange={(e) => setGatewayFiltro(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="">Todos os gateways</option>
            <option value="mercado_pago">Mercado Pago</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 border rounded-xl px-3 py-3">
            <input
              type="checkbox"
              checked={somenteVencidos}
              onChange={(e) => setSomenteVencidos(e.target.checked)}
            />
            <span className="text-sm">Somente vencidos</span>
          </label>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno, competência, forma..."
            className="border rounded-xl p-3"
          />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <button
            onClick={gerarCobrancasDoMes}
            disabled={gerandoCobrancasMes}
            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl px-5 py-3"
          >
            <Link2 size={16} />
            {gerandoCobrancasMes ? "Gerando..." : "Gerar Cobrança do Mês"}
          </button>

          <button
            onClick={gerarLinksEmLote}
            disabled={gerandoLinksLote}
            className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-xl px-5 py-3"
          >
            <Send size={16} />
            {gerandoLinksLote ? "Gerando..." : "Gerar Links de Pagamento"}
          </button>

          <button
            onClick={exportarCsv}
            className="inline-flex items-center justify-center gap-2 border rounded-xl px-5 py-3"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Registros encontrados</p>
          <p className="text-2xl font-black mt-2 text-blue-600">
            {pagamentosFiltrados.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Valor total da lista</p>
          <p className="text-2xl font-black mt-2 text-green-600">
            {formatBRL(totalLista)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Total pago</p>
          <p className="text-2xl font-black mt-2 text-emerald-600">
            {formatBRL(totalPagoLista)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Total pendente</p>
          <p className="text-2xl font-black mt-2 text-yellow-600">
            {formatBRL(totalPendenteLista)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
          <p className="text-sm text-gray-500">Vencidos</p>
          <p className="text-2xl font-black mt-2 text-red-600">
            {totalVencidos}
          </p>
        </div>
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Mensalidades</h2>

        {pagamentosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhuma mensalidade encontrada.</p>
        ) : (
          <div className="space-y-3 max-h-[500px] md:max-h-[650px] xl:max-h-[750px] overflow-y-auto pr-1">
            {pagamentosFiltrados.map((item) => {
              const statusVisual = getStatusVisual(item);

              return (
                <div
                  key={item.id}
                  className="border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-lg font-bold text-gray-900">
                        {item.aluno_nome}
                      </p>

                      <span
                        className={`text-xs px-3 py-1 rounded-full ${statusVisual.className}`}
                      >
                        {statusVisual.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-sm text-gray-600 md:grid-cols-2 xl:grid-cols-3">
                      <p>
                        <strong>Competência:</strong> {item.competencia}
                      </p>
                      <p>
                        <strong>Vencimento:</strong> {formatData(item.vencimento)}
                      </p>
                      <p>
                        <strong>Valor:</strong> {formatBRL(item.valor)}
                      </p>
                      <p>
                        <strong>Status:</strong> {item.status}
                      </p>

                      {item.data_pagamento ? (
                        <p className="text-green-600">
                          <strong>Pago em:</strong>{" "}
                          {formatData(item.data_pagamento)}
                        </p>
                      ) : null}

                      {item.forma_pagamento ? (
                        <p className="text-blue-600">
                          <strong>Forma:</strong>{" "}
                          {labelFormaPagamento(item.forma_pagamento)}
                        </p>
                      ) : null}

                      {item.gateway ? (
                        <p className="text-violet-600">
                          <strong>Gateway:</strong> {item.gateway}
                          {item.gateway_status
                            ? ` • ${item.gateway_status}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    {item.status !== "pago" ? (
                      <>
                        {!item.link_pagamento ? (
                          <button
                            onClick={() => gerarCobrancaOnline(item)}
                            disabled={gerandoCobrancaId === item.id}
                            className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl px-4 py-2"
                          >
                            <Link2 size={16} />
                            {gerandoCobrancaId === item.id
                              ? "Gerando..."
                              : "Gerar cobrança online"}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              abrirLinkPagamento(item.link_pagamento)
                            }
                            className="inline-flex items-center justify-center gap-2 border rounded-xl px-4 py-2"
                          >
                            <Link2 size={16} />
                            Abrir link
                          </button>
                        )}

                        <button
                          onClick={() => abrirWhatsappCobranca(item)}
                          className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2"
                        >
                          <MessageCircle size={16} />
                          Cobrar no WhatsApp
                        </button>

                        <button
                          onClick={() => abrirRecebimento(item)}
                          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2"
                        >
                          <Wallet size={16} />
                          Receber no balcão
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => abrirComprovante(item.id)}
                          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                        >
                          <Receipt size={16} />
                          Comprovante
                        </button>

                        <button
                          onClick={() => estornarPagamento(item.id)}
                          className="inline-flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl px-4 py-2"
                        >
                          <RotateCcw size={16} />
                          Estornar
                        </button>
                      </>
                    )}
                  </div>
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
              Recebimento no balcão
            </h2>

            <div className="text-sm text-gray-600 text-center">
              <p className="font-semibold">{pagamentoSelecionado.aluno_nome}</p>
              <p>Competência: {pagamentoSelecionado.competencia}</p>
              <p>Vencimento: {formatData(pagamentoSelecionado.vencimento)}</p>
              <p className="text-lg font-bold mt-2">
                {formatBRL(pagamentoSelecionado.valor)}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setFormaPagamento("pix_manual");
                  gerarPixPayload(pagamentoSelecionado);
                }}
                className={`rounded-xl py-3 border font-medium inline-flex items-center justify-center gap-2 ${
                  formaPagamento === "pix_manual"
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white"
                }`}
              >
                <QrCode size={16} />
                Pix manual
              </button>

              <button
                onClick={() => {
                  setFormaPagamento("cartao_maquina");
                  setPixQrCode("");
                  setPixCopiaECola("");
                }}
                className={`rounded-xl py-3 border font-medium inline-flex items-center justify-center gap-2 ${
                  formaPagamento === "cartao_maquina"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white"
                }`}
              >
                <CreditCard size={16} />
                Cartão
              </button>

              <button
                onClick={() => {
                  setFormaPagamento("dinheiro");
                  setPixQrCode("");
                  setPixCopiaECola("");
                }}
                className={`rounded-xl py-3 border font-medium inline-flex items-center justify-center gap-2 ${
                  formaPagamento === "dinheiro"
                    ? "bg-yellow-500 text-white border-yellow-500"
                    : "bg-white"
                }`}
              >
                <Banknote size={16} />
                Dinheiro
              </button>
            </div>

            {formaPagamento === "pix_manual" ? (
              <div className="space-y-3 border rounded-2xl p-4 bg-gray-50">
                <p className="text-sm font-semibold text-center">
                  Pagamento via Pix manual
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
                      className="w-full border rounded-xl py-3 inline-flex items-center justify-center gap-2"
                    >
                      <Copy size={16} />
                      Copiar código PIX
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
              {formaPagamento === "dinheiro" ? (
                <p className="inline-flex items-start gap-2">
                  <Banknote size={16} className="mt-0.5" />
                  Confirme somente após receber o valor em dinheiro no balcão.
                </p>
              ) : formaPagamento === "cartao_maquina" ? (
                <p className="inline-flex items-start gap-2">
                  <CreditCard size={16} className="mt-0.5" />
                  Confirme somente após passar o cartão na máquina física e
                  aprovar a cobrança.
                </p>
              ) : (
                <p className="inline-flex items-start gap-2">
                  <CircleDollarSign size={16} className="mt-0.5" />
                  Confirme somente após o aluno concluir o Pix manualmente.
                </p>
              )}
            </div>

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
                  setFormaPagamento("pix_manual");
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

export default function PagamentosPage() {
  return (
    <ProtegePagina permissao="pagamentos">
      <PagamentosPageContent />
    </ProtegePagina>
  );
}