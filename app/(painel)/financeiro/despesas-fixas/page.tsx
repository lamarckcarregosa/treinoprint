"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DespesaFixa = {
  id: number;
  descricao: string;
  categoria: string;
  valor: number;
  dia_vencimento: number;
  ativo: boolean;
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

export default function DespesasFixasPage() {
  const router = useRouter();

  const [lista, setLista] = useState<DespesaFixa[]>([]);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [dia, setDia] = useState("5");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    const res = await apiFetch("/api/financeiro/despesas-fixas", {
      cache: "no-store",
    });
    const json = await res.json().catch(() => []);

    if (!res.ok) {
      setErro(json.error || "Erro ao carregar despesas fixas");
      return;
    }

    setLista(Array.isArray(json) ? json : []);
  };

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    setErro("");

    const res = await apiFetch("/api/financeiro/despesas-fixas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        descricao,
        categoria,
        valor: Number(valor),
        dia_vencimento: Number(dia),
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      setErro(json.error || "Erro ao cadastrar despesa fixa");
      return;
    }

    setDescricao("");
    setCategoria("");
    setValor("");
    setDia("5");
    await carregar();
  }

  const atualizarCampo = (
    id: number,
    campo: keyof DespesaFixa,
    valor: string | number | boolean
  ) => {
    setLista((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  };

  const salvarEdicao = async (item: DespesaFixa) => {
    const res = await apiFetch(`/api/financeiro/despesas-fixas/${item.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || "Erro ao atualizar despesa fixa");
      return;
    }

    alert("Despesa fixa atualizada com sucesso");
    await carregar();
  };

  const excluir = async (id: number) => {
    const confirmar = confirm("Excluir esta despesa fixa?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/financeiro/despesas-fixas/${id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || "Erro ao excluir despesa fixa");
      return;
    }

    await carregar();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Despesas fixas</h1>
          <p className="text-gray-500 mt-2">
            Cadastre despesas recorrentes como aluguel, internet e equipe
          </p>
        </div>

        <button
          onClick={() => router.push("/financeiro")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

      <div className="bg-white rounded-xl p-6 space-y-3">
        <input
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />

        <input
          placeholder="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />

        <input
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />

        <input
          placeholder="Dia vencimento"
          value={dia}
          onChange={(e) => setDia(e.target.value)}
          className="border p-3 rounded-xl w-full"
        />

        <button
          onClick={salvar}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Cadastrar despesa fixa
        </button>
      </div>

      <div className="space-y-3">
        {lista.length === 0 ? (
          <div className="bg-white rounded-xl p-4">
            <p className="text-gray-500">Nenhuma despesa fixa cadastrada.</p>
          </div>
        ) : (
          lista.map((d) => (
            <div key={d.id} className="border p-4 rounded-xl bg-white space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Descrição</label>
                  <input
                    value={d.descricao}
                    onChange={(e) => atualizarCampo(d.id, "descricao", e.target.value)}
                    className="border p-2 rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Categoria</label>
                  <input
                    value={d.categoria || ""}
                    onChange={(e) => atualizarCampo(d.id, "categoria", e.target.value)}
                    className="border p-2 rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Valor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={d.valor}
                    onChange={(e) => atualizarCampo(d.id, "valor", Number(e.target.value))}
                    className="border p-2 rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Dia venc.</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={d.dia_vencimento}
                    onChange={(e) =>
                      atualizarCampo(d.id, "dia_vencimento", Number(e.target.value))
                    }
                    className="border p-2 rounded-xl w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Ativa</label>
                  <label className="flex items-center gap-2 border rounded-xl px-3 py-2">
                    <input
                      type="checkbox"
                      checked={d.ativo}
                      onChange={(e) => atualizarCampo(d.id, "ativo", e.target.checked)}
                    />
                    <span className="text-sm">{d.ativo ? "Sim" : "Não"}</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => salvarEdicao(d)}
                  className="bg-black text-white px-4 py-2 rounded-xl"
                >
                  Salvar alterações
                </button>

                <button
                  onClick={() => excluir(d.id)}
                  className="bg-red-600 text-white px-4 py-2 rounded-xl"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}