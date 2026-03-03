"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    setErro("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (error) {
      setErro("Email ou senha inválidos");
      return;
    }

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* CARD */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image
            src="/logo-sistema.png"
            alt="TreinoPrint"
            width={70}
            height={70}
            priority
          />
          <h1 className="text-3xl font-extrabold tracking-tight">TreinoPrint</h1>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-blue-50 border border-blue-100 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full rounded-md bg-blue-50 border border-blue-100 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
          />

          {erro && <p className="text-red-600 text-sm">{erro}</p>}

          <button
            onClick={entrar}
            disabled={loading}
            className="w-full bg-black text-white rounded-md py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Versão MVP v1</p>
        <p>By Lamarck Carregosa - 2026</p>
      </div>
    </main>
  );
}