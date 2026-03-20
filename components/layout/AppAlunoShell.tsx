"use client";

import { ReactNode } from "react";
import AppAlunoBottomNav from "@/components/layout/AppAlunoBottomNav";

type AppAlunoShellProps = {
  children: ReactNode;
  title?: string;
};

export default function AppAlunoShell({
  children,
  title = "TreinoPrint Aluno",
}: AppAlunoShellProps) {
  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-black px-4 py-4 text-white">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <span className="text-xs text-white/70">Aluno</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-4 pb-24 pt-4">
        {children}
      </main>

      <AppAlunoBottomNav />
    </div>
  );
}