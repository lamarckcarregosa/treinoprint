"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AlunoFinanceiro = {
  id: number | null;
  aluno_id: number;
  nome: string;
  valor_mensalidade: number;
  vencimento_dia: number;
  ativo: boolean;
};

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
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

function formatMoneyInput(value: number) {
  if (!value) return "";
  return String(value);
}

export default function FinanceiroAlunosPage() {
  const router = useRouter();

  const [lista, setLista] = useState<AlunoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [salvandoTodos, setSalvandoTodos] = useState(false);

  const carregar = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/financeiro/alunos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar alunos do financeiro");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar alunos do financeiro");
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
    valor: string | number | boolean
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
        valor_mensalidade: Number(item.valor_mensalidade || 0),
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

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Mensalidade dos alunos</h1>
          <p className="text-gray-500 mt-2">
            Defina um valor mensal e o dia do vencimento para cada aluno.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Exemplo: valor <strong>120</strong> e vencimento <strong>10</strong>.
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

      <div className="space-y-3">
        {lista.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-gray-500">Nenhum aluno encontrado.</p>
          </div>
        ) : (
          lista.map((item) => (
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end flex-1">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Valor mensal
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formatMoneyInput(item.valor_mensalidade)}
                    onChange={(e) =>
                      atualizarCampo(
                        item.aluno_id,
                        "valor_mensalidade",
                        Number(e.target.value)
                      )
                    }
                    className="border rounded-xl p-2 w-full"
                    placeholder="Ex: 120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Dia do vencimento
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
                    placeholder="Ex: 10"
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
                    <span className="text-sm">Ativo no financeiro</span>
                  </label>
                </div>

                <div>
                  <button
                    onClick={async () => {
                      const ok = await salvarItem(item);
                      if (ok) {
                        alert(`Mensalidade de ${item.nome} salva com sucesso`);
                        await carregar();
                      }
                    }}
                    className="bg-black text-white px-4 py-2 rounded-xl w-full"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}