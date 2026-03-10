"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type DetalhesAcademia = {
  id: string;
  nome?: string;
  plano?: string;
  ativa?: boolean;
  telefone?: string;
  email?: string;
  endereco?: string;
  cnpj?: string;
  logo_url?: string;
  slug?: string;
  limite_alunos?: number | null;
  created_at?: string;
  total_alunos?: number;
  total_usuarios?: number;
  total_pendentes?: number;
  valor_pendente?: number;
  valor_pago?: number;
};

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, {
    ...init,
    headers,
  });
}

function formatBRL(valor?: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(data?: string) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

function CardInfo({
  titulo,
  valor,
  cor = "text-gray-900",
}: {
  titulo: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
    </div>
  );
}

export default function SuperAdminDetalhesAcademiaPage() {
  const params = useParams();
  const router = useRouter();

  const [dados, setDados] = useState<DetalhesAcademia | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");

      const res = await apiFetch(
        `/api/superadmin/academias/${String(params.id)}/detalhes`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar academia");
        return;
      }

      setDados(json);
    } catch {
      setErro("Erro ao carregar academia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [params.id]);

  if (loading) return <p className="p-6">Carregando detalhes...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!dados) return <p className="p-6">Academia não encontrada.</p>;

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {dados.logo_url ? (
            <img
              src={dados.logo_url}
              alt={dados.nome}
              className="w-20 h-20 rounded-2xl object-contain border bg-white p-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border flex items-center justify-center text-xs text-gray-500">
              Sem logo
            </div>
          )}

          <div>
            <h1 className="text-3xl font-black text-gray-900">{dados.nome}</h1>
            <p className="text-gray-500 mt-1">Plano: {dados.plano || "-"}</p>
            <p className="text-gray-500">
              Status: {dados.ativa ? "Ativa" : "Inativa"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push("/superadmin/academias/lista")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            Voltar
          </button>

          <button
            onClick={() =>
              router.push(`/superadmin/academias/editar/${dados.id}`)
            }
            className="bg-blue-600 text-white px-5 py-3 rounded-xl"
          >
            Editar academia
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <CardInfo titulo="Alunos" valor={String(dados.total_alunos || 0)} />
        <CardInfo titulo="Usuários" valor={String(dados.total_usuarios || 0)} />
        <CardInfo
          titulo="Pendências"
          valor={String(dados.total_pendentes || 0)}
          cor="text-yellow-600"
        />
        <CardInfo
          titulo="Em aberto"
          valor={formatBRL(dados.valor_pendente)}
          cor="text-red-600"
        />
        <CardInfo
          titulo="Receita paga"
          valor={formatBRL(dados.valor_pago)}
          cor="text-green-600"
        />
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <h2 className="text-xl font-bold mb-4">Dados da academia</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Nome</p>
            <p className="font-semibold">{dados.nome || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Slug</p>
            <p className="font-semibold">{dados.slug || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Telefone</p>
            <p className="font-semibold">{dados.telefone || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">E-mail</p>
            <p className="font-semibold">{dados.email || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">CNPJ</p>
            <p className="font-semibold">{dados.cnpj || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Limite de alunos</p>
            <p className="font-semibold">
              {dados.limite_alunos == null ? "-" : dados.limite_alunos}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-gray-500">Endereço</p>
            <p className="font-semibold">{dados.endereco || "-"}</p>
          </div>

          <div>
            <p className="text-gray-500">Criada em</p>
            <p className="font-semibold">{formatData(dados.created_at)}</p>
          </div>

          <div>
            <p className="text-gray-500">Status</p>
            <p className="font-semibold">{dados.ativa ? "Ativa" : "Inativa"}</p>
          </div>
        </div>
      </section>
    </main>
  );
}