"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

type MenuItem = {
  href: string;
  label: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    setNome(localStorage.getItem("treinoprint_user_nome") || "Usuário");
    setTipo(localStorage.getItem("treinoprint_user_tipo") || "");
  }, []);

  const sair = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("treinoprint_academia_id");
    localStorage.removeItem("treinoprint_academia");
    localStorage.removeItem("treinoprint_academia_nome");
    localStorage.removeItem("treinoprint_usuario");
    localStorage.removeItem("treinoprint_user_id");
    localStorage.removeItem("treinoprint_user_nome");
    localStorage.removeItem("treinoprint_user_tipo");
    router.push("/login");
  };

  const menuAdmin: MenuItem[] = [
    { href: "/", label: "Início" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/imprimir", label: "Imprimir" },
    { href: "/alunos", label: "Alunos" },
    { href: "/treinos", label: "Treinos" },
    { href: "/usuarios", label: "Usuários" },
    { href: "/alterar-senha", label: "Alterar senha" },
  ];

  const menuPersonal: MenuItem[] = [
    { href: "/", label: "Início" },
    { href: "/imprimir", label: "Imprimir" },
    { href: "/alunos", label: "Alunos" },
    { href: "/treinos", label: "Treinos" },
    { href: "/alterar-senha", label: "Alterar senha" },
  ];

  const menuRecepcao: MenuItem[] = [
    { href: "/", label: "Início" },
    { href: "/alunos", label: "Alunos" },
    { href: "/alterar-senha", label: "Alterar senha" },
  ];

  const menu =
    tipo === "admin"
      ? menuAdmin
      : tipo === "personal"
      ? menuPersonal
      : menuRecepcao;

  return (
    <aside className="w-64 min-h-screen bg-black text-white flex flex-col">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-black">TreinoPrint</h1>
        <p className="text-sm text-gray-400 mt-2">{nome}</p>
        <p className="text-xs text-gray-500 uppercase">{tipo || "usuário"}</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item) => {
          const ativo = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-4 py-3 transition ${
                ativo
                  ? "bg-white text-black font-semibold"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={sair}
          className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold hover:bg-red-700 transition"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}