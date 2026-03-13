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
  ActivitySquare,
} from "lucide-react";

type Permissoes = {
  dashboard?: boolean;
  alunos?: boolean;
  personais?: boolean;
  treinos?: boolean;
  imprimir?: boolean;
  pagamentos?: boolean;
  financeiro?: boolean;
  sistema?: boolean;
  senha?: boolean;
};

type Atalho = {
  chave: keyof Permissoes | "usuarios";
  titulo: string;
  descricao: string;
  href: string;
  icon: any;
};

function CardAtalho({
  titulo,
  descricao,
  icon: Icon,
  onClick,
}: {
  titulo: string;
  descricao: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-3xl border border-black/5 bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
            <Icon size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
            <p className="text-sm text-gray-500 mt-1">{descricao}</p>
          </div>
        </div>

        <ArrowRight
          size={18}
          className="text-gray-400 transition group-hover:translate-x-1 shrink-0"
        />
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
        senha: true,
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
        senha: true,
      });
      return;
    }

    if (tipo === "recepcao") {
      setPermissoes({
        imprimir: true,
        pagamentos: true,
        alunos: true,
        senha: true,
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

  const atalhosBase: Atalho[] = [
    {
      chave: "dashboard",
      titulo: "Dashboard",
      descricao: "Visão geral da academia",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      chave: "imprimir",
      titulo: "Imprimir",
      descricao: "Impressão de treinos",
      href: "/imprimir",
      icon: Printer,
    },
    {
      chave: "alunos",
      titulo: "Alunos",
      descricao: "Cadastro e consulta",
      href: "/alunos",
      icon: Users,
    },
    {
      chave: "treinos",
      titulo: "Treinos",
      descricao: "Gerenciar treinos",
      href: "/treinos",
      icon: Dumbbell,
    },
    {
      chave: "personais",
      titulo: "Personais",
      descricao: "Cadastro de profissionais",
      href: "/personals",
      icon: UserSquare2,
    },
    {
      chave: "financeiro",
      titulo: "Financeiro",
      descricao: "Mensalidades e despesas",
      href: "/financeiro",
      icon: Landmark,
    },
    {
      chave: "sistema",
      titulo: "Usuários",
      descricao: "Controle de acesso",
      href: "/usuarios",
      icon: ShieldCheck,
    },
    {
      chave: "pagamentos",
      titulo: "Pagamentos",
      descricao: "Gestão de pagamentos",
      href: "/pagamentos",
      icon: CreditCard,
    },
  ];

  const atalhosVisiveis = useMemo(() => {
    if (perfilAtual === "admin" || perfilAtual === "superadmin") {
      return atalhosBase;
    }

    return atalhosBase.filter((item) => {
      if (item.chave === "usuarios") return Boolean(permissoes.sistema);
      return Boolean(permissoes[item.chave as keyof Permissoes]);
    });
  }, [perfilAtual, permissoes]);

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
              <span className="font-semibold">{perfilAtual || "-"}</span>
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

      <section className="rounded-[28px] bg-white border border-black/5 shadow-sm p-5">
        <h2 className="text-lg font-bold text-gray-900">Acessos rápidos</h2>
        <p className="text-sm text-gray-500 mt-1">
          Os módulos exibidos abaixo seguem as permissões do usuário logado.
        </p>

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
                onClick={() => router.push(item.href)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}