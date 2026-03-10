"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Academia = {
  id: string;
  nome: string;
  plano?: string | null;
  ativa?: boolean;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  cnpj?: string | null;
  limite_alunos?: number | null;
  created_at?: string | null;
};

export default function ListaAcademiasPage() {
  const router = useRouter();

  const [lista, setLista] = useState<Academia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const carregar = async () => {
    try {
      setErro("");

      const res = await fetch("/api/superadmin/academias", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar academias");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar academias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const planos = useMemo(() => {
    const unicos = Array.from(new Set(lista.map((item) => item.plano || "sem plano")));
    return unicos.sort();
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    let dados = [...lista];

    const termo = busca.trim().toLowerCase();
    if (termo) {
      dados = dados.filter((item) => {
        return (
          (item.nome || "").toLowerCase().includes(termo) ||
          (item.telefone || "").toLowerCase().includes(termo) ||
          (item.email || "").toLowerCase().includes(termo) ||
          (item.cnpj || "").toLowerCase().includes(termo)
        );
      });
    }

    if (filtroPlano !== "todos") {
      dados = dados.filter((item) => (item.plano || "sem plano") === filtroPlano);
    }

    if (filtroStatus !== "todos") {
      dados = dados.filter((item) =>
        filtroStatus === "ativas" ? item.ativa === true : item.ativa === false
      );
    }

    return dados;
  }, [lista, busca, filtroPlano, filtroStatus]);

  if (loading) {
    return <p className="p-6">Carregando academias...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Lista de academias</h1>
          <p className="text-gray-500 mt-2">
            Pesquise, filtre e abra academias cadastradas no sistema.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/superadmin")}
            className="bg-zinc-700 text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>

          <button
            onClick={() => router.push("/superadmin/academias")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            Nova academia
          </button>
        </div>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, telefone, e-mail ou CNPJ"
            className="border rounded-xl p-3"
          />

          <select
            value={filtroPlano}
            onChange={(e) => setFiltroPlano(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todos">Todos os planos</option>
            {planos.map((plano) => (
              <option key={plano} value={plano}>
                {plano}
              </option>
            ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="border rounded-xl p-3"
          >
            <option value="todos">Todas</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Academias encontradas</h2>
          <span className="text-sm text-gray-500">{listaFiltrada.length} resultado(s)</span>
        </div>

        {listaFiltrada.length === 0 ? (
          <p className="text-gray-500">Nenhuma academia encontrada.</p>
        ) : (
          <div className="space-y-3">
            {listaFiltrada.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">{item.nome}</p>
                  <p className="text-sm text-gray-500">Plano: {item.plano || "-"}</p>
                  <p className="text-sm text-gray-500">
                    {item.telefone || "-"} {item.email ? `• ${item.email}` : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    CNPJ: {item.cnpj || "-"} • Limite:{" "}
                    {item.limite_alunos == null ? "-" : item.limite_alunos}
                  </p>
                  {item.endereco ? (
                    <p className="text-sm text-gray-500">Endereço: {item.endereco}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.ativa
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.ativa ? "Ativa" : "Inativa"}
                  </span>

                  <button
                    onClick={() => router.push(`/superadmin/academias/editar/${item.id}`)}
                    className="bg-black text-white px-4 py-2 rounded-xl"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}