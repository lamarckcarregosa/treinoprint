"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


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

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
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

  const router = useRouter();

  const carregarUsuarios = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/usuarios", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar usuários");
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
        setErro(json.error || "Erro ao salvar usuário");
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
      alert(json.error || "Erro ao resetar senha");
      return;
    }

    alert("Senha resetada com sucesso para 123456");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Usuários</h1>
        <p className="text-gray-500 mt-2">Cadastro e gerenciamento de usuários da academia</p>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-semibold">
            {editandoId ? "Editar usuário" : "Novo usuário"}
          </h2>
        <button
        onClick={() => router.push("/sistema")}
        className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
      >
        Voltar
      </button>
    

          {editandoId ? (
            <button
              onClick={limparFormulario}
              className="text-sm px-4 py-2 rounded-xl border"
            >
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Usuário</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full border rounded-xl p-3"
              placeholder="usuario"
            />
          </div>

          {!editandoId ? (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">E-mail</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded-xl p-3"
                  placeholder="email@dominio.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full border rounded-xl p-3"
                  placeholder="Senha"
                />
              </div>
            </>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full border rounded-xl p-3"
            >
              <option value="admin">Admin</option>
              <option value="personal">Personal</option>
              <option value="recepcao">Recepção</option>
            </select>
          </div>

          {editandoId ? (
            <div className="flex items-center gap-2 pt-8">
              <input
                id="ativo"
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <label htmlFor="ativo" className="text-sm text-gray-700">
                Usuário ativo
              </label>
            </div>
          ) : null}
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          onClick={salvarUsuario}
          disabled={salvando}
          className="bg-blue-600 text-white rounded-xl px-5 py-3 disabled:opacity-60"
        >
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar usuário"
            : "Criar usuário"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold mb-4">Usuários cadastrados</h2>

        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : usuarios.length === 0 ? (
          <p className="text-gray-500">Nenhum usuário cadastrado.</p>
        ) : (
          <div className="space-y-3">
            {usuarios.map((item) => (
              <div key={item.id} className="border rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{item.nome}</p>
                    <p className="text-sm text-gray-600">Usuário: {item.usuario}</p>
                    <p className="text-sm text-gray-600">Tipo: {item.tipo}</p>
                    <p className="text-sm text-gray-600">
                      Status: {item.ativo ? "Ativo" : "Inativo"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => editarUsuario(item)}
                      className="text-blue-600 text-sm"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => resetarSenha(item.id)}
                      className="text-orange-600 text-sm"
                    >
                      Resetar senha
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}