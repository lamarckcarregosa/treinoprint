"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type Academia = {
  id: string;
  nome?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cnpj?: string;
  logo_url?: string;
  plano?: string;
  limite_alunos?: number;
  slug?: string;
  ativa?: boolean;

  mp_connected?: boolean;
  mp_user_id?: string | null;
  mp_public_key?: string | null;
  mp_access_token?: string | null;
  mp_refresh_token?: string | null;
  mp_token_expires_at?: string | null;
};

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR");
}

export default function ConfigAcademiaPage() {
  const [academia, setAcademia] = useState<Academia | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [conectandoMP, setConectandoMP] = useState(false);
  const [desconectandoMP, setDesconectandoMP] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  const carregar = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/minha-academia", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar academia");
        return;
      }

      setAcademia(json as Academia);
    } catch {
      setErro("Erro ao carregar academia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const salvar = async () => {
    try {
      if (!academia) return;

      setSalvando(true);
      setErro("");

      const res = await apiFetch("/api/minha-academia", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: academia.nome || "",
          telefone: academia.telefone || "",
          email: academia.email || "",
          endereco: academia.endereco || "",
          cnpj: academia.cnpj || "",
          logo_url: academia.logo_url || "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao salvar academia");
        return;
      }

      setAcademia(json as Academia);

      localStorage.setItem("treinoprint_academia_nome", (json as any).nome || "");
      localStorage.setItem("treinoprint_academia_logo", (json as any).logo_url || "");

      window.dispatchEvent(new Event("treinoprint-academia-updated"));

      alert("Dados atualizados com sucesso");
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

  const conectarMercadoPago = async () => {
    try {
      setConectandoMP(true);
      setErro("");

      const res = await apiFetch("/api/mercadopago/connect/start", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao iniciar conexão com Mercado Pago");
        return;
      }

      const url = (json as any).url;
      if (!url) {
        setErro("URL de conexão não encontrada");
        return;
      }

      window.location.href = url;
    } finally {
      setConectandoMP(false);
    }
  };

  const desconectarMercadoPago = async () => {
    try {
      if (!academia) return;

      const confirmar = window.confirm(
        "Deseja realmente desconectar a conta do Mercado Pago desta academia?"
      );

      if (!confirmar) return;

      setDesconectandoMP(true);
      setErro("");

      const res = await apiFetch("/api/minha-academia", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: academia.nome || "",
          telefone: academia.telefone || "",
          email: academia.email || "",
          endereco: academia.endereco || "",
          cnpj: academia.cnpj || "",
          logo_url: academia.logo_url || "",
          mp_connected: false,
          mp_user_id: null,
          mp_public_key: null,
          mp_access_token: null,
          mp_refresh_token: null,
          mp_token_expires_at: null,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao desconectar Mercado Pago");
        return;
      }

      setAcademia(json as Academia);
      alert("Mercado Pago desconectado com sucesso");
    } finally {
      setDesconectandoMP(false);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  if (erro && !academia) {
    return <p className="p-6 text-red-600">{erro}</p>;
  }

  if (!academia) {
    return <p className="p-6">Academia não encontrada.</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            Configurações da academia
          </h1>
          <p className="text-gray-500 mt-2">
            Atualize os dados da sua academia, a logo do sistema e as integrações financeiras
          </p>
        </div>

        <button
          onClick={() => router.push("/sistema")}
          className="bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
        >
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
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

          <div>
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

        {academia.logo_url ? (
          <div className="mt-6">
            <p className="text-sm font-semibold text-gray-600 mb-2">
              Pré-visualização da logo
            </p>
            <img
              src={academia.logo_url}
              alt="Logo da academia"
              className="h-24 object-contain rounded-xl border p-2 bg-white"
            />
          </div>
        ) : null}

        {erro ? <p className="text-red-600 text-sm mt-4">{erro}</p> : null}

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-black text-white py-3 px-5 rounded-xl mt-6 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Integração Mercado Pago
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              Conecte a conta da academia para gerar cobranças online no app do aluno e
              na página de pagamentos. Cada academia usa a própria conta do Mercado Pago.
            </p>
          </div>

          <div className="shrink-0">
            {academia.mp_connected ? (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-700 text-sm font-semibold px-4 py-2">
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold px-4 py-2">
                Não conectado
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Status</p>
            <p className="font-bold text-gray-900 mt-1">
              {academia.mp_connected ? "Conta conectada" : "Conta não conectada"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">ID da conta Mercado Pago</p>
            <p className="font-bold text-gray-900 mt-1">
              {academia.mp_user_id || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Validade do token</p>
            <p className="font-bold text-gray-900 mt-1">
              {formatarDataHora(academia.mp_token_expires_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Chave pública</p>
            <p className="font-bold text-gray-900 mt-1 break-all">
              {academia.mp_public_key || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={conectarMercadoPago}
            disabled={conectandoMP}
            className="bg-sky-600 hover:bg-sky-700 text-white py-3 px-5 rounded-xl disabled:opacity-60"
          >
            {conectandoMP
              ? "Conectando..."
              : academia.mp_connected
              ? "Reconectar Mercado Pago"
              : "Conectar Mercado Pago"}
          </button>

          <button
            onClick={carregar}
            className="border border-black/10 bg-white hover:bg-zinc-50 text-gray-900 py-3 px-5 rounded-xl"
          >
            Atualizar status
          </button>

          {academia.mp_connected ? (
            <button
              onClick={desconectarMercadoPago}
              disabled={desconectandoMP}
              className="bg-red-600 hover:bg-red-700 text-white py-3 px-5 rounded-xl disabled:opacity-60"
            >
              {desconectandoMP ? "Desconectando..." : "Desconectar"}
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Como funciona</p>
          <p className="mt-1">
            Ao conectar a conta do Mercado Pago, esta academia poderá gerar cobranças
            online para os alunos, tanto pela página de pagamentos quanto pelo app do aluno.
            Os pagamentos manuais no balcão continuam funcionando normalmente.
          </p>
        </div>
      </section>
    </main>
  );
}