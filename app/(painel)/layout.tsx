import { ReactNode } from "react";
import AppShell from "@/components/layout/AppShell";

export default function PainelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AppShell title="TreinoPrint Painel">{children}</AppShell>;
}