"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity, PlusCircle, ChartColumnBig, Eye } from "lucide-react";
import { apiFetch } from "@/lib/apiFetch";
import ProtegePagina from "@/components/ProtegePagina";

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number;
  percentual_gordura?: number;
};

type Aluno = {
  id: number;
  nome: string;
};

function formatData(data: string) {
  const dt = new Date(`${data}T00:00:00`);
  return dt.toLocaleDateString("pt-BR");
}

function HistoricoAvaliacoesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const alunoIdUrl = searchParams.get("aluno_id") || "";

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [alunoId, setAlunoId] = useState(alunoIdUrl);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregar();
  }, [alunoId]);

  async function carregar() {
    try {
      setLoading(true);
      setErro("");

      const resAlunos = await apiFetch("/api/alunos", { cache: "no-store" });
      const alunosJson = await resAlunos.json().catch(() => []);

      if (resAlunos.ok) {
        setAlunos(alunosJson);
      }

      const url = alunoId
        ? `/api/avaliacoes?aluno_id=${alunoId}`
        : "/api/avaliacoes";

      const resAval = await apiFetch(url, { cache: "no-store" });
      const avalJson = await resAval.json().catch(() => []);

      if (!resAval.ok) {
        setErro(avalJson.error || "Erro ao carregar avaliações");
        return;
      }

      setAvaliacoes(Array.isArray(avalJson) ? avalJson : []);
    } catch {
      setErro("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }

  const nomeAluno = (id: number) => {
    const aluno = alunos.find((a) => a.id === id);
    return aluno ? aluno.nome : `Aluno #${id}`;
  };

  if (loading) {
    return <p className="p-6">Carregando avaliações...</p>;
  }

  return (
    <main className="space-y-6">

      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl font-black mt-2">Histórico de avaliações</h1>
            <p className="text-zinc-300 mt-2">
              Consulte avaliações físicas registradas no sistema.
            </p>
          </div>

          <div className="flex gap-3">

            <button
              onClick={() =>
                router.push(
                  alunoId
                    ? `/avaliacoes/nova?aluno_id=${alunoId}`
                    : "/avaliacoes/nova"
                )
              }
              className="flex items-center gap-2 bg-white text-black px-4 py-3 rounded-xl"
            >
              <PlusCircle size={16} />
              Nova avaliação
            </button>

            {alunoId && (
              <button
                onClick={() => router.push(`/alunos/${alunoId}/evolucao`)}
                className="flex items-center gap-2 bg-blue-600 px-4 py-3 rounded-xl"
              >
                <ChartColumnBig size={16} />
                Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">

        <div>
          <label className="text-sm text-gray-500">Filtrar aluno</label>

          <select
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            className="border rounded-xl p-3 w-full mt-1"
          >
            <option value="">Todos alunos</option>

            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>

        {erro ? <p className="text-red-600">{erro}</p> : null}

        {avaliacoes.length === 0 ? (
          <p className="text-gray-500">Nenhuma avaliação encontrada.</p>
        ) : (
          <div className="space-y-3">

            {avaliacoes.map((item) => (
              <div
                key={item.id}
                className="border rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold">{nomeAluno(item.aluno_id)}</p>

                  <p className="text-sm text-gray-600">
                    Data: {formatData(item.data_avaliacao)}
                  </p>

                  <p className="text-sm text-gray-600">
                    Peso: {item.peso || "-"} kg
                  </p>

                  <p className="text-sm text-gray-600">
                    Gordura: {item.percentual_gordura || "-"} %
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/avaliacoes/${item.id}`)}
                  className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-xl"
                >
                  <Eye size={16} />
                  Ver avaliação
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}

export default function HistoricoAvaliacoesPage() {
  return (
    <ProtegePagina permissao="avaliacoes">
      <HistoricoAvaliacoesPageContent />
    </ProtegePagina>
  );
}