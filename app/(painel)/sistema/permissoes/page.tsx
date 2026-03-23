"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";
import {
  Activity,
  ArrowLeft,
  Save,
  ShieldCheck,
  Search,
  Users,
  BadgeCheck,
  LockKeyhole,
} from "lucide-react";

type Permissoes = {
  dashboard: boolean;
  alunos: boolean;
  personais: boolean;
  treinos: boolean;
  imprimir: boolean;
  pagamentos: boolean;
  financeiro: boolean;
  sistema: boolean;
  superadmin: boolean;
  alterar_senha: boolean;
  avaliacoes: boolean;
  whatsapp: boolean;
};

type UsuarioPermissao = {
  id: string;
  nome: string;
  usuario: string;
  tipo: string;
  ativo?: boolean;
  permissoes: Permissoes;
};

const colunas: { chave: keyof Permissoes; label: string }[] = [
  { chave: "dashboard", label: "Dashboard" },
  { chave: "alunos", label: "Alunos" },
  { chave: "personais", label: "Personais" },
  { chave: "treinos", label: "Treinos" },
  { chave: "imprimir", label: "Imprimir" },
  { chave: "pagamentos", label: "Pagamentos" },
  { chave: "financeiro", label: "Financeiro" },
  { chave: "sistema", label: "Sistema" },
  { chave: "alterar_senha", label: "Senha" },
  { chave: "avaliacoes", label: "Avaliações" },
  { chave: "whatsapp", label: "Whatsapp" },
];

function BadgeStatus({ ativo }: { ativo?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        ativo === false
          ? "bg-zinc-100 text-zinc-600"
          : "bg-green-100 text-green-700"
      }`}
    >
      {ativo === false ? "Inativo" : "Ativo"}
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

function PermissoesPageContent() {
  const router = useRouter();
  const [lista, setLista] = useState<UsuarioPermissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState("");
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      const res = await apiFetch("/api/sistema/permissoes", {
        cache: "no-store",
      });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar permissões");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar permissões");
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

  const atualizarPermissao = (
    userId: string,
    chave: keyof Permissoes,
    valor: boolean
  ) => {
    setLista((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              permissoes: {
                ...item.permissoes,
                [chave]: valor,
              },
            }
          : item
      )
    );
  };

  const salvar = async (item: UsuarioPermissao) => {
    try {
      setSalvandoId(item.id);

      const res = await apiFetch("/api/sistema/permissoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: item.id,
          permissoes: item.permissoes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao salvar permissões");
        return;
      }

      alert(`Permissões de ${item.nome} salvas com sucesso`);
      await carregar();
    } finally {
      setSalvandoId("");
    }
  };

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;

    return lista.filter((item) => {
      const nome = String(item.nome || "").toLowerCase();
      const usuario = String(item.usuario || "").toLowerCase();
      const tipo = String(item.tipo || "").toLowerCase();

      return (
        nome.includes(termo) ||
        usuario.includes(termo) ||
        tipo.includes(termo)
      );
    });
  }, [lista, busca]);

  const totalUsuarios = lista.length;
  const usuariosAtivos = lista.filter((u) => u.ativo !== false).length;
  const totalAdmins = lista.filter(
    (u) => u.tipo === "admin" || u.tipo === "superadmin"
  ).length;

  if (loading) {
    return <p className="p-6">Carregando permissões...</p>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Sistema</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Permissões
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Controle visual de acesso por usuário da academia.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[240px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
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
          titulo="Total de usuários"
          valor={totalUsuarios}
          subtitulo="Usuários carregados"
          icon={Users}
          cor="text-blue-600"
          bg="bg-blue-50"
        />
        <CardResumo
          titulo="Usuários ativos"
          valor={usuariosAtivos}
          subtitulo="Acessos em operação"
          icon={BadgeCheck}
          cor="text-green-600"
          bg="bg-green-50"
        />
        <CardResumo
          titulo="Nível administrativo"
          valor={totalAdmins}
          subtitulo="Admins e superadmins"
          icon={LockKeyhole}
          cor="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Usuários e permissões
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Marque ou desmarque os acessos disponíveis para cada usuário.
            </p>
          </div>

          <div className="relative w-full xl:w-[360px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, usuário ou tipo"
              className="w-full border rounded-xl p-3 pl-10"
            />
          </div>
        </div>

        {listaFiltrada.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="space-y-4">
            {listaFiltrada.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 space-y-4 bg-zinc-50/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900">{item.nome}</p>
                      <BadgeStatus ativo={item.ativo} />
                      <span className="inline-flex rounded-full bg-zinc-100 text-zinc-700 px-3 py-1 text-xs font-semibold">
                        {item.tipo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      @{item.usuario}
                    </p>
                  </div>

                  <button
                    onClick={() => salvar(item)}
                    disabled={salvandoId === item.id}
                    className="inline-flex items-center justify-center gap-2 bg-black text-white px-4 py-2 rounded-xl disabled:opacity-60"
                  >
                    <Save size={15} />
                    {salvandoId === item.id ? "Salvando..." : "Salvar permissões"}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {colunas.map((coluna) => (
                    <label
                      key={coluna.chave}
                      className="flex items-center gap-3 border rounded-xl px-3 py-3 bg-white hover:bg-zinc-50 transition"
                    >
                      <input
                        type="checkbox"
                        checked={!!item.permissoes[coluna.chave]}
                        onChange={(e) =>
                          atualizarPermissao(
                            item.id,
                            coluna.chave,
                            e.target.checked
                          )
                        }
                      />
                      <span className="text-sm font-medium">
                        {coluna.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PermissoesPage() {
  return (
    <ProtegePagina permissao="sistema">
      <PermissoesPageContent />
    </ProtegePagina>
  );
}