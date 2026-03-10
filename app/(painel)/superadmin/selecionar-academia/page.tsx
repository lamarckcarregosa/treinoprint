"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Academia = {
  id: string;
  nome: string;
  slug?: string | null;
  logo_url?: string | null;
  plano?: string | null;
  ativa?: boolean;
};

export default function SelecionarAcademiaPage() {
  const router = useRouter();

  const [lista, setLista] = useState<Academia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

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

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;

    return lista.filter((item) => {
      return (
        (item.nome || "").toLowerCase().includes(termo) ||
        (item.slug || "").toLowerCase().includes(termo) ||
        (item.plano || "").toLowerCase().includes(termo)
      );
    });
  }, [lista, busca]);

  const acessarAcademia = (item: Academia) => {
    localStorage.setItem("treinoprint_academia_id", item.id);
    localStorage.setItem("treinoprint_academia_nome", item.nome || "");

    if (item.slug) {
      localStorage.setItem("treinoprint_academia", item.slug);
    } else {
      localStorage.removeItem("treinoprint_academia");
    }

    if (item.logo_url) {
      localStorage.setItem("treinoprint_academia_logo", item.logo_url);
    } else {
      localStorage.removeItem("treinoprint_academia_logo");
    }

    window.dispatchEvent(new Event("treinoprint-academia-updated"));

    router.push("/dashboard");
  };

  if (loading) {
    return <p className="p-6">Carregando academias...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Selecionar academia
          </h1>
          <p className="text-gray-500 mt-2">
            Escolha uma academia para entrar no painel dela.
          </p>
        </div>

        <button
          onClick={() => router.push("/superadmin")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, slug ou plano"
          className="border rounded-xl p-3 w-full md:w-[360px]"
        />
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        {listaFiltrada.length === 0 ? (
          <p className="text-gray-500">Nenhuma academia encontrada.</p>
        ) : (
          <div className="space-y-3">
            {listaFiltrada.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  {item.logo_url ? (
                    <img
                      src={item.logo_url}
                      alt={item.nome}
                      className="w-14 h-14 rounded-2xl object-cover border"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border" />
                  )}

                  <div>
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      {item.slug || "-"} • Plano: {item.plano || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.ativa ? "Ativa" : "Inativa"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => acessarAcademia(item)}
                  className="bg-emerald-600 text-white px-5 py-3 rounded-xl"
                >
                  Acessar academia
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}