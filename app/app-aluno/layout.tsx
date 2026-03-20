import { ReactNode } from "react";
import AppAlunoShell from "@/components/layout/AppAlunoShell";

export default function AppAlunoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppAlunoShell title="TreinoPrint Aluno">{children}</AppAlunoShell>;
}