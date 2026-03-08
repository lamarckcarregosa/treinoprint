"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

type Academia = {
  id: string;
  nome: string;
  slug: string;
};

export default function Login() {
  const router = useRouter();

  const [academias, setAcademias] = useState<Academia[]>([]);
  const [academia, setAcademia] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAcademias, setLoadingAcademias] = useState(true);

  useEffect(() => {
    carregarAcademias();
  }, []);

  const carregarAcademias = async () => {
  try {
    setLoadingAcademias(true);
    setErro("");

    const academiaSalva = localStorage.getItem("treinoprint_academia");

    const res = await fetch("/api/academias");
    const json = await res.json();

    if (!res.ok) {
      setErro(json.error || "Erro ao carregar academias");
      return;
    }

    const lista = json.academias || [];
    setAcademias(lista);

    if (academiaSalva) {
      const existe = lista.find((item: Academia) => item.slug === academiaSalva);
      if (existe) setAcademia(academiaSalva);
    }
  } catch {
    setErro("Erro ao carregar academias");
  } finally {
    setLoadingAcademias(false);
  }
};

  const entrar = async () => {
    setErro("");
    setLoading(true);

    const a = academia.trim().toLowerCase();
    const u = usuario.trim().toLowerCase();

    if (!a || !u || !senha) {
      setErro("Selecione a academia e preencha usuário e senha");
      setLoading(false);
      return;
    }

    const { data, error: rpcError } = await supabase.rpc("buscar_email_login", {
      p_academia_slug: a,
      p_usuario: u,
    });

    if (rpcError || !data || data.length === 0 || !data[0]?.email) {
      setErro("Academia ou usuário não encontrado");
      setLoading(false);
      return;
    }

    const email = data[0].email;

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (loginError) {
      setErro("Usuário ou senha inválidos");
      setLoading(false);
      return;
    }

    const academiaSelecionada = academias.find((item) => item.slug === a);

    if (academiaSelecionada) {
      localStorage.setItem("treinoprint_academia_id", academiaSelecionada.id);
      localStorage.setItem("treinoprint_academia", academiaSelecionada.slug);
      localStorage.setItem("treinoprint_academia_nome", academiaSelecionada.nome);
    }

    localStorage.setItem("treinoprint_usuario", u);

    router.push("/");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-100 via-gray-100 to-zinc-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl border border-gray-200 p-8">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="mb-4 rounded-2xl bg-black p-3 shadow-lg">
              <Image
                src="/logo-sistema.png"
                alt="TreinoPrint"
                width={72}
                height={72}
                priority
                className="rounded-lg"
              />
            </div>

            <h1 className="text-3xl font-black tracking-tight text-gray-900">
              TreinoPrint
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Acesse sua conta para gerenciar treinos e alunos
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Academia
              </label>
              <select
                value={academia}
                onChange={(e) => setAcademia(e.target.value)}
                disabled={loadingAcademias || loading}
                className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 rounded-xl bg-white disabled:bg-gray-100 transition"
              >
                <option value="">
                  {loadingAcademias
                    ? "Carregando academias..."
                    : "Selecione a academia"}
                </option>

                {academias.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuário
              </label>
              <input
                type="text"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                disabled={loading}
                className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 rounded-xl transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha
              </label>

              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && entrar()}
                  className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 pr-16 rounded-xl transition"
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-600 hover:text-black"
                >
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {erro && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-red-600 text-sm">{erro}</p>
              </div>
            )}

            <button
              onClick={entrar}
              disabled={loading || loadingAcademias}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold p-3 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Versão MVP v1</p>
          <p>By Lamarck Carregosa - 2026</p>
        </div>
      </div>
    </main>
  );
}