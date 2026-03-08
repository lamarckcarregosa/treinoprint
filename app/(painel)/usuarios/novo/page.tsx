"use client";

import { useEffect, useState } from "react";

type Academia = {
  id: string;
  nome: string;
  slug: string;
};

export default function NovoUsuarioPage() {
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [academiaId, setAcademiaId] = useState("");
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("personal");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loadingAcademias, setLoadingAcademias] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    carregarAcademias();
  }, []);

  const carregarAcademias = async () => {
    try {
      setLoadingAcademias(true);
      setErro("");

      const res = await fetch("/api/academias");
      const json = await res.json();

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar academias");
        return;
      }

      setAcademias(json.academias || []);
    } catch {
      setErro("Erro ao carregar academias");
    } finally {
      setLoadingAcademias(false);
    }
  };

  const cadastrar = async () => {
    try {
      setErro("");
      setSucesso("");
      setLoading(true);

      if (!academiaId || !nome || !usuario || !email || !senha || !tipo) {
        setErro("Preencha todos os campos");
        return;
      }

      const res = await fetch("/api/usuarios/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          academia_id: academiaId,
          nome,
          usuario,
          email,
          senha,
          tipo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErro(json.error || "Erro ao cadastrar usuário");
        return;
      }

      setSucesso("Usuário cadastrado com sucesso");
      setNome("");
      setUsuario("");
      setEmail("");
      setSenha("");
      setTipo("personal");
    } catch {
      setErro("Erro ao cadastrar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900">Novo usuário</h1>
            <p className="text-sm text-gray-500 mt-2">
              Cadastre usuários vinculados a uma academia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academia
              </label>
              <select
                value={academiaId}
                onChange={(e) => setAcademiaId(e.target.value)}
                disabled={loading || loadingAcademias}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              >
                <option value="">
                  {loadingAcademias ? "Carregando academias..." : "Selecione a academia"}
                </option>

                {academias.map((academia) => (
                  <option key={academia.id} value={academia.id}>
                    {academia.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                placeholder="usuario"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@dominio.com"
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 rounded-xl p-3 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              >
                <option value="admin">Admin</option>
                <option value="personal">Personal</option>
                <option value="recepcao">Recepção</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Digite a senha"
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-xl p-3 pr-24 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          {sucesso && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-700">{sucesso}</p>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={cadastrar}
              disabled={loading || loadingAcademias}
              className="w-full bg-black text-white rounded-xl p-3 font-semibold hover:bg-gray-900 disabled:opacity-60"
            >
              {loading ? "Cadastrando..." : "Cadastrar usuário"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}