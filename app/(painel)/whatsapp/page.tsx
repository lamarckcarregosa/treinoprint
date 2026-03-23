"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {Activity,} from "lucide-react";
import Link from "next/link";

type UsuarioLocal = {
  id: string;
  nome: string;
  tipo: string;
  academia_id: string;
};

type Conversa = {
  id: string;
  academia_id: string;
  aluno_id?: number | null;
  telefone: string;
  nome_contato?: string | null;
  setor: "recepcao" | "professor" | "financeiro";
  status: "aberta" | "em_atendimento" | "encerrada";
  ultima_mensagem?: string | null;
  ultima_mensagem_em?: string | null;
  nao_lidas: number;
  responsavel_id?: string | null;
  responsavel_nome?: string | null;
  atribuido_em?: string | null;
};

type Mensagem = {
  id: string;
  origem: "aluno" | "bot" | "recepcao" | "professor" | "sistema";
  mensagem: string;
  created_at: string;
};

function formatarDataHora(data?: string | null) {
  if (!data) return "-";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return data;
  return d.toLocaleString("pt-BR");
}

function formatarTelefone(valor?: string | null) {
  const digits = String(valor || "").replace(/\D/g, "");

  if (digits.length === 13 && digits.startsWith("55")) {
    const local = digits.slice(2);
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  return valor || "-";
}

export default function WhatsAppPage() {
  const [usuario, setUsuario] = useState<UsuarioLocal | null>(null);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtual, setConversaAtual] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [setor, setSetor] = useState("todos");
  const [status, setStatus] = useState("todos");

  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [carregandoConversas, setCarregandoConversas] = useState(false);
  const [carregandoMensagens, setCarregandoMensagens] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [processandoAcao, setProcessandoAcao] = useState(false);

  const mensagensRef = useRef<HTMLDivElement | null>(null);

  function carregarUsuarioLocal() {
    setCarregandoUsuario(true);

    try {
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
    } finally {
      setCarregandoUsuario(false);
    }
  }

  async function carregarConversas() {
    if (!usuario?.academia_id) return;

    setCarregandoConversas(true);
    try {
      const url = `/api/whatsapp/conversas?setor=${setor}&status=${status}`;

      const res = await fetch(url, {
        headers: {
          "x-academia-id": usuario.academia_id,
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao listar conversas");
        return;
      }

      const lista = Array.isArray(json) ? json : [];
      setConversas(lista);

      if (conversaAtual?.id) {
        const atualizada = lista.find((c: Conversa) => c.id === conversaAtual.id);
        if (atualizada) {
          setConversaAtual(atualizada);
        }
      }
    } finally {
      setCarregandoConversas(false);
    }
  }

  async function carregarMensagens(conversaId: string) {
    if (!usuario?.academia_id) return;

    setCarregandoMensagens(true);
    try {
      const res = await fetch(`/api/whatsapp/mensagens?conversa_id=${conversaId}`, {
        headers: {
          "x-academia-id": usuario.academia_id,
        },
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao listar mensagens");
        return;
      }

      setMensagens(Array.isArray(json) ? json : []);
    } finally {
      setCarregandoMensagens(false);
    }
  }

  async function responder() {
    if (!usuario || !conversaAtual || !mensagem.trim()) return;

    setEnviando(true);
    try {
      const res = await fetch("/api/whatsapp/responder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-academia-id": usuario.academia_id,
        },
        body: JSON.stringify({
          conversa_id: conversaAtual.id,
          aluno_id: conversaAtual.aluno_id,
          telefone: conversaAtual.telefone,
          mensagem: mensagem.trim(),
          responsavel_id: usuario.id,
          responsavel_nome: usuario.nome,
          usuario_tipo: usuario.tipo,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao enviar resposta");
        return;
      }

      setMensagem("");
      await carregarMensagens(conversaAtual.id);
      await carregarConversas();
    } finally {
      setEnviando(false);
    }
  }

  async function atribuir() {
    if (!usuario || !conversaAtual) return;

    setProcessandoAcao(true);
    try {
      const res = await fetch("/api/whatsapp/atribuir", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-academia-id": usuario.academia_id,
        },
        body: JSON.stringify({
          conversa_id: conversaAtual.id,
          responsavel_id: usuario.id,
          responsavel_nome: usuario.nome,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao assumir atendimento");
        return;
      }

      await carregarConversas();
    } finally {
      setProcessandoAcao(false);
    }
  }

  async function liberar() {
    if (!usuario || !conversaAtual) return;

    setProcessandoAcao(true);
    try {
      const res = await fetch("/api/whatsapp/liberar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-academia-id": usuario.academia_id,
        },
        body: JSON.stringify({
          conversa_id: conversaAtual.id,
          responsavel_id: usuario.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        alert(json.error || "Erro ao liberar atendimento");
        return;
      }

      await carregarConversas();
    } finally {
      setProcessandoAcao(false);
    }
  }

  useEffect(() => {
    carregarUsuarioLocal();
  }, []);

  useEffect(() => {
    function atualizarUsuario() {
      carregarUsuarioLocal();
    }

    window.addEventListener("treinoprint-academia-updated", atualizarUsuario);
    return () => {
      window.removeEventListener("treinoprint-academia-updated", atualizarUsuario);
    };
  }, []);

  useEffect(() => {
    if (usuario?.academia_id) {
      carregarConversas();
    }
  }, [usuario?.academia_id, setor, status]);

  useEffect(() => {
    if (conversaAtual?.id) {
      carregarMensagens(conversaAtual.id);
    }
  }, [conversaAtual?.id]);

  useEffect(() => {
    if (mensagensRef.current) {
      mensagensRef.current.scrollTop = mensagensRef.current.scrollHeight;
    }
  }, [mensagens, conversaAtual?.id]);

  const conversaAtualizada = useMemo(() => {
    if (!conversaAtual) return null;
    return conversas.find((c) => c.id === conversaAtual.id) || conversaAtual;
  }, [conversas, conversaAtual]);

  const tituloConversa = useMemo(() => {
    if (!conversaAtualizada) return "Nenhuma conversa selecionada";
    return conversaAtualizada.nome_contato || formatarTelefone(conversaAtualizada.telefone);
  }, [conversaAtualizada]);

  const podeResponder = useMemo(() => {
    if (!usuario || !conversaAtualizada) return false;
    if (!conversaAtualizada.responsavel_id) return true;
    return conversaAtualizada.responsavel_id === usuario.id;
  }, [usuario, conversaAtualizada]);

  const conversaEhMinha = useMemo(() => {
    if (!usuario || !conversaAtualizada) return false;
    return conversaAtualizada.responsavel_id === usuario.id;
  }, [usuario, conversaAtualizada]);

  if (carregandoUsuario) {
    return <div className="p-6">Carregando usuário...</div>;
  }

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
              Gestão Whatsapp
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Acompanhe mesagens enviadas pelo Whastapp TreinoPrint.
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
          className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
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
          className="rounded-xl border bg-white px-4 py-3 text-sm font-medium"
        >
          Dashboard
        </Link>
</div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-220px)]">
        <div className="col-span-3 rounded-2xl border bg-white p-4 overflow-hidden">
          <div className="mb-4">
            <h1 className="text-xl font-bold">WhatsApp</h1>
            <p className="text-sm text-gray-500">Fila de atendimento</p>
          </div>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <select
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="rounded-xl border p-2"
            >
              <option value="todos">Todos setores</option>
              <option value="recepcao">Recepção</option>
              <option value="professor">Professor</option>
              <option value="financeiro">Financeiro</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="rounded-xl border p-2"
            >
              <option value="todos">Todos status</option>
              <option value="aberta">Aberta</option>
              <option value="em_atendimento">Em atendimento</option>
              <option value="encerrada">Encerrada</option>
            </select>
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto space-y-2">
            {carregandoConversas ? (
              <p className="text-sm text-gray-500">Carregando...</p>
            ) : conversas.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma conversa encontrada.</p>
            ) : (
              conversas.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConversaAtual(c)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    conversaAtual?.id === c.id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="truncate">
                      {c.nome_contato || formatarTelefone(c.telefone)}
                    </strong>

                    {c.nao_lidas > 0 ? (
                      <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                        {c.nao_lidas}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      {c.setor}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5">
                      {c.status}
                    </span>
                  </div>

                  {c.responsavel_nome ? (
                    <p className="mt-1 text-xs text-blue-600">
                      Responsável: {c.responsavel_nome}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">Sem responsável</p>
                  )}

                  <p className="mt-1 truncate text-sm">{c.ultima_mensagem || "-"}</p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="col-span-6 rounded-2xl border bg-white p-4 flex flex-col min-h-0">
          <div className="mb-4 border-b pb-3">
            <h2 className="text-lg font-semibold">{tituloConversa}</h2>

            {conversaAtualizada ? (
              <>
                <p className="text-sm text-gray-500">
                  {formatarTelefone(conversaAtualizada.telefone)}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    Setor: {conversaAtualizada.setor}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    Status: {conversaAtualizada.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs">
                    Responsável: {conversaAtualizada.responsavel_nome || "ninguém"}
                  </span>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    onClick={atribuir}
                    disabled={!conversaAtualizada || processandoAcao}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                  >
                    Assumir
                  </button>

                  <button
                    onClick={liberar}
                    disabled={!conversaAtualizada || processandoAcao}
                    className="rounded-lg bg-gray-200 px-3 py-2 text-sm disabled:opacity-50"
                  >
                    Liberar
                  </button>
                </div>

                {!podeResponder && conversaAtualizada.responsavel_nome ? (
                  <p className="mt-3 text-sm text-red-600">
                    Esta conversa está em atendimento com {conversaAtualizada.responsavel_nome}.
                  </p>
                ) : null}

                {conversaEhMinha ? (
                  <p className="mt-3 text-sm text-green-600">
                    Você está responsável por esta conversa.
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <div
            ref={mensagensRef}
            className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0"
          >
            {!conversaAtual ? (
              <p className="text-sm text-gray-500">
                Selecione uma conversa para visualizar as mensagens.
              </p>
            ) : carregandoMensagens ? (
              <p className="text-sm text-gray-500">Carregando mensagens...</p>
            ) : mensagens.length === 0 ? (
              <p className="text-sm text-gray-500">Sem mensagens.</p>
            ) : (
              mensagens.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                    m.origem === "aluno"
                      ? "bg-gray-100"
                      : "ml-auto bg-black text-white"
                  }`}
                >
                  <div className="mb-1 text-[11px] opacity-70">
                    {m.origem} · {formatarDataHora(m.created_at)}
                  </div>
                  <div>{m.mensagem}</div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 flex gap-2 border-t pt-4">
            <input
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={
                podeResponder
                  ? "Digite sua resposta..."
                  : "Assuma a conversa para responder"
              }
              className="flex-1 rounded-xl border p-3"
              disabled={!conversaAtual || !podeResponder}
            />
            <button
              onClick={responder}
              disabled={
                !conversaAtual || enviando || !mensagem.trim() || !podeResponder
              }
              className="rounded-xl bg-black px-5 py-3 text-white disabled:opacity-50"
            >
              {enviando ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>

        <div className="col-span-3 rounded-2xl border bg-white p-4">
          <h3 className="text-lg font-semibold">Dados do contato</h3>

          {!conversaAtualizada ? (
            <p className="mt-3 text-sm text-gray-500">Nenhuma conversa selecionada.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <p>
                <strong>Nome:</strong> {conversaAtualizada.nome_contato || "-"}
              </p>
              <p>
                <strong>Telefone:</strong> {formatarTelefone(conversaAtualizada.telefone)}
              </p>
              <p>
                <strong>Setor:</strong> {conversaAtualizada.setor}
              </p>
              <p>
                <strong>Status:</strong> {conversaAtualizada.status}
              </p>
              <p>
                <strong>Responsável:</strong>{" "}
                {conversaAtualizada.responsavel_nome || "-"}
              </p>
              <p>
                <strong>Aluno ID:</strong> {conversaAtualizada.aluno_id || "-"}
              </p>
              <p>
                <strong>Academia ID:</strong> {conversaAtualizada.academia_id}
              </p>
              <p>
                <strong>Atribuído em:</strong>{" "}
                {formatarDataHora(conversaAtualizada.atribuido_em)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}          