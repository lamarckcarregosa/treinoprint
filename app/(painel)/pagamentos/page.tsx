"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import ProtegePagina from "@/components/ProtegePagina";
import { Activity } from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";


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

import { apiFetch } from "@/lib/apiFetch";

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

function PagamentosPageContent() {
  const hoje = new Date();
  const competenciaAtual = hoje.toISOString().slice(0, 7);

  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [statusFiltro, setStatusFiltro] = useState("pendente");
  const [busca, setBusca] = useState("");

  const [pagamentoSelecionado, setPagamentoSelecionado] =
    useState<Pagamento | null>(null);
  const [formaPagamento, setFormaPagamento] = useState("pix");
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);

  const [pixQrCode, setPixQrCode] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [gerandoPix, setGerandoPix] = useState(false);

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
        await carregarPagamentos();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [competencia, statusFiltro]);

  const gerarPix = async (
    alunoNome: string,
    valor: number,
    competencia: string
  ) => {
    try {
      setGerandoPix(true);

      const chavePix = "79996320601";
      const nome = "TREINOPRINT";
      const cidade = "POCOVERDE";

      const valorFormatado = Number(valor || 0).toFixed(2);

      const payload = `
000201
26360014BR.GOV.BCB.PIX
0114${chavePix}
52040000
5303986
54${valorFormatado.length}${valorFormatado}
5802BR
59${nome.length}${nome}
60${cidade.length}${cidade}
62070503***
6304
`
        .replace(/\s/g, "");

      const qr = await QRCode.toDataURL(payload);

      setPixQrCode(qr);
      setPixCopiaECola(payload);
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar PIX");
    } finally {
      setGerandoPix(false);
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
      await carregarPagamentos();
    } finally {
      setSalvandoPagamento(false);
    }
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

    const pagamentosFiltrados = pagamentos.filter((item) =>
    item.aluno_nome.toLowerCase().includes(busca.toLowerCase())
  );

  const totalLista = pagamentosFiltrados.reduce(
    (acc, item) => acc + Number(item.valor || 0),
    0
  );

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
          <p className="text-sm text-zinc-300">Painel principal</p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">
            Bem-vindo ao Pagamentos
          </h1>
          <p className="text-zinc-300 mt-3 max-w-2xl">
            Receba e gerencie as mensalidades dos alunos.
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
      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar aluno"
            className="border rounded-xl p-3"
          />

          <button
            onClick={carregarPagamentos}
            className="bg-black text-white rounded-xl px-5 py-3"
          >
            Atualizar
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <p className="text-sm text-gray-500">Status atual</p>
          <p className="text-2xl font-black mt-2 text-gray-900 capitalize">
            {statusFiltro}
          </p>
        </div>
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="font-semibold mb-4">Mensalidades</h2>

        {pagamentosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhuma mensalidade encontrada.</p>
        ) : (
          <div className="space-y-3">
            {pagamentosFiltrados.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="font-bold">{item.aluno_nome}</p>
                  <p className="text-sm text-gray-600">
                    Competência: {item.competencia}
                  </p>
                  <p className="text-sm text-gray-600">
                    Vencimento: {formatData(item.vencimento)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Valor: {formatBRL(item.valor)}
                  </p>
                  <p className="text-sm text-gray-600">Status: {item.status}</p>

                  {item.data_pagamento ? (
                    <p className="text-sm text-green-600">
                      Pago em: {formatData(item.data_pagamento)}
                    </p>
                  ) : null}

                  {item.forma_pagamento ? (
                    <p className="text-sm text-blue-600">
                      Forma: {item.forma_pagamento}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-3">
                  {item.status !== "pago" ? (
                    <button
                      onClick={() => {
                        setPagamentoSelecionado(item);
                        setFormaPagamento("pix");
                        gerarPix(item.aluno_nome, item.valor, item.competencia);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2"
                    >
                      Receber
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => abrirComprovante(item.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2"
                      >
                        Comprovante
                      </button>

                      <button
                        onClick={() => estornarPagamento(item.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl px-4 py-2"
                      >
                        Estornar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
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
                onClick={() => {
                  setFormaPagamento("pix");
                  gerarPix(
                    pagamentoSelecionado.aluno_nome,
                    pagamentoSelecionado.valor,
                    pagamentoSelecionado.competencia
                  );
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

export default function PagamentosPage() {
  return (
    <ProtegePagina permissao="pagamentos">
      <PagamentosPageContent />
    </ProtegePagina>
  );
}