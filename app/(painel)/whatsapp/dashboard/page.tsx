"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {Activity,} from "lucide-react";

type UsuarioLocal = {
  id: string;
  nome: string;
  tipo: string;
  academia_id: string;
};

type DashboardData = {
  conversas_abertas: number;
  conversas_em_atendimento: number;
  mensagens_hoje: number;
  mensagens_7_dias: number;
  mensagens_30_dias: number;
  automacoes_enviadas_7_dias: number;
  por_setor: {
    recepcao: number;
    professor: number;
    financeiro: number;
  };
};

function Card({
  titulo,
  valor,
  subtitulo,
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="mt-2 text-3xl font-black text-gray-900">{valor}</p>
      {subtitulo ? <p className="mt-2 text-xs text-gray-500">{subtitulo}</p> : null}
    </div>
  );
}

export default function WhatsAppDashboardPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  function carregarUsuarioLocal() {
    const academiaId = localStorage.getItem("treinoprint_academia_id") || "";
    const userId = localStorage.getItem("treinoprint_user_id") || "";
    const userNome = localStorage.getItem("treinoprint_user_nome") || "";
    const userTipo = localStorage.getItem("treinoprint_user_tipo") || "";

    if (!academiaId || !userId) {
      setUsuario(null);
      return;
    }

    setUsuario({
      id: userId,
      nome: userNome,
      tipo: userTipo,
      academia_id: academiaId,
    });
  }

  async function carregarDashboard(academiaId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/dashboard", {
        headers: {
          "x-academia-id": academiaId,
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao carregar dashboard");
        return;
      }

      setDados(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarUsuarioLocal();
  }, []);

  useEffect(() => {
    if (usuario?.academia_id) {
      carregarDashboard(usuario.academia_id);
    }
  }, [usuario?.academia_id]);

  if (!usuario) {
    return <div className="p-6">Usuário não autenticado.</div>;
  }

  return (
   <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="mt-1 text-5xl font-black md:text-4x1">
                Dashboard WhatsApp
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Acompanhe os indicadores do atendimento e automações.
            </p>
          </div>

          <div className="min-w-[240px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-white/60">Status do sistema</p>
            <p className="mt-1 text-xl font-black">TreinoPrint Online</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/whatsapp"
          className="rounded-xl border bg-white px-4 py-3 text-sm font-medium"
        >
          Atendimento
        </Link>

        <Link
          href="/whatsapp/automacoes"
          className="rounded-xl border bg-white px-4 py-3 text-sm font-medium"
        >
          Automações
        </Link>

        <Link
          href="/whatsapp/dashboard"
          className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
        >
          Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-white p-5">Carregando...</div>
      ) : !dados ? (
        <div className="rounded-2xl border bg-white p-5">
          Não foi possível carregar os dados.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card
              titulo="Conversas abertas"
              valor={dados.conversas_abertas}
              subtitulo="Fila aguardando atendimento"
            />
            <Card
              titulo="Em atendimento"
              valor={dados.conversas_em_atendimento}
              subtitulo="Conversas atribuídas"
            />
            <Card
              titulo="Mensagens hoje"
              valor={dados.mensagens_hoje}
              subtitulo="Movimento do dia"
            />
            <Card
              titulo="Automações 7 dias"
              valor={dados.automacoes_enviadas_7_dias}
              subtitulo="Envios automáticos recentes"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Mensagens acumuladas
              </h2>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <Card
                  titulo="Últimos 7 dias"
                  valor={dados.mensagens_7_dias}
                />
                <Card
                  titulo="Últimos 30 dias"
                  valor={dados.mensagens_30_dias}
                />
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Conversas por setor
              </h2>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Recepção</span>
                    <strong>{dados.por_setor.recepcao}</strong>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${Math.min(
                          100,
                          dados.por_setor.recepcao * 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Professor</span>
                    <strong>{dados.por_setor.professor}</strong>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${Math.min(
                          100,
                          dados.por_setor.professor * 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>Financeiro</span>
                    <strong>{dados.por_setor.financeiro}</strong>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-black"
                      style={{
                        width: `${Math.min(
                          100,
                          dados.por_setor.financeiro * 10
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}