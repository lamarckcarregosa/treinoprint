"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function AlterarSenhaPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [loading, setLoading] = useState(false);

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
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold mb-2">Alterar senha</h1>
        <p className="text-sm text-gray-500 mb-6">
          Defina uma nova senha para sua conta
        </p>

        <div className="space-y-4">
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            className="w-full border p-3 rounded"
          />

          {erro && <p className="text-red-500 text-sm">{erro}</p>}
          {sucesso && <p className="text-green-600 text-sm">{sucesso}</p>}

          <button
            onClick={salvar}
            disabled={loading}
            className="w-full bg-black text-white p-3 rounded disabled:opacity-60"
          >
            {loading ? "Salvando..." : "Alterar senha"}
          </button>
        </div>
      </div>
    </main>
  );
}