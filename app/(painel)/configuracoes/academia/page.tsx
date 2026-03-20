"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import {
  Activity,
  ArrowLeft,
  Building2,
  ImageIcon,
  Landmark,
} from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

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

  chave_pix?: string | null;
  tipo_chave_pix?: string | null;
  nome_recebedor_pix?: string | null;
  cidade_pix?: string | null;
  descricao_pix?: string | null;
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

          chave_pix: academia.chave_pix || "",
          tipo_chave_pix: academia.tipo_chave_pix || "",
          nome_recebedor_pix: academia.nome_recebedor_pix || "",
          cidade_pix: academia.cidade_pix || "",
          descricao_pix: academia.descricao_pix || "",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao salvar academia");
        return;
      }

      setAcademia(json as Academia);

      localStorage.setItem(
        "treinoprint_academia_nome",
        (json as any).nome || ""
      );
      localStorage.setItem(
        "treinoprint_academia_logo",
        (json as any).logo_url || ""
      );

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
        setErro(
          (json as any).error || "Erro ao iniciar conexão com Mercado Pago"
        );
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

          chave_pix: academia.chave_pix || "",
          tipo_chave_pix: academia.tipo_chave_pix || "",
          nome_recebedor_pix: academia.nome_recebedor_pix || "",
          cidade_pix: academia.cidade_pix || "",
          descricao_pix: academia.descricao_pix || "",

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
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando configurações da academia..."
      />
    );
  }

  if (erro && !academia) {
    return (
      <SystemError
        titulo="Erro ao carregar academia"
        mensagem={erro || "Não foi possível carregar a página."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  if (!academia) {
    return <p className="p-6">Academia não encontrada.</p>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel do sistema</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Configurações da academia
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Atualize os dados da academia, configure o PIX e gerencie a
              integração financeira.
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

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push("/sistema")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <button
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow">
        <div className="mb-4 flex items-center gap-3">
          <Building2 size={20} className="text-gray-700" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Dados da academia
            </h2>
            <p className="text-sm text-gray-500">
              Informações principais usadas no sistema.
            </p>
          </div>
        </div>

        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Nome da academia
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.nome || ""}
              onChange={(e) =>
                setAcademia({ ...academia, nome: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Telefone
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.telefone || ""}
              onChange={(e) =>
                setAcademia({ ...academia, telefone: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              E-mail
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.email || ""}
              onChange={(e) =>
                setAcademia({ ...academia, email: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              CNPJ
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.cnpj || ""}
              onChange={(e) =>
                setAcademia({ ...academia, cnpj: e.target.value })
              }
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Endereço
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.endereco || ""}
              onChange={(e) =>
                setAcademia({ ...academia, endereco: e.target.value })
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Upload da logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full rounded-xl border p-3"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            {enviandoLogo ? (
              <p className="mt-2 text-sm text-gray-500">Enviando logo...</p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              URL da logo
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.logo_url || ""}
              onChange={(e) =>
                setAcademia({ ...academia, logo_url: e.target.value })
              }
            />
          </div>
        </div>

        {academia.logo_url ? (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <ImageIcon size={16} className="text-gray-600" />
              <p className="text-sm font-semibold text-gray-600">
                Pré-visualização da logo
              </p>
            </div>
            <img
              src={academia.logo_url}
              alt="Logo da academia"
              className="h-24 rounded-xl border bg-white p-2 object-contain"
            />
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow">
        <div className="mb-4 flex items-center gap-3">
          <Landmark size={20} className="text-gray-700" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Configurações PIX
            </h2>
            <p className="text-sm text-gray-500">
              Configure o PIX usado no recebimento no balcão.
            </p>
          </div>
        </div>

        <div className="grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Chave PIX
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.chave_pix || ""}
              onChange={(e) =>
                setAcademia({ ...academia, chave_pix: e.target.value })
              }
              placeholder="CPF, CNPJ, telefone, e-mail ou chave aleatória"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Tipo da chave PIX
            </label>
            <select
              className="w-full rounded-xl border p-3"
              value={academia.tipo_chave_pix || "cpf"}
              onChange={(e) =>
                setAcademia({ ...academia, tipo_chave_pix: e.target.value })
              }
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
              <option value="telefone">Telefone</option>
              <option value="email">E-mail</option>
              <option value="aleatoria">Chave aleatória</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Nome do recebedor
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.nome_recebedor_pix || ""}
              onChange={(e) =>
                setAcademia({
                  ...academia,
                  nome_recebedor_pix: e.target.value,
                })
              }
              placeholder="Ex: ACADEMIA EXEMPLO"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Cidade
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.cidade_pix || ""}
              onChange={(e) =>
                setAcademia({ ...academia, cidade_pix: e.target.value })
              }
              placeholder="Ex: POCO VERDE"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-semibold text-gray-600">
              Descrição padrão
            </label>
            <input
              className="w-full rounded-xl border p-3"
              value={academia.descricao_pix || ""}
              onChange={(e) =>
                setAcademia({ ...academia, descricao_pix: e.target.value })
              }
              placeholder="Ex: Mensalidade"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
          Esses dados serão usados para gerar o QR Code PIX e o código copia e
          cola no recebimento manual do balcão.
        </div>
      </section>

      <section className="rounded-2xl border border-black/5 bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Integração Mercado Pago
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Conecte a conta da academia para gerar cobranças online no app do
              aluno e na página de pagamentos. Cada academia usa a própria conta
              do Mercado Pago.
            </p>
          </div>

          <div className="shrink-0">
            {academia.mp_connected ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                Conectado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
                Não conectado
              </span>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Status</p>
            <p className="mt-1 font-bold text-gray-900">
              {academia.mp_connected
                ? "Conta conectada"
                : "Conta não conectada"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">ID da conta Mercado Pago</p>
            <p className="mt-1 font-bold text-gray-900">
              {academia.mp_user_id || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Validade do token</p>
            <p className="mt-1 font-bold text-gray-900">
              {formatarDataHora(academia.mp_token_expires_at)}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 bg-zinc-50 p-4">
            <p className="text-sm text-gray-500">Chave pública</p>
            <p className="mt-1 break-all font-bold text-gray-900">
              {academia.mp_public_key || "-"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={conectarMercadoPago}
            disabled={conectandoMP}
            className="rounded-xl bg-sky-600 px-5 py-3 text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {conectandoMP
              ? "Conectando..."
              : academia.mp_connected
              ? "Reconectar Mercado Pago"
              : "Conectar Mercado Pago"}
          </button>

          <button
            onClick={carregar}
            className="rounded-xl border border-black/10 bg-white px-5 py-3 text-gray-900 hover:bg-zinc-50"
          >
            Atualizar status
          </button>

          {academia.mp_connected ? (
            <button
              onClick={desconectarMercadoPago}
              disabled={desconectandoMP}
              className="rounded-xl bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-60"
            >
              {desconectandoMP ? "Desconectando..." : "Desconectar"}
            </button>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold">Como funciona</p>
          <p className="mt-1">
            Ao conectar a conta do Mercado Pago, esta academia poderá gerar
            cobranças online para os alunos, tanto pela página de pagamentos
            quanto pelo app do aluno. Os pagamentos manuais no balcão continuam
            funcionando normalmente.
          </p>
        </div>
      </section>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}
    </main>
  );
}