"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Printer,
  Users,
  Dumbbell,
  UserSquare2,
  Landmark,
  ShieldCheck,
  CreditCard,
  Activity,
  ArrowRight,
  KeyRound,
  Blocks,
  BadgeCheck,
  Sparkles,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Permissoes = {
  dashboard?: boolean;
  alunos?: boolean;
  personais?: boolean;
  treinos?: boolean;
  imprimir?: boolean;
  pagamentos?: boolean;
  financeiro?: boolean;
  sistema?: boolean;
  alterar_senha?: boolean;
  avaliacoes?: boolean;
};

type Atalho = {
  chave: keyof Permissoes | "usuarios";
  titulo: string;
  descricao: string;
  href: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  cardGlow: string;
};

function CardAtalho({
  titulo,
  descricao,
  icon: Icon,
  iconBg,
  iconText,
  badgeBg,
  badgeText,
  cardGlow,
  onClick,
}: {
  titulo: string;
  descricao: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  badgeBg: string;
  badgeText: string;
  cardGlow: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full text-left rounded-3xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-lg hover:-translate-y-[2px] transition overflow-hidden ${cardGlow}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white via-transparent to-black/[0.02]" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg} ${iconText}`}
          >
            <Icon size={22} />
          </div>

          <div className="min-w-0">
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${badgeBg} ${badgeText}`}
            >
              Módulo
            </div>

            <h2 className="text-lg md:text-xl font-bold text-gray-900 mt-3 truncate">
              {titulo}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{descricao}</p>
          </div>
        </div>

        <ArrowRight
          size={18}
          className="text-gray-400 transition group-hover:translate-x-1 shrink-0 mt-1"
        />
      </div>
    </button>
  );
}

function CardFavorito({
  titulo,
  icon: Icon,
  iconBg,
  iconText,
  onClick,
}: {
  titulo: string;
  icon: LucideIcon;
  iconBg: string;
  iconText: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition text-left"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center ${iconBg} ${iconText}`}
        >
          <Icon size={18} />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{titulo}</p>
          <p className="text-xs text-gray-500">Acesso rápido</p>
        </div>
      </div>
    </button>
  );
}

