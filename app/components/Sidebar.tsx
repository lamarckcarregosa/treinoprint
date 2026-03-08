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
} from "lucide-react";
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

  useEffect(() => {
    setNome(localStorage.getItem("treinoprint_user_nome") || "Usuário");
    setTipo(localStorage.getItem("treinoprint_user_tipo") || "");
    setAcademia(localStorage.getItem("treinoprint_academia_nome") || "");
    setLogo(localStorage.getItem("treinoprint_academia_logo") || "");
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const menuAdmin: MenuItem[] = [
    { href: "/", label: "Início", icon: <House size={18} /> },
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/alunos", label: "Alunos", icon: <Users size={18} /> },
    { href: "/personals", label: "Personais", icon: <UserSquare2 size={18} /> },
    { href: "/treinos", label: "Treinos", icon: <Dumbbell size={18} /> },
    { href: "/usuarios", label: "Usuários", icon: <UserCog size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menuPersonal: MenuItem[] = [
    { href: "/", label: "Início", icon: <House size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/treinos", label: "Treinos", icon: <Dumbbell size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menuRecepcao: MenuItem[] = [
    { href: "/", label: "Início", icon: <House size={18} /> },
    { href: "/imprimir", label: "Imprimir", icon: <Printer size={18} /> },
    { href: "/usuarios/novasenha", label: "Alterar senha", icon: <KeyRound size={18} /> },
  ];

  const menu =
    tipo === "admin"
      ? menuAdmin
      : tipo === "personal"
      ? menuPersonal
      : menuRecepcao;

  return (
    <aside className="w-72 min-h-screen bg-black text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-center mb-4">
          <img
            src={logo || "/logo-padrao.png"}
            alt="Logo"
            className="w-[75px] h-[75px] object-contain drop-shadow-md"
          />
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black leading-none">TreinoPrint</h1>
          <p className="text-sm text-gray-400 mt-2">{nome}</p>
          <p className="text-xs text-gray-500">{academia}</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
          const ativo = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                ativo
                  ? "bg-white text-black font-semibold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={sair}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 transition"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}