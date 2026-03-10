"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";

export default function AlterarSenhaPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const salvar = async () => {
    setErro("");
    setSucesso("");
    setLoading(true);

    if (!novaSenha || !confirmarSenha) {
      setErro("Preencha os campos");
      setLoading(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não coincidem");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: novaSenha,
    });

    if (error) {
      setErro(error.message);
      setLoading(false);
      return;
    }

    setSucesso("Senha alterada com sucesso");
    setNovaSenha("");
    setConfirmarSenha("");
    setLoading(false);
  };

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Alterar senha</h1>
          <p className="text-gray-500 mt-2">
            Atualize sua senha de acesso ao sistema
          </p>
        </div>

        <button
          onClick={() => router.push("/sistema")}
          className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 max-w-xl">
        <h2 className="text-xl font-bold mb-2">Nova senha</h2>
        <p className="text-sm text-gray-500 mb-6">
          Defina uma nova senha para sua conta
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 rounded-xl transition"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/10 outline-none p-3 rounded-xl transition"
          />

          {erro ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm">{erro}</p>
            </div>
          ) : null}

          {sucesso ? (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-green-600 text-sm">{sucesso}</p>
            </div>
          ) : null}

          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded-xl disabled:opacity-60 hover:bg-gray-900 transition"
          >
            {loading ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </section>
    </main>
  );
}