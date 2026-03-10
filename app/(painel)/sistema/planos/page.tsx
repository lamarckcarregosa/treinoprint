"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Plano = {
  id?: number;
  nome: string;
  codigo: string;
  valor: number;
  tipo_cobranca: "mensal" | "trimestral" | "semestral" | "anual";
  limite_alunos?: number | null;
  ativo: boolean;
};

export default function PlanosPage() {
  const router = useRouter();

  const [lista, setLista] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [id, setId] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [valor, setValor] = useState("");
  const [tipoCobranca, setTipoCobranca] =
    useState<Plano["tipo_cobranca"]>("mensal");
  const [limiteAlunos, setLimiteAlunos] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = async () => {
    try {
      setErro("");

      const res = await fetch("/api/planos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar planos");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const limpar = () => {
    setId(null);
    setNome("");
    setCodigo("");
    setValor("");
    setTipoCobranca("mensal");
    setLimiteAlunos("");
    setAtivo(true);
  };

  const editar = (item: Plano) => {
    setId(item.id || null);
    setNome(item.nome || "");
    setCodigo(item.codigo || "");
    setValor(String(item.valor || ""));
    setTipoCobranca(item.tipo_cobranca || "mensal");
    setLimiteAlunos(
      item.limite_alunos == null ? "" : String(item.limite_alunos)
    );
    setAtivo(Boolean(item.ativo));
  };

  const salvar = async () => {
    try {
      if (!nome.trim() || !codigo.trim()) {
        alert("Nome e código são obrigatórios");
        return;
      }

      setSalvando(true);

      const res = await fetch("/api/planos/salvar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          nome: nome.trim(),
          codigo: codigo.trim().toLowerCase(),
          valor: Number(valor || 0),
          tipo_cobranca: tipoCobranca,
          limite_alunos: limiteAlunos === "" ? null : Number(limiteAlunos),
          ativo,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.error || "Erro ao salvar plano");
        return;
      }

      alert("Plano salvo com sucesso");
      limpar();
      await carregar();
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Planos</h1>
          <p className="text-gray-500 mt-2">
            Cadastre e gerencie os planos comerciais dos alunos.
          </p>
        </div>

        <button
          onClick={() => router.push("/sistema")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          {id ? "Editar plano" : "Novo plano"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome"
            className="border rounded-xl p-3"
          />

          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder="Código"
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

          <select
            value={tipoCobranca}
            onChange={(e) =>
              setTipoCobranca(e.target.value as Plano["tipo_cobranca"])
            }
            className="border rounded-xl p-3"
          >
            <option value="mensal">Mensal</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="anual">Anual</option>
          </select>

          <input
            type="number"
            value={limiteAlunos}
            onChange={(e) => setLimiteAlunos(e.target.value)}
            placeholder="Limite de alunos"
            className="border rounded-xl p-3"
          />

          <label className="flex items-center gap-2 border rounded-xl px-3 py-3">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
            />
            <span>Plano ativo</span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar plano"}
          </button>

          <button
            onClick={limpar}
            className="bg-zinc-700 text-white px-5 py-3 rounded-xl"
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Planos cadastrados</h2>

        {loading ? (
          <p className="text-gray-500">Carregando planos...</p>
        ) : lista.length === 0 ? (
          <p className="text-gray-500">Nenhum plano cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {lista.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.nome}</p>
                  <p className="text-sm text-gray-500">Código: {item.codigo}</p>
                  <p className="text-sm text-gray-500">
                    Valor:{" "}
                    {Number(item.valor || 0).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">
                    Cobrança: {item.tipo_cobranca}
                  </p>
                  <p className="text-sm text-gray-500">
                    Limite alunos:{" "}
                    {item.limite_alunos == null ? "-" : item.limite_alunos}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.ativo ? "Ativo" : "Inativo"}
                  </span>

                  <button
                    onClick={() => editar(item)}
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