"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Search,
  Save,
  Users,
  BadgeDollarSign,
  ShieldCheck,
  TriangleAlert,
  Settings2,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

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

function FinanceiroAlunosPageContent() {
  const router = useRouter();

  const [lista, setLista] = useState<AlunoFinanceiro[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoTodos, setSalvandoTodos] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroConfiguracao, setFiltroConfiguracao] = useState("todos");

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
        setErro((jsonLista as any).error || "Erro ao carregar alunos do financeiro");
        return;
      }

      if (!resPlanos.ok) {
        setErro((jsonPlanos as any).error || "Erro ao carregar planos");
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

  const planoPorCodigo = (codigo?: string | null) =>
    planos.find((p) => p.codigo === codigo);

  const atualizarCampo = (
    aluno_id: number,
    campo: keyof AlunoFinanceiro,
    valor: string | number | boolean | null
  ) => {
    setLista((prev) =>
      prev.map((item) => {
        if (item.aluno_id !== aluno_id) return item;

        const atualizado = { ...item, [campo]: valor };

        if (campo === "plano_codigo") {
          const planoSelecionado = planoPorCodigo(String(valor || ""));
          return {
            ...atualizado,
            valor_mensalidade: planoSelecionado
              ? Number(planoSelecionado.valor || 0)
              : 0,
            tipo_cobranca: planoSelecionado?.tipo_cobranca || "mensal",
          };
        }

        return atualizado;
      })
    );
  };

  const salvarItem = async (item: AlunoFinanceiro) => {
    const planoSelecionado = planoPorCodigo(item.plano_codigo);

    const valorMensalidade = planoSelecionado
      ? Number(planoSelecionado.valor || 0)
      : Number(item.valor_mensalidade || 0);

    const tipoCobranca =
      planoSelecionado?.tipo_cobranca || item.tipo_cobranca || "mensal";

    const planoNome = planoSelecionado?.nome || "";

    const res = await apiFetch("/api/financeiro/alunos/salvar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aluno_id: item.aluno_id,
        plano: planoNome || null,
        plano_codigo: item.plano_codigo || null,
        valor_mensalidade: valorMensalidade,
        tipo_cobranca: tipoCobranca,
        vencimento_dia: Number(item.vencimento_dia || 10),
        ativo: item.ativo,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || `Erro ao salvar ${item.nome}`);
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

    const planoSelecionado = planoPorCodigo(planoTodos);

    if (!planoSelecionado) {
      alert("Plano selecionado inválido");
      return;
    }

    setAplicandoTodos(true);

    setLista((prev) =>
      prev.map((item) => ({
        ...item,
        plano_codigo: planoTodos,
        valor_mensalidade: Number(planoSelecionado.valor || 0),
        tipo_cobranca: planoSelecionado.tipo_cobranca,
        vencimento_dia: Number(vencimentoTodos || 10),
        ativo: ativoTodos,
      }))
    );

    setAplicandoTodos(false);
    alert("Configuração aplicada na tela. Agora clique em 'Salvar todos'.");
  };

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return lista.filter((item) => {
      const nome = (item.nome || "").toLowerCase();
      const telefone = (item.telefone || "").toLowerCase();
      const cpf = (item.cpf || "").toLowerCase();

      const matchBusca =
        !termo ||
        nome.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo);

      const configurado = item.ativo && Number(item.valor_mensalidade || 0) > 0;
      const semValor = item.ativo && Number(item.valor_mensalidade || 0) <= 0;
      const inativo = !item.ativo;

      const matchConfiguracao =
        filtroConfiguracao === "todos" ||
        (filtroConfiguracao === "configurados" && configurado) ||
        (filtroConfiguracao === "sem_valor" && semValor) ||
        (filtroConfiguracao === "inativos" && inativo);

      return matchBusca && matchConfiguracao;
    });
  }, [lista, busca, filtroConfiguracao]);

  const resumo = useMemo(() => {
    const total = lista.length;
    const ativos = lista.filter((item) => item.ativo).length;
    const configurados = lista.filter(
      (item) => item.ativo && Number(item.valor_mensalidade || 0) > 0
    ).length;
    const semPlano = lista.filter(
      (item) => !item.plano_codigo || Number(item.valor_mensalidade || 0) <= 0
    ).length;

    return { total, ativos, configurados, semPlano };
  }, [lista]);

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando financeiro dos alunos..."
      />
    );
  }

  if (erro && lista.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar financeiro dos alunos"
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
              Financeiro dos alunos
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Defina plano, vencimento e ativação financeira de cada aluno.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 xl:justify-end">
            <button
              onClick={() => router.push("/financeiro")}
              className="bg-white/10 hover:bg-white/15 text-white px-5 py-3 rounded-xl"
            >
              Voltar
            </button>

            <button
              onClick={salvarTodos}
              disabled={salvandoTodos || lista.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {salvandoTodos ? "Salvando todos..." : "Salvar todos"}
            </button>
          </div>
        </div>
      </section>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardInfo
          titulo="Total de alunos"
          valor={String(resumo.total)}
          icon={Users}
        />
        <CardInfo
          titulo="Ativos"
          valor={String(resumo.ativos)}
          cor="text-green-600"
          icon={ShieldCheck}
        />
        <CardInfo
          titulo="Configurados"
          valor={String(resumo.configurados)}
          cor="text-blue-600"
          icon={CheckCircle2}
        />
        <CardInfo
          titulo="Sem plano/valor"
          valor={String(resumo.semPlano)}
          cor="text-yellow-600"
          icon={TriangleAlert}
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={18} className="text-zinc-700" />
          <h2 className="text-xl font-bold text-gray-900">
            Aplicar configuração para todos
          </h2>
        </div>

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

        <div className="rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
          Isso aplica as alterações na tela. Depois clique em{" "}
          <strong>Salvar todos</strong> para gravar no sistema.
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lista de alunos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure individualmente o financeiro de cada aluno
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full xl:w-auto">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, telefone ou CPF"
                className="border rounded-xl p-3 pl-10 w-full md:w-[340px]"
              />
            </div>

            <select
              value={filtroConfiguracao}
              onChange={(e) => setFiltroConfiguracao(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="todos">Todos</option>
              <option value="configurados">Configurados</option>
              <option value="sem_valor">Sem valor</option>
              <option value="inativos">Inativos</option>
            </select>
          </div>
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhum aluno encontrado.
          </div>
        ) : (
          <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
            {listaFiltrada.map((item) => {
              const planoSelecionado = planoPorCodigo(item.plano_codigo);

              return (
                <div
                  key={item.aluno_id}
                  className="bg-white border rounded-2xl p-4 flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-4"
                >
                  <div className="min-w-[220px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{item.nome}</p>
                      <BadgeConfiguracao
                        valor={item.valor_mensalidade}
                        ativo={item.ativo}
                      />
                    </div>

                    <p className="text-sm text-gray-500">
                      ID aluno: {item.aluno_id}
                    </p>

                    {item.telefone ? (
                      <p className="text-sm text-gray-500">
                        Telefone: {item.telefone}
                      </p>
                    ) : null}

                    {item.cpf ? (
                      <p className="text-sm text-gray-500">
                        CPF: {item.cpf}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3 items-end flex-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Plano
                      </label>
                      <select
                        value={item.plano_codigo || ""}
                        onChange={(e) =>
                          atualizarCampo(
                            item.aluno_id,
                            "plano_codigo",
                            e.target.value
                          )
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
                            ? formatBRL(Number(planoSelecionado.valor))
                            : item.valor_mensalidade > 0
                            ? formatBRL(Number(item.valor_mensalidade))
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
                        value={
                          planoSelecionado?.tipo_cobranca ||
                          item.tipo_cobranca ||
                          "-"
                        }
                        className="border rounded-xl p-2 w-full bg-gray-100 capitalize"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Dia vencimento
                      </label>
                      <div className="relative">
                        <CalendarDays
                          size={15}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                        />
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
                          className="border rounded-xl p-2 pl-9 w-full"
                        />
                      </div>
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
                            atualizarCampo(
                              item.aluno_id,
                              "ativo",
                              e.target.checked
                            )
                          }
                        />
                        <span className="text-sm">Ativo</span>
                      </label>
                    </div>
                  </div>

                  <div className="2xl:w-[130px]">
                    <button
                      onClick={async () => {
                        const ok = await salvarItem(item);
                        if (ok) {
                          alert(`Configuração de ${item.nome} salva com sucesso`);
                          await carregar();
                        }
                      }}
                      className="bg-black text-white px-4 py-2 rounded-xl w-full inline-flex items-center justify-center gap-2"
                    >
                      <BadgeDollarSign size={16} />
                      Salvar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function FinanceiroAlunosPage() {
  return (
    <ProtegePagina permissao="financeiro">
      <FinanceiroAlunosPageContent />
    </ProtegePagina>
  );
}