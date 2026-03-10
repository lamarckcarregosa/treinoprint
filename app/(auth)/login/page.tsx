"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { useRouter } from "next/navigation";

type Academia = {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string | null;
};

const MAPA_SUPERADMIN: Record<string, string> = {
  superadmin: "superadmin@treinoprint.com",
  "superadmin@treinoprint.com": "superadmin@treinoprint.com",
  lamarck: "lamarck16@gmail.com",
  "lamarck16@gmail.com": "lamarck16@gmail.com",
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

      const academiaSalva =
        typeof window !== "undefined"
          ? localStorage.getItem("treinoprint_academia")
          : null;

      const res = await fetch("/api/academias");
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar academias");
        return;
      }

      const lista = json.academias || [];
      setAcademias(lista);

      if (academiaSalva) {
        setAcademia(academiaSalva);
      }
    } catch (err) {
      console.error("Erro ao carregar academias:", err);
      setErro("Erro ao carregar academias");
    } finally {
      setLoadingAcademias(false);
    }
  };

  const salvarPermissoesUsuario = async (
    profileId: string,
    academiaId?: string | null
  ) => {
    try {
      if (!academiaId) {
        localStorage.removeItem("treinoprint_permissoes");
        window.dispatchEvent(new Event("treinoprint-permissoes-updated"));
        return;
      }

      const res = await fetch("/api/usuarios/permissoes", {
        headers: {
          "x-academia-id": academiaId,
          "x-profile-id": profileId,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        localStorage.removeItem("treinoprint_permissoes");
        window.dispatchEvent(new Event("treinoprint-permissoes-updated"));
        return;
      }

      localStorage.setItem("treinoprint_permissoes", JSON.stringify(json));
      window.dispatchEvent(new Event("treinoprint-permissoes-updated"));
    } catch {
      localStorage.removeItem("treinoprint_permissoes");
      window.dispatchEvent(new Event("treinoprint-permissoes-updated"));
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      setErro("");

      const academiaDigitada = academia.trim().toLowerCase();
      const usuarioDigitado = usuario.trim().toLowerCase();

      if (!usuarioDigitado || !senha) {
        setErro("Preencha usuário ou email e senha");
        return;
      }

      let emailLogin = "";

      if (MAPA_SUPERADMIN[usuarioDigitado]) {
        emailLogin = MAPA_SUPERADMIN[usuarioDigitado];
      } else if (usuarioDigitado.includes("@")) {
        emailLogin = usuarioDigitado;
      } else {
        if (!academiaDigitada) {
          setErro("Informe a academia para usuário comum");
          return;
        }

        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "buscar_email_login",
          {
            p_academia_slug: academiaDigitada,
            p_usuario: usuarioDigitado,
          }
        );

        if (rpcError) {
          console.error("Erro RPC buscar_email_login:", rpcError);
          setErro("Erro ao localizar usuário");
          return;
        }

        if (!rpcData || rpcData.length === 0 || !rpcData[0]?.email) {
          setErro("Academia ou usuário não encontrado");
          return;
        }

        emailLogin = String(rpcData[0].email).toLowerCase();
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: emailLogin,
          password: senha,
        });

      if (authError) {
        console.error("Erro login:", authError);
        setErro("Usuário ou senha inválidos");
        return;
      }

      const userId = authData?.user?.id;
      if (!userId) {
        setErro("Não foi possível identificar o usuário");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, usuario, tipo, academia_id")
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Erro ao buscar profile:", profileError);
        setErro("Perfil do usuário não encontrado");
        return;
      }

      localStorage.setItem("treinoprint_usuario", profile.usuario || usuarioDigitado);
      localStorage.setItem("treinoprint_user_id", profile.id);
      localStorage.setItem("treinoprint_user_nome", profile.nome || "");
      localStorage.setItem("treinoprint_user_tipo", profile.tipo || "");

      if (profile.tipo === "superadmin") {
        localStorage.removeItem("treinoprint_academia_id");
        localStorage.removeItem("treinoprint_academia");
        localStorage.removeItem("treinoprint_academia_nome");
        localStorage.removeItem("treinoprint_academia_logo");
        localStorage.removeItem("treinoprint_permissoes");

        window.dispatchEvent(new Event("treinoprint-academia-updated"));
        window.dispatchEvent(new Event("treinoprint-permissoes-updated"));

        router.push("/superadmin");
        return;
      }

      if (!academiaDigitada) {
        setErro("Informe a academia");
        return;
      }

      const academiaSelecionada = academias.find(
        (item) => item.slug?.toLowerCase() === academiaDigitada
      );

      if (!academiaSelecionada) {
        setErro("Academia não encontrada");
        return;
      }

      localStorage.setItem("treinoprint_academia_id", academiaSelecionada.id);
      localStorage.setItem("treinoprint_academia", academiaSelecionada.slug);
      localStorage.setItem("treinoprint_academia_nome", academiaSelecionada.nome);

      if (academiaSelecionada.logo_url) {
        localStorage.setItem("treinoprint_academia_logo", academiaSelecionada.logo_url);
      } else {
        localStorage.removeItem("treinoprint_academia_logo");
      }

      window.dispatchEvent(new Event("treinoprint-academia-updated"));

      await salvarPermissoesUsuario(profile.id, academiaSelecionada.id);

      if (profile.tipo === "admin") {
        router.push("/");
      } else if (profile.tipo === "personal") {
        router.push("/treinos");
      } else if (profile.tipo === "recepcao") {
        router.push("/alunos");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setErro("Erro inesperado ao entrar");
    } finally {
      setLoading(false);
    }
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
              <input
                type="text"
                placeholder="Ex: crisfitness"
                value={academia}
                onChange={(e) => setAcademia(e.target.value)}
                disabled={loading || loadingAcademias}
                className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 rounded-xl transition"
              />
              <p className="text-xs text-gray-400 mt-2">
                Para superadmin, esse campo pode ficar em branco.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usuário ou Email
              </label>
              <input
                type="text"
                placeholder="usuario ou email"
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
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 pr-20 rounded-xl transition"
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
              onClick={handleLogin}
              disabled={loading}
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