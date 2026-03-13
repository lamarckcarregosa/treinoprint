"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  PlusCircle,
  History,
  ChartColumnBig,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";

type Aluno = {
  id: number;
  nome: string;
};

function CardOpcao({
  titulo,
  descricao,
  onClick,
  icon: Icon,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
  icon: any;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-black text-white">
            <Icon size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
            <p className="mt-2 text-sm text-gray-500">{descricao}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

function AvaliacoesHomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alunoId = searchParams.get("aluno_id") || "";

  const [abrirSeletorDashboard, setAbrirSeletorDashboard] = useState(false);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [buscaAlunoDashboard, setBuscaAlunoDashboard] = useState("");

  useEffect(() => {
    const carregarAlunos = async () => {
      try {
        const res = await apiFetch("/api/alunos", { cache: "no-store" });
        const json = await res.json().catch(() => []);

        if (res.ok) {
          setAlunos(Array.isArray(json) ? json : []);
        }
      } catch {}
    };

    carregarAlunos();
  }, []);

  const alunosDashboardFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(buscaAlunoDashboard.toLowerCase())
  );

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Avaliações físicas
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre novas avaliações, consulte o histórico e acompanhe a
              evolução corporal.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <CardOpcao
          titulo="Nova avaliação"
          descricao="Cadastrar uma nova avaliação física do aluno."
          onClick={() =>
            router.push(
              alunoId ? `/avaliacoes/nova?aluno_id=${alunoId}` : "/avaliacoes/nova"
            )
          }
          icon={PlusCircle}
        />

        <CardOpcao
          titulo="Histórico"
          descricao="Consultar avaliações já cadastradas e abrir os detalhes."
          onClick={() =>
            router.push(
              alunoId
                ? `/avaliacoes/historico?aluno_id=${alunoId}`
                : "/avaliacoes/historico"
            )
          }
          icon={History}
        />

        <CardOpcao
          titulo="Dashboard corporal"
          descricao="Abrir o painel de evolução corporal do aluno."
          onClick={() => {
            if (alunoId) {
              router.push(`/alunos/${alunoId}/evolucao`);
              return;
            }

            setAbrirSeletorDashboard(true);
          }}
          icon={ChartColumnBig}
        />
      </section>

      {abrirSeletorDashboard && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-gray-900">
                Selecionar aluno
              </h2>

              <button
                type="button"
                onClick={() => {
                  setAbrirSeletorDashboard(false);
                  setBuscaAlunoDashboard("");
                }}
                className="border rounded-xl px-4 py-2"
              >
                Fechar
              </button>
            </div>

            <input
              value={buscaAlunoDashboard}
              onChange={(e) => setBuscaAlunoDashboard(e.target.value)}
              placeholder="Buscar aluno..."
              className="w-full border rounded-xl p-3"
            />

            <div className="border rounded-xl max-h-72 overflow-auto">
              {alunosDashboardFiltrados.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">
                  Nenhum aluno encontrado.
                </p>
              ) : (
                alunosDashboardFiltrados.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => {
                      setAbrirSeletorDashboard(false);
                      setBuscaAlunoDashboard("");
                      router.push(`/alunos/${a.id}/evolucao`);
                    }}
                    className="block w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    {a.nome}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AvaliacoesHomePage() {
  return (
    <ProtegePagina permissao="imprimir">
      <AvaliacoesHomePageContent />
    </ProtegePagina>
  );
}