export default function InicioPage() {
  const router = useRouter();

  const [nomeUsuario, setNomeUsuario] = useState("Usuário");
  const [nomeAcademia, setNomeAcademia] = useState("Minha academia");
  const [perfilAtual, setPerfilAtual] = useState("");
  const [permissoes, setPermissoes] = useState<Permissoes>({});

  useEffect(() => {
    const carregar = () => {
      const nome = localStorage.getItem("treinoprint_user_nome") || "Usuário";
      const academia =
        localStorage.getItem("treinoprint_academia_nome") || "Minha academia";
      const tipo = localStorage.getItem("treinoprint_user_tipo") || "";
      const permissoesSalvas = localStorage.getItem("treinoprint_permissoes");

      setNomeUsuario(nome);
      setNomeAcademia(academia);
      setPerfilAtual(tipo);

      if (tipo === "admin" || tipo === "superadmin") {
        setPermissoes({
          dashboard: true,
          alunos: true,
          personais: true,
          treinos: true,
          imprimir: true,
          pagamentos: true,
          financeiro: true,
          sistema: true,
          alterar_senha: true,
          avaliacoes: true,
        });
        return;
      }

      if (permissoesSalvas) {
        try {
          const json = JSON.parse(permissoesSalvas);

          if (json && Object.keys(json).length > 0) {
            setPermissoes(json);
            return;
          }
        } catch {}
      }

      if (tipo === "personal") {
        setPermissoes({
          imprimir: true,
          treinos: true,
          alterar_senha: true,
          avaliacoes: true,
        });
        return;
      }

      if (tipo === "recepcao") {
        setPermissoes({
          imprimir: true,
          pagamentos: true,
          alunos: true,
          alterar_senha: true,
        });
        return;
      }

      setPermissoes({});
    };

    carregar();

    window.addEventListener("treinoprint-permissoes-updated", carregar);
    window.addEventListener("treinoprint-academia-updated", carregar);

    return () => {
      window.removeEventListener("treinoprint-permissoes-updated", carregar);
      window.removeEventListener("treinoprint-academia-updated", carregar);
    };
  }, []);

  const atalhosBase = [
    {
      chave: "dashboard",
      titulo: "Dashboard",
      descricao: "Visão geral da academia",
      href: "/dashboard",
      icon: LayoutDashboard,
      iconBg: "bg-blue-100",
      iconText: "text-blue-700",
      badgeBg: "bg-blue-50",
      badgeText: "text-blue-700",
      cardGlow: "hover:ring-2 hover:ring-blue-100",
    },
    {
      chave: "imprimir",
      titulo: "Imprimir",
      descricao: "Impressão de treinos",
      href: "/imprimir",
      icon: Printer,
      iconBg: "bg-zinc-100",
      iconText: "text-zinc-700",
      badgeBg: "bg-zinc-100",
      badgeText: "text-zinc-700",
      cardGlow: "hover:ring-2 hover:ring-zinc-100",
    },
    {
      chave: "alunos",
      titulo: "Alunos",
      descricao: "Cadastro e consulta",
      href: "/alunos",
      icon: Users,
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-700",
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      cardGlow: "hover:ring-2 hover:ring-emerald-100",
    },
    {
      chave: "treinos",
      titulo: "Treinos",
      descricao: "Gerenciar treinos",
      href: "/treinos",
      icon: Dumbbell,
      iconBg: "bg-orange-100",
      iconText: "text-orange-700",
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-700",
      cardGlow: "hover:ring-2 hover:ring-orange-100",
    },
    {
      chave: "personais",
      titulo: "Personais",
      descricao: "Cadastro de profissionais",
      href: "/personals",
      icon: UserSquare2,
      iconBg: "bg-cyan-100",
      iconText: "text-cyan-700",
      badgeBg: "bg-cyan-50",
      badgeText: "text-cyan-700",
      cardGlow: "hover:ring-2 hover:ring-cyan-100",
    },
    {
      chave: "financeiro",
      titulo: "Financeiro",
      descricao: "Mensalidades e despesas",
      href: "/financeiro",
      icon: Landmark,
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-700",
      badgeBg: "bg-yellow-50",
      badgeText: "text-yellow-700",
      cardGlow: "hover:ring-2 hover:ring-yellow-100",
    },
    {
      chave: "usuarios",
      titulo: "Usuários",
      descricao: "Controle de acesso",
      href: "/usuarios",
      icon: ShieldCheck,
      iconBg: "bg-red-100",
      iconText: "text-red-700",
      badgeBg: "bg-red-50",
      badgeText: "text-red-700",
      cardGlow: "hover:ring-2 hover:ring-red-100",
    },
    {
      chave: "pagamentos",
      titulo: "Pagamentos",
      descricao: "Gestão de pagamentos",
      href: "/pagamentos",
      icon: CreditCard,
      iconBg: "bg-violet-100",
      iconText: "text-violet-700",
      badgeBg: "bg-violet-50",
      badgeText: "text-violet-700",
      cardGlow: "hover:ring-2 hover:ring-violet-100",
    },
    {
      chave: "alterar_senha",
      titulo: "Alterar senha",
      descricao: "Atualize sua senha de acesso",
      href: "/usuarios/novasenha",
      icon: KeyRound,
      iconBg: "bg-amber-100",
      iconText: "text-amber-700",
      badgeBg: "bg-amber-50",
      badgeText: "text-amber-700",
      cardGlow: "hover:ring-2 hover:ring-amber-100",
    },
  ] satisfies Atalho[];

  const atalhosVisiveis = useMemo(() => {
    if (perfilAtual === "admin" || perfilAtual === "superadmin") {
      return atalhosBase;
    }

    return atalhosBase.filter((item) => {
      if (item.chave === "usuarios") return Boolean(permissoes.sistema);
      return Boolean(permissoes[item.chave as keyof Permissoes]);
    });
  }, [perfilAtual, permissoes]);

  const favoritos = useMemo(() => {
    const ordemPreferida = [
      "/dashboard",
      "/imprimir",
      "/alunos",
      "/pagamentos",
      "/usuarios/novasenha",
    ];

    return atalhosVisiveis
      .filter((item) => ordemPreferida.includes(item.href))
      .sort(
        (a, b) =>
          ordemPreferida.indexOf(a.href) - ordemPreferida.indexOf(b.href)
      )
      .slice(0, 4);
  }, [atalhosVisiveis]);

  const totalModulos = atalhosVisiveis.length;

  const totalPermissoes = useMemo(() => {
    return Object.values(permissoes).filter(Boolean).length;
  }, [permissoes]);

  const perfilLabel = useMemo(() => {
    if (!perfilAtual) return "-";
    if (perfilAtual === "superadmin") return "Superadmin";
    if (perfilAtual === "admin") return "Administrador";
    if (perfilAtual === "personal") return "Personal";
    if (perfilAtual === "recepcao") return "Recepção";
    return perfilAtual;
  }, [perfilAtual]);

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel inicial</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Bem-vindo, {nomeUsuario}
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              {nomeAcademia} • Perfil atual:{" "}
              <span className="font-semibold">{perfilLabel}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Módulos liberados</p>
          <p className="text-2xl font-black text-blue-600 mt-2">
            {totalModulos}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <Blocks size={16} />
            Acessos rápidos disponíveis
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Permissões ativas</p>
          <p className="text-2xl font-black text-emerald-600 mt-2">
            {totalPermissoes}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <BadgeCheck size={16} />
            Liberadas para este perfil
          </div>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Acesso à senha</p>
          <p className="text-2xl font-black text-violet-600 mt-2">
            {permissoes.alterar_senha ? "Sim" : "Não"}
          </p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
            <KeyRound size={16} />
            Alteração de credenciais
          </div>
        </div>
      </div>

      <section className="rounded-[28px] bg-white border border-black/5 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Favoritos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Principais módulos para acesso rápido.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700">
            <Star size={14} />
            Atalhos em destaque
          </div>
        </div>

        {favoritos.length === 0 ? null : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {favoritos.map((item) => (
              <CardFavorito
                key={item.href}
                titulo={item.titulo}
                icon={item.icon}
                iconBg={item.iconBg}
                iconText={item.iconText}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[28px] bg-white border border-black/5 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Acessos rápidos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Os módulos exibidos abaixo seguem as permissões do usuário logado.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            <Sparkles size={14} />
            Área principal do sistema
          </div>
        </div>

        {atalhosVisiveis.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-700">
            Nenhum módulo liberado para este perfil no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
            {atalhosVisiveis.map((item) => (
              <CardAtalho
                key={item.href}
                titulo={item.titulo}
                descricao={item.descricao}
                icon={item.icon}
                iconBg={item.iconBg}
                iconText={item.iconText}
                badgeBg={item.badgeBg}
                badgeText={item.badgeText}
                cardGlow={item.cardGlow}
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}