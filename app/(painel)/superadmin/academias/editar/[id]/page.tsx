"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Academia = {
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

function formatData(data?: string) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

export default function SuperAdminEditarAcademiaPage() {
  const params = useParams();
  const router = useRouter();

  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");

      const res = await apiFetch(
        `/api/superadmin/academias/${String(params.id)}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar academia");
        return;
      }

      setAcademia(json);
    } catch {
      setErro("Erro ao carregar academia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [params.id]);

  const salvar = async () => {
    try {
      if (!academia) return;

      setSalvando(true);
      setErro("");

      const res = await apiFetch(
        `/api/superadmin/academias/${String(params.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: academia.nome || "",
            plano: academia.plano || "",
            ativa: academia.ativa,
            telefone: academia.telefone || "",
            email: academia.email || "",
            endereco: academia.endereco || "",
            cnpj: academia.cnpj || "",
            logo_url: academia.logo_url || "",
            limite_alunos: academia.limite_alunos ?? "",
          }),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao salvar academia");
        return;
      }

      setAcademia(json);
      alert("Academia atualizada com sucesso");
    } finally {
      setSalvando(false);
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      if (!academia?.id) return;

      setEnviandoLogo(true);
      setErro("");

      const extensao = file.name.split(".").pop() || "png";
      const nomeArquivo = `${academia.id}/logo-${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("academias")
        .upload(nomeArquivo, file, {
          upsert: true,
        });

      if (uploadError) {
        setErro(uploadError.message || "Erro ao enviar logo");
        return;
      }

      const { data } = supabase.storage
        .from("academias")
        .getPublicUrl(nomeArquivo);

      setAcademia((prev) =>
        prev
          ? {
              ...prev,
              logo_url: data.publicUrl,
            }
          : prev
      );
    } catch (error: any) {
      setErro(error?.message || "Erro ao enviar logo");
    } finally {
      setEnviandoLogo(false);
    }
  };

  if (loading) return <p className="p-6">Carregando academia...</p>;
  if (erro && !academia) return <p className="p-6 text-red-600">{erro}</p>;
  if (!academia) return <p className="p-6">Academia não encontrada.</p>;

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Editar academia
          </h1>
          <p className="text-gray-500 mt-2">
            Atualize nome, plano, limite de alunos, status e dados cadastrais
          </p>
        </div>

        <button
          onClick={() => router.push("/superadmin/academias/lista")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Nome da academia
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.nome || ""}
              onChange={(e) =>
                setAcademia({ ...academia, nome: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Plano
            </label>
            <select
              className="border rounded-xl p-3 w-full"
              value={academia.plano || ""}
              onChange={(e) =>
                setAcademia({ ...academia, plano: e.target.value })
              }
            >
              <option value="">Selecione</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Limite de alunos
            </label>
            <input
              type="number"
              className="border rounded-xl p-3 w-full"
              value={academia.limite_alunos ?? ""}
              onChange={(e) =>
                setAcademia({
                  ...academia,
                  limite_alunos:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Status
            </label>
            <select
              className="border rounded-xl p-3 w-full"
              value={academia.ativa ? "ativa" : "inativa"}
              onChange={(e) =>
                setAcademia({
                  ...academia,
                  ativa: e.target.value === "ativa",
                })
              }
            >
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Telefone
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.telefone || ""}
              onChange={(e) =>
                setAcademia({ ...academia, telefone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              E-mail
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.email || ""}
              onChange={(e) =>
                setAcademia({ ...academia, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              CNPJ
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.cnpj || ""}
              onChange={(e) =>
                setAcademia({ ...academia, cnpj: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Endereço
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.endereco || ""}
              onChange={(e) =>
                setAcademia({ ...academia, endereco: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Upload da logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="border rounded-xl p-3 w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            {enviandoLogo ? (
              <p className="text-sm text-gray-500 mt-2">Enviando logo...</p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              URL da logo
            </label>
            <input
              className="border rounded-xl p-3 w-full"
              value={academia.logo_url || ""}
              onChange={(e) =>
                setAcademia({ ...academia, logo_url: e.target.value })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-2xl bg-gray-50 border p-4">
            <p className="text-gray-500">ID</p>
            <p className="font-semibold break-all">{academia.id}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 border p-4">
            <p className="text-gray-500">Slug</p>
            <p className="font-semibold">{academia.slug || "-"}</p>
          </div>

          <div className="rounded-2xl bg-gray-50 border p-4">
            <p className="text-gray-500">Criada em</p>
            <p className="font-semibold">{formatData(academia.created_at)}</p>
          </div>
        </div>

        {academia.logo_url ? (
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Pré-visualização da logo
            </p>
            <img
              src={academia.logo_url}
              alt="Logo"
              className="h-24 object-contain border rounded-xl p-2 bg-white"
            />
          </div>
        ) : null}

        {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>
    </main>
  );
}