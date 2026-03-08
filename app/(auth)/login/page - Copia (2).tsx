"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();

  const [academia, setAcademia] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    setErro("");
    setLoading(true);

    const a = academia.trim().toLowerCase();
    const u = usuario.trim().toLowerCase();

    if (!a || !u || !senha) {
      setErro("Preencha todos os campos");
      setLoading(false);
      return;
    }

    // ✅ seu padrão atual:
    const email = `${a}.${u}@treinoprint.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setErro("Academia, usuário ou senha inválidos");
      setLoading(false);
      return;
    }

    // ✅ salva pra usar no app (filtro por academia)
    localStorage.setItem("treinoprint_academia", a);
    localStorage.setItem("treinoprint_usuario", u);

    router.push("/");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image src="/logo-sistema.png" alt="TreinoPrint" width={70} height={70} priority />
          <h1 className="text-3xl font-extrabold tracking-tight">TreinoPrint</h1>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Academia"
            value={academia}
            onChange={(e) => setAcademia(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="text"
            placeholder="Usuário"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border p-3 rounded"
            onKeyDown={(e) => e.key === "Enter" && entrar()}
          />

          {erro && <p className="text-red-500 text-sm">{erro}</p>}

          <button
            onClick={entrar}
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Versão MVP v1</p>
        <p>By Lamarck Carregosa - 2026</p>
      </div>
    </main>
  );
}