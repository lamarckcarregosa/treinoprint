"use client";

import { useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";

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
      setErro("Preencha todos os campos");
      setLoading(false);
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A senha deve ter pelo menos 6 caracteres");
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
    <div className="space-y-6">
      {/* HEADER */}
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Sistema</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Alterar senha
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Atualize sua senha de acesso ao sistema com segurança.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[240px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4">
            <p className="text-white/60 text-xs">Segurança</p>
            <p className="text-xl font-black mt-1">Protegido</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema seguro
            </div>
          </div>
        </div>
      </section>

      {/* VOLTAR */}
      <div className="flex">
        <button
          onClick={() => router.push("/sistema")}
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 hover:bg-zinc-50 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      {/* FORM */}
      <div className="flex justify-center">
        <section className="w-full max-w-lg rounded-2xl border border-black/5 bg-gradient-to-br from-zinc-50 to-white shadow p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center">
              <Lock size={20} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Nova senha
              </h2>
              <p className="text-sm text-gray-500">
                Defina uma nova senha segura
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              placeholder="Nova senha"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white"
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="w-full border rounded-xl p-3 bg-white"
            />

            {erro && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-red-600 text-sm">{erro}</p>
              </div>
            )}

            {sucesso && (
              <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-green-600 text-sm">{sucesso}</p>
              </div>
            )}

            <button
              onClick={salvar}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-black text-white p-3 rounded-xl hover:bg-zinc-800 disabled:opacity-60"
            >
              <Save size={16} />
              {loading ? "Salvando..." : "Alterar senha"}
            </button>
          </div>

          {/* DICA */}
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
            <div className="flex items-center gap-2 font-semibold mb-1">
              <ShieldCheck size={16} />
              Dica de segurança
            </div>
            Use uma senha com letras, números e caracteres especiais.
          </div>
        </section>
      </div>
    </div>
  );
}