"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Save,
  RefreshCcw,
  Users,
  UserCheck,
  ShieldCheck,
  Search,
  Pencil,
  KeyRound,
  UserPlus,
} from "lucide-react";

type Usuario = {
  id: string;
  nome: string;
  usuario: string;
  tipo: string;
  ativo: boolean;
  academia_id: string;
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

function BadgeStatus({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        ativo
          ? "bg-green-100 text-green-700"
          : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

function BadgeTipo({ tipo }: { tipo: string }) {
  const t = String(tipo || "").toLowerCase();

  const style =
    t === "admin"
      ? "bg-blue-100 text-blue-700"
      : t === "recepcao"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-violet-100 text-violet-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${style}`}>
      {tipo}
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("personal");
  const [ativo, setAtivo] = useState(true);

  const [busca, setBusca] = useState("");

  const router = useRouter();

  const carregarUsuarios = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/usuarios", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar usuários");
        return;
      }

      setUsuarios(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar usuários");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarUsuarios();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const limparFormulario = () => {
    setEditandoId(null);
    setNome("");
    setUsuario("");
    setEmail("");
    setSenha("");
    setTipo("personal");
    setAtivo(true);
    setErro("");
  };

  const salvarUsuario = async () => {
    try {
      setErro("");

      if (!nome || !usuario || !tipo) {
        setErro("Preencha nome, usuário e tipo");
        return;
      }

      if (!editandoId && (!email || !senha)) {
        setErro("Preencha email e senha para criar usuário");
        return;
      }

      setSalvando(true);

      const payload = editandoId
        ? { nome, usuario, tipo, ativo }
        : { nome, usuario, email, senha, tipo };

      const res = await apiFetch(
        editandoId ? `/api/usuarios/${editandoId}` : "/api/usuarios/criar",
        {
          method: editandoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao salvar usuário");
        return;
      }

      limparFormulario();
      await carregarUsuarios();
    } finally {
      setSalvando(false);
    }
  };

  const editarUsuario = (item: Usuario) => {
    setEditandoId(item.id);
    setNome(item.nome || "");
    setUsuario(item.usuario || "");
    setEmail("");
    setSenha("");
    setTipo(item.tipo || "personal");
    setAtivo(Boolean(item.ativo));
    setErro("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetarSenha = async (id: string) => {
    const confirmar = confirm("Resetar a senha deste usuário para 123456?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/usuarios/${id}/reset-senha`, {
      method: "POST",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao resetar senha");
      return;
    }

    alert("Senha resetada com sucesso para 123456");
  };

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return usuarios;

    return usuarios.filter((item) => {
      const nome = String(item.nome || "").toLowerCase();
      const user = String(item.usuario || "").toLowerCase();
      const tipo = String(item.tipo || "").toLowerCase();

      return (
        nome.includes(termo) ||
        user.includes(termo) ||
        tipo.includes(termo)
      );
    });
  }, [usuarios, busca]);

  const totalUsuarios = usuarios.length;
  const totalAtivos = usuarios.filter((u) => u.ativo).length;
  const totalAdmins = usuarios.filter((u) => u.tipo === "admin").length;

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Sistema</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Usuários
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastro e gerenciamento de usuários da academia.
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
          subtitulo="Usuários cadastrados"
          icon={Users}
          cor="text-blue-600"
          bg="bg-blue-50"
        />
        <CardResumo
          titulo="Usuários ativos"
          valor={totalAtivos}
          subtitulo="Acessos liberados"
          icon={UserCheck}
          cor="text-green-600"
          bg="bg-green-50"
        />
        <CardResumo
          titulo="Administradores"
          valor={totalAdmins}
          subtitulo="Usuários com nível admin"
          icon={ShieldCheck}
          cor="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      <section className="rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-50 to-white shadow p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editandoId ? "Editar usuário" : "Novo usuário"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Cadastre novos acessos ou atualize usuários existentes.
            </p>
          </div>

          {editandoId ? (
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
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Nome
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Usuário
            </label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white"
              placeholder="usuario"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white"
            >
              <option value="admin">Admin</option>
              <option value="personal">Personal</option>
              <option value="recepcao">Recepção</option>
            </select>
          </div>

          {!editandoId ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  E-mail
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white"
                  placeholder="email@dominio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white"
                  placeholder="Senha"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                Situação
              </label>
              <label className="flex items-center gap-2 border rounded-xl px-3 py-3 bg-white h-[48px]">
                <input
                  id="ativo"
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                <span className="text-sm text-gray-700">Usuário ativo</span>
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={salvarUsuario}
            disabled={salvando}
            className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60 hover:bg-blue-700"
          >
            {editandoId ? <Save size={16} /> : <UserPlus size={16} />}
            {salvando
              ? "Salvando..."
              : editandoId
              ? "Atualizar usuário"
              : "Criar usuário"}
          </button>

          <button
            onClick={limparFormulario}
            className="inline-flex items-center gap-2 border border-black/10 bg-white hover:bg-zinc-50 px-5 py-3 rounded-xl"
          >
            <RefreshCcw size={16} />
            Limpar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              Usuários cadastrados
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Consulte, edite e redefina acessos.
            </p>
          </div>

          <div className="relative w-full xl:w-[340px]">
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

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="space-y-3">
            {usuariosFiltrados.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 bg-zinc-50/40 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900">{item.nome}</p>
                    <BadgeStatus ativo={item.ativo} />
                    <BadgeTipo tipo={item.tipo} />
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <p>Usuário: {item.usuario}</p>
                    <p>Academia: {item.academia_id}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => editarUsuario(item)}
                    className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl hover:bg-zinc-800"
                  >
                    <Pencil size={15} />
                    Editar
                  </button>

                  <button
                    onClick={() => resetarSenha(item.id)}
                    className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-xl hover:bg-orange-200"
                  >
                    <KeyRound size={15} />
                    Resetar senha
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