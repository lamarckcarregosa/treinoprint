"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2,
  Users,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Activity,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

function CardSistema({
  titulo,
  descricao,
  onClick,
  icon: Icon,
  destaque = false,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
  icon: any;
  destaque?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        destaque
          ? "bg-black text-white border-black"
          : "bg-white text-gray-900 border-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              destaque ? "bg-white/10 text-white" : "bg-black text-white"
            }`}
          >
            <Icon size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p
              className={`mt-2 text-sm ${
                destaque ? "text-white/80" : "text-gray-500"
              }`}
            >
              {descricao}
            </p>
          </div>
        </div>

        <div
          className={`transition group-hover:translate-x-1 ${
            destaque ? "text-white" : "text-gray-400"
          }`}
        >
          <ArrowRight size={20} />
        </div>
      </div>
    </button>
  );
}

function SistemaPageContent() {
  const router = useRouter();

  const [tipoUsuario, setTipoUsuario] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    try {
      setLoading(true);
      setErro("");

      const tipo = localStorage.getItem("treinoprint_user_tipo") || "";
      const nome = localStorage.getItem("treinoprint_user_nome") || "Usuário";
      const academia =
        localStorage.getItem("treinoprint_academia_nome") || "Minha academia";

      setTipoUsuario(tipo);
      setNomeUsuario(nome);
      setNomeAcademia(academia);
    } catch {
      setErro("Não foi possível carregar a página do sistema.");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando sistema..."
      />
    );
  }

  if (erro) {
    return (
      <SystemError
        titulo="Erro ao carregar sistema"
        mensagem={erro}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  if (tipoUsuario && tipoUsuario !== "admin" && tipoUsuario !== "superadmin") {
    return (
      <SystemError
        titulo="Acesso negado"
        mensagem="Você não tem permissão para acessar esta área."
        onTentarNovamente={() => router.push("/")}
      />
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Bem-vindo ao Sistema
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              {nomeAcademia} • {nomeUsuario} • Perfil atual: {tipoUsuario || "admin"}
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

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Acessos do sistema</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administração, segurança e configurações gerais da academia.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <CardSistema
            titulo="Usuários"
            descricao="Cadastrar, editar, ativar e gerenciar usuários da academia."
            onClick={() => router.push("/usuarios")}
            icon={Users}
          />

          <CardSistema
            titulo="Configurações da academia"
            descricao="Atualize nome, logo, telefone, e-mail, endereço e CNPJ."
            onClick={() => router.push("/configuracoes/academia")}
            icon={Settings2}
          />

          <CardSistema
            titulo="Alterar senha"
            descricao="Troque sua senha de acesso ao sistema com segurança."
            onClick={() => router.push("/usuarios/novasenha")}
            icon={KeyRound}
          />

          <CardSistema
            titulo="Planos"
            descricao="Cadastre e gerencie os planos comerciais dos alunos."
            onClick={() => router.push("/sistema/planos")}
            icon={Settings2}
          />

          <CardSistema
            titulo="Permissões"
            descricao="Defina o acesso de cada usuário às áreas do sistema."
            onClick={() => router.push("/sistema/permissoes")}
            icon={ShieldCheck}
          />

          {tipoUsuario === "superadmin" ? (
            <CardSistema
              titulo="Super Admin"
              descricao="Criar novas academias, administradores e preparar ambientes de teste."
              onClick={() => router.push("/superadmin/academias")}
              icon={ShieldCheck}
              destaque
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

export default function SistemaPage() {
  return (
    <ProtegePagina permissao="sistema">
      <SistemaPageContent />
    </ProtegePagina>
  );
}