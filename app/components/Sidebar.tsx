"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House,
  LayoutDashboard,
  Printer,
  Users,
  Dumbbell,
  UserCog,
  KeyRound,
  LogOut,
  UserSquare2,
  ChevronLeft,
  ChevronRight,
  BadgeDollarSign,
  Wallet2,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabase";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [nome, setNome] = useState("Usuário");
  const [tipo, setTipo] = useState("");
  const [academia, setAcademia] = useState("");
  const [logo, setLogo] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setNome(localStorage.getItem("treinoprint_user_nome") || "Usuário");
    setTipo(localStorage.getItem("treinoprint_user_tipo") || "");
    setAcademia(localStorage.getItem("treinoprint_academia_nome") || "");
    setLogo(localStorage.getItem("treinoprint_academia_logo") || "");
    setCollapsed(localStorage.getItem("treinoprint_sidebar_collapsed") === "true");
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("treinoprint_sidebar_collapsed", String(next));
  };

  const sair = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const menuAdmin: MenuItem[] = [
    { href: "/", label: "Início", icon: <House size={18} /> },
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/pagamentos", label: "Pagamentos", icon: <Wallet2 size={18} /> },
    { href: "/alunos", label: "Alunos", icon: <Users size={18} /> },
    { href: "/personals", label: "Personais", icon: <UserSquare2 size={18} /> },
    { href: "/treinos", label: "Treinos", icon: <Dumbbell size={18} /> },
    { href: "/usuarios", label: "Usuários", icon: <UserCog size={18} /> },
    { href: "/financeiro", label: "Financeiro", icon: <BadgeDollarSign size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menuPersonal: MenuItem[] = [
    { href: "/alunos", label: "Alunos", icon: <Users size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/treinos", label: "Treinos", icon: <Dumbbell size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menuRecepcao: MenuItem[] = [
    { href: "/alunos", label: "Alunos", icon: <Users size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/pagamentos", label: "Pagamentos", icon: <Wallet2 size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menu =
    tipo === "admin" ? menuAdmin : tipo === "personal" ? menuPersonal : menuRecepcao;

  return (
    <motion.aside
      animate={{ width: collapsed ? 88 : 280 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-zinc-950 text-white flex flex-col border-r border-white/10"
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          {!collapsed ? (
            <div className="text-sm font-semibold text-zinc-400">TreinoPrint</div>
          ) : (
            <div />
          )}

          <button
            onClick={toggleSidebar}
            className="rounded-xl bg-white/10 hover:bg-white/20 p-2 transition"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <img
            src={logo || "/logo-padrao.png"}
            alt="Logo"
            className="w-[100px] h-[100px] object-contain drop-shadow-md"
          />

          {!collapsed ? (
            <div className="text-center mt-3">
              <h1 className="text-xl font-black leading-none">TreinoPrint</h1>
              <p className="text-sm text-zinc-400 mt-2">{nome}</p>
              <p className="text-xs text-zinc-500">{academia}</p>
            </div>
          ) : null}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2">
        {menu.map((item) => {
          const ativo = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center ${collapsed ? "justify-center" : "gap-3"} rounded-2xl px-4 py-3 transition ${
                ativo
                  ? "bg-white text-black font-semibold shadow-lg"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
              title={collapsed ? item.label : ""}
            >
              {item.icon}
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={sair}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 transition"
        >
          <LogOut size={18} />
          {!collapsed ? <span>Sair</span> : null}
        </button>
      </div>
    </motion.aside>
  );
}