"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  House,
  LayoutDashboard,
  Printer,
  CreditCard,
  Users,
  UserSquare2,
  Dumbbell,
  Landmark,
  Settings2,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  ActivitySquare,
  X,
} from "lucide-react";
import { Permissao, PermissoesObjeto, temPermissao } from "@/lib/permissoes";
import { useDeviceMode } from "@/hooks/useDeviceMode";

type MenuItem = {
  href: string;
  label: string;
  icon: any;
  permissao?: Permissao;
};

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isMobile, isTablet, isDesktop } = useDeviceMode();

  const [nome, setNome] = useState("Usuário");
  const [tipo, setTipo] = useState("");
  const [academia, setAcademia] = useState("");
  const [logoAcademia, setLogoAcademia] = useState("");
  const [academiaId, setAcademiaId] = useState("");
  const [fixadoAberto, setFixadoAberto] = useState(false);
  const [hoverExpandido, setHoverExpandido] = useState(false);
  const [permissoesCustom, setPermissoesCustom] =
    useState<Partial<PermissoesObjeto> | null>(null);

  useEffect(() => {
    const carregarDados = () => {
      setNome(localStorage.getItem("treinoprint_user_nome") || "Usuário");
      setTipo(localStorage.getItem("treinoprint_user_tipo") || "");
      setAcademia(localStorage.getItem("treinoprint_academia_nome") || "");
      setLogoAcademia(localStorage.getItem("treinoprint_academia_logo") || "");
      setAcademiaId(localStorage.getItem("treinoprint_academia_id") || "");

      try {
        const rawPermissoes = localStorage.getItem("treinoprint_permissoes");
        setPermissoesCustom(rawPermissoes ? JSON.parse(rawPermissoes) : null);
      } catch {
        setPermissoesCustom(null);
      }
    };

    carregarDados();

    window.addEventListener("treinoprint-academia-updated", carregarDados);
    window.addEventListener("treinoprint-permissoes-updated", carregarDados);
    window.addEventListener("storage", carregarDados);

    return () => {
      window.removeEventListener("treinoprint-academia-updated", carregarDados);
      window.removeEventListener("treinoprint-permissoes-updated", carregarDados);
      window.removeEventListener("storage", carregarDados);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setHoverExpandido(false);
    }
  }, [isDesktop]);

  const sair = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const voltarSuperadmin = () => {
    localStorage.removeItem("treinoprint_academia_id");
    localStorage.removeItem("treinoprint_academia");
    localStorage.removeItem("treinoprint_academia_nome");
    localStorage.removeItem("treinoprint_academia_logo");

    window.dispatchEvent(new Event("treinoprint-academia-updated"));
    router.push("/superadmin");
  };

  const menuBase: MenuItem[] = [
    { href: "/", label: "Início", icon: House },
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      permissao: "dashboard",
    },
    {
      href: "/imprimir",
      label: "Imprimir",
      icon: Printer,
      permissao: "imprimir",
    },
    {
      href: "/pagamentos",
      label: "Pagamentos",
      icon: CreditCard,
      permissao: "pagamentos",
    },
    {
      href: "/alunos",
      label: "Alunos",
      icon: Users,
      permissao: "alunos",
    },
    {
      href: "/personals",
      label: "Personais",
      icon: UserSquare2,
      permissao: "personais",
    },
    {
      href: "/treinos",
      label: "Treinos",
      icon: Dumbbell,
      permissao: "treinos",
    },
    {
      href: "/financeiro",
      label: "Financeiro",
      icon: Landmark,
      permissao: "financeiro",
    },
    {
      href: "/avaliacoes",
      label: "Avaliações",
      icon: ActivitySquare,
      permissao: "imprimir",
    },
    {
      href: "/sistema",
      label: "Sistema",
      icon: Settings2,
      permissao: "sistema",
    },
  ];

  const menuComSuperadmin: MenuItem[] = [
    ...menuBase,
    {
      href: "/superadmin",
      label: "Super Admin",
      icon: ShieldCheck,
      permissao: "superadmin",
    },
  ];

  const menuFiltrado = useMemo(() => {
    const origem = tipo === "superadmin" ? menuComSuperadmin : menuBase;

    return origem.filter((item) => {
      if (!item.permissao) return true;
      return temPermissao(tipo, item.permissao, permissoesCustom);
    });
  }, [tipo, permissoesCustom]);

  const isMobileDrawer = isMobile || isTablet;
  const expandidaDesktop = fixadoAberto || hoverExpandido;
  const expandida = isMobileDrawer ? true : expandidaDesktop;
  const mostrarVoltarSuperadmin = tipo === "superadmin" && !!academiaId;

  const sidebarWidthClass = expandida ? "w-72" : "w-20";

  const handleLinkClick = () => {
    if (isMobileDrawer) {
      onMobileClose?.();
    }
  };

  const sidebarContent = (
    <aside
      onMouseEnter={() => {
        if (isDesktop) setHoverExpandido(true);
      }}
      onMouseLeave={() => {
        if (isDesktop) setHoverExpandido(false);
      }}
      className={[
        "h-screen bg-[#0b0f19] text-white flex flex-col border-r border-white/10 transition-all duration-300",
        sidebarWidthClass,
        isMobileDrawer
          ? "fixed left-0 top-0 z-50 shadow-2xl"
          : "sticky top-0",
      ].join(" ")}
    >
      <div className="p-4 border-b border-white/10">
        <div
          className={`flex ${
            expandida ? "justify-between" : "justify-center"
          } items-center mb-4`}
        >
          {expandida ? (
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                TreinoPrint
              </p>
              <p className="text-sm text-white/70">
                {academia || "Painel da academia"}
              </p>
            </div>
          ) : null}

          {isMobileDrawer ? (
            <button
              onClick={onMobileClose}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              aria-label="Fechar menu"
            >
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={() => setFixadoAberto((v) => !v)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              title={expandida ? "Recolher menu" : "Expandir menu"}
            >
              {expandida ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <div
            className={`${
              expandida ? "w-[140px] h-[140px]" : "w-12 h-12"
            } rounded-2xl bg-white/5 flex items-center justify-center overflow-hidden transition-all duration-300`}
          >
            <img
              src={logoAcademia || "/logo-padrao.png"}
              alt="Logo da academia"
              className={`${
                expandida ? "w-[130px] h-[130px]" : "w-10 h-10"
              } object-contain transition-all duration-300`}
            />
          </div>

          {expandida ? (
            <>
              <h1 className="text-2xl font-black leading-none text-center">
                TreinoPrint
              </h1>
              <p className="text-sm text-gray-300 text-center">{nome}</p>
              <p className="text-xs text-gray-500 text-center break-words">
                {academia || "Academia"}
              </p>

              {tipo === "superadmin" ? (
                <span className="mt-1 text-[10px] px-2 py-1 rounded-full bg-emerald-600 text-white font-semibold">
                  SUPERADMIN
                </span>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {menuFiltrado.map((item) => {
          const ativo =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={handleLinkClick}
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                ativo
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              } ${expandida ? "" : "justify-center px-2"}`}
            >
              <Icon size={18} className="shrink-0" />
              {expandida ? (
                <span className="truncate">{item.label}</span>
              ) : null}
            </Link>
          );
        })}

        {mostrarVoltarSuperadmin ? (
          <button
            onClick={() => {
              voltarSuperadmin();
              if (isMobileDrawer) onMobileClose?.();
            }}
            title="Voltar ao SuperAdmin"
            className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition bg-emerald-600 hover:bg-emerald-700 text-white ${
              expandida ? "" : "justify-center px-2"
            }`}
          >
            <ArrowLeftRight size={18} className="shrink-0" />
            {expandida ? <span className="truncate">Voltar ao SuperAdmin</span> : null}
          </button>
        ) : null}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={sair}
          className={`w-full rounded-2xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2 ${
            expandida ? "" : "px-2"
          }`}
          title="Sair"
        >
          <LogOut size={18} className="shrink-0" />
          {expandida ? <span>Sair</span> : null}
        </button>
      </div>
    </aside>
  );

  if (isMobileDrawer) {
    return (
      <>
        {mobileOpen ? (
          <>
            <button
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px]"
              onClick={onMobileClose}
              aria-label="Fechar overlay do menu"
            />
            {sidebarContent}
          </>
        ) : null}
      </>
    );
  }

  return sidebarContent;
}