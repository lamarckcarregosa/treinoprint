"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  plano?: string | null;
  status?: string | null;
  foto_url?: string | null;
  objetivo?: string | null;
  peso_meta?: number | null;
  senha_app_alterada?: boolean;
};

export default function PerfilAlunoPage() {
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetchAluno("/api/app-aluno/me", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar perfil");
          return;
        }

        setAluno(json as Aluno);
      } catch {
        setErro("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const alterarSenha = async () => {
    try {
      setMsg("");
      setErro("");
      setSalvando(true);

      const res = await apiFetchAluno("/api/app-aluno/alterar-senha", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
          confirmar_senha: confirmarSenha,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao alterar senha");
        return;
      }

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setMsg("Senha alterada com sucesso");
    } finally {
      setSalvando(false);
    }
  };

  const sair = () => {
    localStorage.removeItem("treinoprint_aluno_logado");
    localStorage.removeItem("treinoprint_aluno_id");
    localStorage.removeItem("treinoprint_aluno_academia_id");
    localStorage.removeItem("treinoprint_aluno_nome");
    router.push("/app-aluno/login");
  };

  if (loading) {
    return <p className="p-4">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <section className="bg-white rounded-2xl shadow p-5 space-y-3">
        <div className="flex items-center gap-4">
          {aluno?.foto_url ? (
            <img
              src={aluno.foto_url}
              alt={aluno.nome}
              className="w-16 h-16 rounded-full object-cover border"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 border flex items-center justify-center text-xs text-gray-500">
              Sem foto
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">
              {aluno?.nome || "-"}
            </h1>
            <p className="text-sm text-gray-600">CPF: {aluno?.cpf || "-"}</p>
            <p className="text-sm text-gray-600">Plano: {aluno?.plano || "-"}</p>
          </div>
        </div>

        <div className="border-t pt-3 text-sm text-gray-600 space-y-1">
          <p>Status: {aluno?.status || "-"}</p>
          <p>Objetivo: {aluno?.objetivo || "-"}</p>
          <p>
            Peso meta: {aluno?.peso_meta ? `${aluno.peso_meta} kg` : "-"}
          </p>
          <p>
            Senha alterada: {aluno?.senha_app_alterada ? "Sim" : "Não"}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h2 className="font-bold text-gray-900">Alterar senha</h2>

        <input
          type="password"
          placeholder="Senha atual"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          className="border rounded-xl p-3 w-full"
        />

        <input
          type="password"
          placeholder="Nova senha"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          className="border rounded-xl p-3 w-full"
        />

        <input
          type="password"
          placeholder="Confirmar nova senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="border rounded-xl p-3 w-full"
        />

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
        {msg ? <p className="text-sm text-green-600">{msg}</p> : null}

        <button
          onClick={alterarSenha}
          disabled={salvando}
          className="bg-black text-white rounded-xl px-4 py-3 w-full disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar nova senha"}
        </button>
      </section>

      <button
        onClick={sair}
        className="w-full bg-red-600 text-white rounded-xl px-4 py-3"
      >
        Sair da conta
      </button>
    </div>
  );
}