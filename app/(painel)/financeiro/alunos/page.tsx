"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TipoCobranca = "mensal" | "trimestral" | "semestral" | "anual";

type AlunoFinanceiro = {
  id: number | null;
  aluno_id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  valor_mensalidade: number;
  vencimento_dia: number;
  ativo: boolean;
  tipo_cobranca?: TipoCobranca;
  plano_codigo?: string | null;
};

type Plano = {
  id: number;
  nome: string;
  codigo: string;
  valor: number;
  tipo_cobranca: TipoCobranca;
  limite_alunos?: number | null;
  ativo: boolean;
};

import { apiFetch } from "@/lib/apiFetch";

function BadgeConfiguracao({
  valor,
  ativo,
}: {
  valor: number;
  ativo: boolean;
}) {
  if (!ativo) {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
        Inativo
      </span>
    );
  }

  if (!valor || valor <= 0) {
    return (
      <span className="text-xs px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
        Sem valor
      </span>
    );
  }

  return (
    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
      Configurado
    </span>
  );
}

export default function FinanceiroAlunosPage() {
  const router = useRouter();

  const [lista, setLista] = useState<AlunoFinanceiro[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoTodos, setSalvandoTodos] = useState(false);

  const [busca, setBusca] = useState("");

  const [planoTodos, setPlanoTodos] = useState("");
  const [vencimentoTodos, setVencimentoTodos] = useState("10");
  const [ativoTodos, setAtivoTodos] = useState(true);
  const [aplicandoTodos, setAplicandoTodos] = useState(false);

  const carregar = async () => {
    try {
      setErro("");

      const [resLista, resPlanos] = await Promise.all([
        apiFetch("/api/financeiro/alunos", { cache: "no-store" }),
        apiFetch("/api/planos", { cache: "no-store" }),
      ]);

      const jsonLista = await resLista.json().catch(() => []);
      const jsonPlanos = await resPlanos.json().catch(() => []);

      if (!resLista.ok) {
        setErro(jsonLista.error || "Erro ao carregar alunos do financeiro");
        return;
      }

      if (!resPlanos.ok) {
        setErro(jsonPlanos.error || "Erro ao carregar planos");
        return;
      }

      setLista(Array.isArray(jsonLista) ? jsonLista : []);
      setPlanos(
        (Array.isArray(jsonPlanos) ? jsonPlanos : []).filter((p) => p.ativo)
      );
    } catch {
      setErro("Erro ao carregar financeiro dos alunos");
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

  const atualizarCampo = (
    aluno_id: number,
    campo: keyof AlunoFinanceiro,
    valor: string | number | boolean | null
  ) => {
    setLista((prev) =>
      prev.map((item) =>
        item.aluno_id === aluno_id ? { ...item, [campo]: valor } : item
      )
    );
  };

  const salvarItem = async (item: AlunoFinanceiro) => {
    const res = await apiFetch("/api/financeiro/alunos/salvar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aluno_id: item.aluno_id,
        plano_codigo: item.plano_codigo,
        vencimento_dia: Number(item.vencimento_dia || 10),
        ativo: item.ativo,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || `Erro ao salvar ${item.nome}`);
      return false;
    }

    return true;
  };

  const salvarTodos = async () => {
    try {
      setSalvandoTodos(true);

      for (const item of lista) {
        const ok = await salvarItem(item);
        if (!ok) {
          setSalvandoTodos(false);
          return;
        }
      }

      alert("Todos os alunos foram salvos com sucesso");
      await carregar();
    } finally {
      setSalvandoTodos(false);
    }
  };

  const aplicarParaTodos = () => {
    if (!planoTodos) {
      alert("Selecione um plano para aplicar a todos");
      return;
    }

    setAplicandoTodos(true);

    setLista((prev) =>
      prev.map((item) => ({
        ...item,
        plano_codigo: planoTodos,
        vencimento_dia: Number(vencimentoTodos || 10),
        ativo: ativoTodos,
      }))
    );

    setAplicandoTodos(false);
    alert("Configuração aplicada na tela. Agora clique em 'Salvar todos'.");
  };

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;

    return lista.filter((item) => {
      const nome = (item.nome || "").toLowerCase();
      const telefone = (item.telefone || "").toLowerCase();
      const cpf = (item.cpf || "").toLowerCase();

      return (
        nome.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo)
      );
    });
  }, [lista, busca]);

  const planoPorCodigo = (codigo?: string | null) =>
    planos.find((p) => p.codigo === codigo);

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Financeiro dos alunos
          </h1>
          <p className="text-gray-500 mt-2">
            Defina plano, vencimento e ativação financeira de cada aluno.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/financeiro")}
            className="bg-zinc-700 text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>

          <button
            onClick={salvarTodos}
            disabled={salvandoTodos || lista.length === 0}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            {salvandoTodos ? "Salvando todos..." : "Salvar todos"}
          </button>
        </div>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Aplicar configuração para todos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Plano
            </label>
            <select
              value={planoTodos}
              onChange={(e) => setPlanoTodos(e.target.value)}
              className="border rounded-xl p-3 w-full"
            >
              <option value="">Selecione</option>
              {planos.map((plano) => (
                <option key={plano.codigo} value={plano.codigo}>
                  {plano.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Dia vencimento
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={vencimentoTodos}
              onChange={(e) => setVencimentoTodos(e.target.value)}
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Situação
            </label>
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 h-[48px]">
              <input
                type="checkbox"
                checked={ativoTodos}
                onChange={(e) => setAtivoTodos(e.target.checked)}
              />
              <span className="text-sm">Ativo</span>
            </label>
          </div>

          <div className="flex items-end">
            <button
              onClick={aplicarParaTodos}
              disabled={aplicandoTodos}
              className="bg-black text-white px-5 py-3 rounded-xl w-full disabled:opacity-60"
            >
              Aplicar para todos
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          Isso aplica na tela. Depois clique em <strong>Salvar todos</strong>.
        </p>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Lista de alunos</h2>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone ou CPF"
            className="border rounded-xl p-3 w-full md:w-[340px]"
          />
        </div>
      </section>

      <div className="space-y-3">
        {listaFiltrada.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          listaFiltrada.map((item) => {
            const planoSelecionado = planoPorCodigo(item.plano_codigo);

            return (
              <div
                key={item.aluno_id}
                className="bg-white border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >
                <div className="min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    <BadgeConfiguracao
                      valor={item.valor_mensalidade}
                      ativo={item.ativo}
                    />
                  </div>
                  <p className="text-sm text-gray-500">ID aluno: {item.aluno_id}</p>
                  {item.telefone ? (
                    <p className="text-sm text-gray-500">Telefone: {item.telefone}</p>
                  ) : null}
                  {item.cpf ? (
                    <p className="text-sm text-gray-500">CPF: {item.cpf}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end flex-1">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Plano
                    </label>
                    <select
                      value={item.plano_codigo || ""}
                      onChange={(e) =>
                        atualizarCampo(item.aluno_id, "plano_codigo", e.target.value)
                      }
                      className="border rounded-xl p-2 w-full"
                    >
                      <option value="">Selecione</option>
                      {planos.map((plano) => (
                        <option key={plano.codigo} value={plano.codigo}>
                          {plano.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Valor
                    </label>
                    <input
                      type="text"
                      disabled
                      value={
                        planoSelecionado
                          ? Number(planoSelecionado.valor).toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "-"
                      }
                      className="border rounded-xl p-2 w-full bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Cobrança
                    </label>
                    <input
                      type="text"
                      disabled
                      value={planoSelecionado?.tipo_cobranca || "-"}
                      className="border rounded-xl p-2 w-full bg-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Dia vencimento
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={item.vencimento_dia}
                      onChange={(e) =>
                        atualizarCampo(
                          item.aluno_id,
                          "vencimento_dia",
                          Number(e.target.value)
                        )
                      }
                      className="border rounded-xl p-2 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Situação
                    </label>
                    <label className="flex items-center gap-2 border rounded-xl px-3 py-2 h-[42px]">
                      <input
                        type="checkbox"
                        checked={item.ativo}
                        onChange={(e) =>
                          atualizarCampo(item.aluno_id, "ativo", e.target.checked)
                        }
                      />
                      <span className="text-sm">Ativo</span>
                    </label>
                  </div>
                </div>

                <div className="xl:w-[120px]">
                  <button
                    onClick={async () => {
                      const ok = await salvarItem(item);
                      if (ok) {
                        alert(`Configuração de ${item.nome} salva com sucesso`);
                        await carregar();
                      }
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl w-full"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}