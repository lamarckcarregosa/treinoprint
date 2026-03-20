"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2,
  Users,
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Activity,
  Building2,
  LayoutGrid,
  LockKeyhole,
  UserCog,
  BadgeCheck,
  SlidersHorizontal,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

function CardResumo({
  titulo,
  valor,
  subtitulo,
  icon: Icon,
  cor = "text-gray-900",
}: {
  titulo: string;
  valor: string | number;
  subtitulo?: string;
  icon: any;
  cor?: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-5 border border-black/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{titulo}</p>
          <p className={`text-2xl font-black mt-2 ${cor}`}>{valor}</p>
          {subtitulo ? (
            <p className="text-xs text-gray-400 mt-2">{subtitulo}</p>
          ) : null}
        </div>

        <div className="w-11 h-11 rounded-2xl bg-zinc-100 flex items-center justify-center shrink-0">
          <Icon size={18} className={cor} />
        </div>
      </div>
    </div>
  );
}

function CardSistema({
  titulo,
  descricao,
  onClick,
  icon: Icon,
  destaque = false,
  badge,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
  icon: any;
  destaque?: boolean;
  badge?: string;
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
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              destaque ? "bg-white/10 text-white" : "bg-black text-white"
            }`}
          >
            <Icon size={22} />
          </div>

          <div className="min-w-0">
            {badge ? (
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  destaque
                    ? "bg-white/10 text-white"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {badge}
              </span>
            ) : null}

            <h2 className="text-lg md:text-xl font-bold mt-2">{titulo}</h2>
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
          className={`transition group-hover:translate-x-1 shrink-0 ${
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

  const perfilLabel = useMemo(() => {
    if (tipoUsuario === "superadmin") return "Superadmin";
    if (tipoUsuario === "admin") return "Administrador";
    return tipoUsuario || "Administrador";
  }, [tipoUsuario]);

  const totalAcessos = useMemo(() => {
    return tipoUsuario === "superadmin" ? 6 : 5;
  }, [tipoUsuario]);

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
          <div className="min-w-0 flex-1">
           <h1 className="text5xl md:text-6xl font-black mt-2">
              Sistema
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              {nomeAcademia} • {nomeUsuario} • Perfil atual: {perfilLabel}
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[240px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CardResumo
          titulo="Perfil"
          valor={perfilLabel}
          subtitulo="Nível atual de acesso"
          icon={BadgeCheck}
          cor="text-blue-600"
        />
        <CardResumo
          titulo="Módulos administrativos"
          valor={totalAcessos}
          subtitulo="Acessos disponíveis nesta área"
          icon={LayoutGrid}
          cor="text-violet-600"
        />
        <CardResumo
          titulo="Segurança"
          valor="Ativa"
          subtitulo="Controle de senha e permissões"
          icon={LockKeyhole}
          cor="text-green-600"
        />
        <CardResumo
          titulo="Academia"
          valor={nomeAcademia || "-"}
          subtitulo="Ambiente administrativo atual"
          icon={Building2}
          cor="text-orange-600"
        />
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Administração</h2>
          <p className="text-sm text-gray-500 mt-1">
            Cadastros principais e configurações gerais da academia.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <CardSistema
            titulo="Usuários"
            descricao="Cadastrar, editar, ativar e gerenciar usuários da academia."
            onClick={() => router.push("/usuarios")}
            icon={Users}
            badge="Gestão"
          />

          <CardSistema
            titulo="Configurações da academia"
            descricao="Atualize nome, logo, telefone, e-mail, endereço, CNPJ e integrações."
            onClick={() => router.push("/configuracoes/academia")}
            icon={Settings2}
            badge="Configuração"
          />

          <CardSistema
            titulo="Planos"
            descricao="Cadastre e gerencie os planos comerciais dos alunos."
            onClick={() => router.push("/sistema/planos")}
            icon={SlidersHorizontal}
            badge="Comercial"
          />
        </section>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Segurança e acesso</h2>
          <p className="text-sm text-gray-500 mt-1">
            Controle de permissões e credenciais do sistema.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <CardSistema
            titulo="Permissões"
            descricao="Defina o acesso de cada usuário às áreas do sistema."
            onClick={() => router.push("/sistema/permissoes")}
            icon={ShieldCheck}
            badge="Segurança"
          />

          <CardSistema
            titulo="Alterar senha"
            descricao="Troque sua senha de acesso ao sistema com segurança."
            onClick={() => router.push("/usuarios/novasenha")}
            icon={KeyRound}
            badge="Conta"
          />

          {tipoUsuario === "superadmin" ? (
            <CardSistema
              titulo="Super Admin"
              descricao="Criar novas academias, administradores e preparar ambientes de teste."
              onClick={() => router.push("/superadmin/academias")}
              icon={ShieldCheck}
              destaque
              badge="Avançado"
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