"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AppAlunoBottomNav from "@/components/AppAlunoBottomNav";

export default function LayoutAluno({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const esconderMenu = pathname === "/app-aluno/login";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-black text-white p-4 font-bold text-lg">
        TreinoPrint Aluno
      </header>

      <main className={`flex-1 p-4 max-w-md mx-auto w-full ${!esconderMenu ? "pb-24" : ""}`}>
        {children}
      </main>

      {!esconderMenu ? <AppAlunoBottomNav /> : null}
    </div>
  );
}