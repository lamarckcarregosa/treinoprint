"use client";

import { useEffect, useState } from "react";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  cpf?: string | null;
  plano?: string | null;
  status?: string | null;
  foto_url?: string | null;
};

export default function CarteirinhaAlunoPage() {
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetchAluno("/api/app-aluno/me", {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar carteirinha");
          return;
        }

        setAluno(json as Aluno);
      } catch {
        setErro("Erro ao carregar carteirinha");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  if (loading) return <p className="p-4">Carregando...</p>;

  if (erro || !aluno) {
    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <p className="text-red-600">{erro || "Aluno não encontrado"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <section className="bg-gradient-to-br from-black to-zinc-800 text-white rounded-3xl shadow p-6 overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#7CFC00]/10 rounded-full blur-3xl" />

        <div className="relative space-y-4">
          <div>
            <p className="text-xs text-white/70">Carteirinha digital</p>
            <h1 className="text-2xl font-black mt-1">TreinoPrint</h1>
          </div>

          <div className="flex items-center gap-4">
            {aluno.foto_url ? (
              <img
                src={aluno.foto_url}
                alt={aluno.nome}
                className="w-20 h-20 rounded-2xl object-cover border border-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xs text-white/70">
                Sem foto
              </div>
            )}

            <div className="flex-1">
              <p className="text-lg font-bold">{aluno.nome}</p>
              <p className="text-sm text-white/70">Plano: {aluno.plano || "-"}</p>
              <p className="text-sm text-white/70">Status: {aluno.status || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white text-black p-4 text-center">
            <p className="text-xs text-gray-500">Identificação do aluno</p>
            <p className="text-2xl font-black tracking-widest mt-1">
              {String(aluno.id).padStart(6, "0")}
            </p>
          </div>

          <div className="text-xs text-white/60">
            CPF: {aluno.cpf || "-"}
          </div>
        </div>
      </section>
    </div>
  );
}