"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function formatarCPF(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  return numeros
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export default function LoginAlunoPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const entrar = async () => {
    try {
      setErro("");

      if (!usuario.trim() || !senha.trim()) {
        setErro("Informe CPF e senha");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/app-aluno/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario,
          senha,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao entrar");
        return;
      }

      const alunoId = String((json as any).sessao?.aluno_id || "");
      const academiaId = String((json as any).sessao?.academia_id || "");
      const alunoNome = String((json as any).aluno?.nome || "");

      if (!alunoId || !academiaId) {
        setErro("Sessão do aluno inválida");
        return;
      }

      localStorage.setItem("treinoprint_aluno_logado", "1");

      // nomes antigos
      localStorage.setItem("treinoprint_aluno_id", alunoId);
      localStorage.setItem("treinoprint_aluno_academia_id", academiaId);

      // nomes novos/padronizados
      localStorage.setItem("treinoprint_app_aluno_id", alunoId);
      localStorage.setItem("treinoprint_app_academia_id", academiaId);

      localStorage.setItem("treinoprint_aluno_nome", alunoNome);

      router.push("/app-aluno/inicio");
    } catch {
      setErro("Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-4">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Área do aluno</h1>
        <p className="text-sm text-gray-500 mt-1">
          Entre com seu CPF e sua senha
        </p>
      </div>

      <input
        placeholder="CPF"
        value={usuario}
        onChange={(e) => setUsuario(formatarCPF(e.target.value))}
        className="border rounded-xl p-3 w-full"
      />

      <input
        type="password"
        placeholder="Senha"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className="border rounded-xl p-3 w-full"
      />

      <div className="text-xs text-gray-500 rounded-xl bg-gray-50 p-3">
        Primeiro acesso:
        <br />
        Usuário = CPF
        <br />
        Senha = data de nascimento no formato ddmmaaaa
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <button
        onClick={entrar}
        disabled={loading}
        className="bg-black text-white rounded-xl p-3 w-full disabled:opacity-60"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </div>
  );
}