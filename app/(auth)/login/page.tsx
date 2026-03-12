"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Eye, EyeOff, LogIn, Building2, User, Lock } from "lucide-react";
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
        setErro((json as any).error || "Erro ao carregar academias");
        return;
      }

      const lista = (json as any).academias || [];
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

  const carregarDadosAcademia = async (academiaId: string) => {
    try {
      const res = await fetch("/api/minha-academia", {
        headers: {
          "x-academia-id": academiaId,
        },
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        return;
      }

      localStorage.setItem("treinoprint_academia_nome", (json as any).nome || "");
      localStorage.setItem("treinoprint_academia_logo", (json as any).logo_url || "");

      window.dispatchEvent(new Event("treinoprint-academia-updated"));
    } catch (error) {
      console.error("Erro ao carregar dados da academia:", error);
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
      localStorage.setItem("treinoprint_academia_nome", academiaSelecionada.nome || "");

      if (academiaSelecionada.logo_url && academiaSelecionada.logo_url.trim() !== "") {
        localStorage.setItem("treinoprint_academia_logo", academiaSelecionada.logo_url);
      } else {
        localStorage.removeItem("treinoprint_academia_logo");
      }

      window.dispatchEvent(new Event("treinoprint-academia-updated"));

      await salvarPermissoesUsuario(profile.id, academiaSelecionada.id);
      await carregarDadosAcademia(academiaSelecionada.id);

      router.push("/");
    } catch (err) {
      console.error("Erro inesperado no login:", err);
      setErro("Erro inesperado ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#05070b] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute -top-32 -left-20 w-[380px] h-[380px] rounded-full bg-[#7CFC00]/10 blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-[#7CFC00]/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(124,252,0,0.08),transparent_35%)]" />
      </div>

      <div className="relative min-h-screen grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden lg:flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="max-w-xl">
            <Image
              src="/logo-sistemas.png"
              alt="TreinoPrint"
              width={320}
              height={140}
              priority
              className="w-[300px] xl:w-[320px] h-auto object-contain"
            />

            <h1 className="mt-1 text-5xl font-black leading-tight">
              Gestão inteligente
              <span className="text-[#7CFC00]"> para academias</span>
            </h1>

            <p className="mt-3 text-white/75 text-lg leading-relaxed max-w-lg">
              Controle alunos, treinos, pagamentos, impressões e acesso em um
              sistema moderno, rápido e preparado para a rotina da sua academia.
            </p>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[#7CFC00] text-2xl font-black">01</p>
                <p className="text-sm text-white/70 mt-2">
                  Treinos impressos com agilidade
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[#7CFC00] text-2xl font-black">02</p>
                <p className="text-sm text-white/70 mt-2">
                  Controle financeiro integrado
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[#7CFC00] text-2xl font-black">03</p>
                <p className="text-sm text-white/70 mt-2">
                  Catraca e recepção mais rápidas
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Image
                src="/logo-sistema.png"
                alt="TreinoPrint"
                width={260}
                height={120}
                priority
                className="w-64 max-w-full mx-auto h-auto object-contain"
              />
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white shadow-2xl p-6 sm:p-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900">Entrar</h2>
                <p className="text-gray-500 mt-2">
                  Acesse sua conta para gerenciar sua academia
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Academia
                  </label>
                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Ex: crisfitness"
                      value={academia}
                      onChange={(e) => setAcademia(e.target.value)}
                      disabled={loading || loadingAcademias}
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-11 pr-4 outline-none focus:border-[#7CFC00] focus:ring-4 focus:ring-[#7CFC00]/20 transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Para superadmin, esse campo pode ficar em branco.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Usuário ou E-mail
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="usuario ou email"
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      disabled={loading}
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-11 pr-4 outline-none focus:border-[#7CFC00] focus:ring-4 focus:ring-[#7CFC00]/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Senha
                  </label>

                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      placeholder="Digite sua senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      disabled={loading}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="w-full h-14 rounded-2xl border border-gray-300 pl-11 pr-14 outline-none focus:border-[#7CFC00] focus:ring-4 focus:ring-[#7CFC00]/20 transition"
                    />

                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {erro ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erro}
                  </div>
                ) : null}

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full h-14 rounded-2xl bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  {loading ? "Entrando..." : "Entrar no TreinoPrint"}
                </button>
              </div>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">
                  TreinoPrint • Gestão de Academias
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}