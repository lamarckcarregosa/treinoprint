"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtegePagina from "@/components/ProtegePagina";
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

function DespesasPageContent() {
  const router = useRouter();

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

  const carregar = async () => {
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
  }, []);

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
          tipo: tipoCadastro,
          status: "pendente",
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
      setTipoCadastro("variavel");

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
      alert("Despesa atualizada com sucesso");
    } finally {
      setSalvandoDespesaId(null);
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

  const categorias = useMemo(
    () =>
      [...new Set(despesas.map((d) => (d.categoria || "").trim()).filter(Boolean))].sort(),
    [despesas]
  );

  const despesasFiltradas = despesas.filter((item) => {
    const texto = filtroTexto.toLowerCase();

    const matchTexto =
      !texto ||
      item.descricao.toLowerCase().includes(texto) ||
      (item.observacoes || "").toLowerCase().includes(texto);

    const matchCategoria =
      !filtroCategoria ||
      (item.categoria || "").toLowerCase() === filtroCategoria.toLowerCase();

    const matchTipo =
      filtroTipo === "todos" || (item.tipo || "variavel") === filtroTipo;

    const matchStatus =
      filtroStatus === "todos" || (item.status || "pendente") === filtroStatus;

    return matchTexto && matchCategoria && matchTipo && matchStatus;
  });

  if (loading) {
    return <p className="p-6">Carregando despesas...</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Cadastro de despesas</h1>
          <p className="text-gray-500 mt-2">
            Cadastre, edite e acompanhe despesas fixas e variáveis da academia
          </p>
        </div>

        <button
          onClick={() => router.push("/financeiro")}
          className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4 border border-black/5">
        <h2 className="font-semibold">Cadastrar despesa</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="border rounded-xl p-3"
          />

          <input
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Categoria"
            className="border rounded-xl p-3"
          />

          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Valor"
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
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações"
          className="border rounded-xl p-3 w-full min-h-24"
        />

        {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

        <button
          onClick={cadastrarDespesa}
          disabled={salvando}
          className="bg-black text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Cadastrar despesa"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
          <h2 className="font-semibold">Despesas lançadas</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full xl:w-auto">
            <input
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar despesa"
              className="border rounded-xl p-3"
            />

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
              <option value="pendente">Pendente</option>
              <option value="pago">Paga</option>
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
    </main>
  );
}

export default function DespesasPage() {
  return (
    <ProtegePagina permissao="financeiro">
      <DespesasPageContent />
    </ProtegePagina>
  );
}