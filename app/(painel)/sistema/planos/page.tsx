"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Save,
  RefreshCcw,
  Wallet,
  Layers,
  Users,
  BadgeCheck,
  Pencil,
  ArrowLeft,
  Tag,
} from "lucide-react";

type Plano = {
  id?: number;
  nome: string;
  codigo: string;
  valor: number;
  tipo_cobranca: "mensal" | "trimestral" | "semestral" | "anual";
  limite_alunos?: number | null;
  ativo: boolean;
};

function formatBRL(valor?: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function BadgeStatus({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        ativo
          ? "bg-green-100 text-green-700"
          : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function CardResumo({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  cor = "text-gray-900",
  bg = "bg-white",
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icon: any;
  cor?: string;
  bg?: string;
}) {
  return (
    <div className={`${bg} rounded-2xl shadow p-5 border border-black/5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
          {subtitulo ? (
            <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
          ) : null}
        </div>

        <div className="w-11 h-11 rounded-2xl bg-white/70 border border-black/5 flex items-center justify-center shrink-0">
          <Icon size={18} className={cor} />
        </div>
      </div>
    </div>
  );
}

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

    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const totalPlanos = lista.length;
  const totalAtivos = lista.filter((p) => p.ativo).length;

  const tipoMaisComum = useMemo(() => {
    if (!lista.length) return tipoCobranca;

    const contagem: Record<string, number> = {};
    for (const item of lista) {
      contagem[item.tipo_cobranca] = (contagem[item.tipo_cobranca] || 0) + 1;
    }

    return Object.entries(contagem).sort((a, b) => b[1] - a[1])[0]?.[0] || "mensal";
  }, [lista, tipoCobranca]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Sistema</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">Planos</h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Gerencie os planos comerciais da academia.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[240px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status</p>
            <p className="text-xl font-black mt-1">Ativo</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push("/sistema")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 hover:bg-zinc-50 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardResumo
          titulo="Total de planos"
          valor={totalPlanos}
          subtitulo="Quantidade cadastrada"
          icon={Layers}
          cor="text-blue-600"
          bg="bg-blue-50"
        />

        <CardResumo
          titulo="Planos ativos"
          valor={totalAtivos}
          subtitulo="Disponíveis para uso"
          icon={BadgeCheck}
          cor="text-green-600"
          bg="bg-green-50"
        />

        <CardResumo
          titulo="Tipo mais usado"
          valor={tipoMaisComum}
          subtitulo="Padrão predominante"
          icon={Tag}
          cor="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <section className="rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-50 to-white shadow p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {id ? "Editar plano" : "Novo plano"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre ou atualize os planos comerciais da academia.
            </p>
          </div>

          {id ? (
            <span className="inline-flex rounded-full bg-yellow-100 text-yellow-700 px-3 py-1 text-xs font-semibold">
              Modo edição
            </span>
          ) : (
            <span className="inline-flex rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
              Novo cadastro
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Nome do plano
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Mensal Premium"
              className="w-full border rounded-xl p-3 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Código
            </label>
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ex: mensal"
              className="w-full border rounded-xl p-3 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Valor
            </label>
            <input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              className="w-full border rounded-xl p-3 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tipo de cobrança
            </label>
            <select
              value={tipoCobranca}
              onChange={(e) =>
                setTipoCobranca(e.target.value as Plano["tipo_cobranca"])
              }
              className="w-full border rounded-xl p-3 bg-white"
            >
              <option value="mensal">Mensal</option>
              <option value="trimestral">Trimestral</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Limite de alunos
            </label>
            <input
              type="number"
              value={limiteAlunos}
              onChange={(e) => setLimiteAlunos(e.target.value)}
              placeholder="Opcional"
              className="w-full border rounded-xl p-3 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Situação
            </label>
            <label className="flex items-center gap-2 border rounded-xl px-3 py-3 bg-white h-[48px]">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <span className="text-sm">Plano ativo</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            <Save size={16} />
            {salvando ? "Salvando..." : "Salvar plano"}
          </button>

          <button
            onClick={limpar}
            className="inline-flex items-center gap-2 border border-black/10 bg-white hover:bg-zinc-50 px-5 py-3 rounded-xl"
          >
            <RefreshCcw size={16} />
            Limpar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Planos cadastrados</h2>
            <p className="text-sm text-gray-500 mt-1">
              Visualize e edite os planos disponíveis.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando planos...</p>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhum plano cadastrado.
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-zinc-50/50 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{item.nome}</p>
                    <BadgeStatus ativo={item.ativo} />
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>Código: {item.codigo}</p>
                    <p>Valor: {formatBRL(item.valor)}</p>
                    <p>Cobrança: {item.tipo_cobranca}</p>
                    <p>
                      Limite de alunos:{" "}
                      {item.limite_alunos == null ? "-" : item.limite_alunos}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => editar(item)}
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800"
                  >
                    <Pencil size={15} />
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