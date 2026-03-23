"use client";

import { useEffect, useState } from "react";
import {Activity,} from "lucide-react";
import Link from "next/link";

type Automacao = {
  id: string;
  academia_id: string;
  tipo: "inatividade_7d" | "financeiro_vence_2d" | "financeiro_vencido_3d";
  ativo: boolean;
  template_mensagem?: string | null;
  created_at?: string;
};

type UsuarioLocal = {
  id: string;
  nome: string;
  tipo: string;
  academia_id: string;
};

function labelTipo(tipo: Automacao["tipo"]) {
  if (tipo === "inatividade_7d") return "Inatividade 7 dias";
  if (tipo === "financeiro_vence_2d") return "Financeiro vence em 2 dias";
  if (tipo === "financeiro_vencido_3d") return "Financeiro vencido há 3 dias";
  return tipo;
}

function sugestaoTemplate(tipo: Automacao["tipo"]) {
  if (tipo === "inatividade_7d") {
    return "Olá, {nome} 👋\n\nNotamos que você está há alguns dias sem registrar treino.\n\nDigite 1 para ver seu treino e voltar com tudo 💪";
  }
  if (tipo === "financeiro_vence_2d") {
    return "Olá, {nome} 👋\n\nSua mensalidade vence em breve.\n\nDigite 6 para receber seu link de pagamento.";
  }
  return "Olá, {nome} 👋\n\nIdentificamos uma mensalidade em aberto.\n\nDigite 6 para receber seu link de pagamento.";
}

export default function WhatsAppAutomacoesPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);
  const [lista, setLista] = useState<Automacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState("");
  const [criandoPadrao, setCriandoPadrao] = useState(false);
  const [testandoTipo, setTestandoTipo] = useState("");

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

  async function carregar() {
    if (!usuario?.academia_id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/automacoes", {
        headers: {
          "x-academia-id": usuario.academia_id,
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao carregar automações");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  }

  async function criarAutomacoesPadrao() {
    if (!usuario?.academia_id) return;

    setCriandoPadrao(true);
    try {
      const res = await fetch("/api/whatsapp/automacoes/criar-padrao", {
        method: "POST",
        headers: {
          "x-academia-id": usuario.academia_id,
        },
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao criar automações padrão");
        return;
      }

      await carregar();
    } finally {
      setCriandoPadrao(false);
    }
  }

  async function salvar(item: Automacao) {
    if (!usuario?.academia_id) return;

    setSalvandoId(item.id);
    try {
      const res = await fetch("/api/whatsapp/automacoes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-academia-id": usuario.academia_id,
        },
        body: JSON.stringify({
          id: item.id,
          ativo: item.ativo,
          template_mensagem: item.template_mensagem || "",
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao salvar automação");
        return;
      }

      setLista((prev) =>
        prev.map((x) => (x.id === item.id ? { ...x, ...json } : x))
      );
    } finally {
      setSalvandoId("");
    }
  }

  async function testarAutomacao(tipo: string) {
    if (!usuario?.academia_id) return;

    const telefone = prompt("Digite o número com DDD (ex: 7999999999)");

    if (!telefone) return;

    setTestandoTipo(tipo);
    try {
      const res = await fetch("/api/whatsapp/teste", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-academia-id": usuario.academia_id,
        },
        body: JSON.stringify({
          telefone,
          tipo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao testar mensagem");
        return;
      }

      alert("Mensagem enviada com sucesso 🚀");
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar mensagem de teste");
    } finally {
      setTestandoTipo("");
    }
  }

  useEffect(() => {
    carregarUsuarioLocal();
  }, []);

  useEffect(() => {
    if (usuario?.academia_id) carregar();
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
                Automações WhatsApp
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Ative ou desative lembretes automáticos por academia.
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
          className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
        >
          Automações
        </Link>

        <Link
          href="/whatsapp/dashboard"
          className="rounded-xl border bg-white px-4 py-3 text-sm font-medium"
        >
          Dashboard
        </Link>
</div>

      <div className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border bg-white p-5">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border bg-white p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">
                Nenhuma automação cadastrada
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Crie as automações padrão para começar a usar lembretes automáticos.
              </p>
            </div>

            <button
              onClick={criarAutomacoesPadrao}
              disabled={criandoPadrao}
              className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
            >
              {criandoPadrao ? "Criando..." : "Criar automações padrão"}
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end">
              <button
                onClick={criarAutomacoesPadrao}
                disabled={criandoPadrao}
                className="rounded-xl border bg-white px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                {criandoPadrao ? "Criando..." : "Criar automações padrão"}
              </button>
            </div>

            {lista.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-white p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {labelTipo(item.tipo)}
                    </h2>
                    <p className="text-sm text-gray-500">Tipo: {item.tipo}</p>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={item.ativo}
                      onChange={(e) =>
                        setLista((prev) =>
                          prev.map((x) =>
                            x.id === item.id
                              ? { ...x, ativo: e.target.checked }
                              : x
                          )
                        )
                      }
                    />
                    Ativa
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Template da mensagem
                  </label>
                  <textarea
                    rows={6}
                    value={item.template_mensagem || ""}
                    onChange={(e) =>
                      setLista((prev) =>
                        prev.map((x) =>
                          x.id === item.id
                            ? { ...x, template_mensagem: e.target.value }
                            : x
                        )
                      )
                    }
                    placeholder={sugestaoTemplate(item.tipo)}
                    className="w-full rounded-2xl border p-3"
                  />
                  <p className="text-xs text-gray-500">
                    Você pode personalizar a mensagem por academia. Depois podemos suportar variáveis como {"{nome}"} diretamente no envio.
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => testarAutomacao(item.tipo)}
                    disabled={testandoTipo === item.tipo}
                    className="rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-50"
                  >
                    {testandoTipo === item.tipo
                      ? "Enviando teste..."
                      : "Testar mensagem"}
                  </button>

                  <button
                    onClick={() => salvar(item)}
                    disabled={salvandoId === item.id}
                    className="rounded-xl bg-black px-4 py-3 text-white disabled:opacity-50"
                  >
                    {salvandoId === item.id ? "Salvando..." : "Salvar automação"}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}