"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  House,
  Dumbbell,
  Activity,
  CreditCard,
  UserCircle2,
} from "lucide-react";

function Item({
  ativo,
  label,
  icon: Icon,
  onClick,
}: {
  ativo: boolean;
  label: string;
  icon: any;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 transition ${
        ativo ? "text-black font-semibold" : "text-gray-500"
      }`}
    >
      <Icon size={20} />
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

export default function AppAlunoBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const ativoInicio = pathname === "/app-aluno/inicio";
  const ativoTreinos =
    pathname === "/app-aluno/treinos" || pathname.startsWith("/app-aluno/treinos/");
  const ativoAvaliacoes =
    pathname === "/app-aluno/avaliacoes" || pathname.startsWith("/app-aluno/avaliacoes/");
  const ativoFinanceiro =
    pathname === "/app-aluno/financeiro" || pathname.startsWith("/app-aluno/financeiro/");
  const ativoPerfil =
    pathname === "/app-aluno/perfil" || pathname.startsWith("/app-aluno/perfil/");

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="mx-auto flex w-full max-w-md items-center">
        <Item
          ativo={ativoInicio}
          label="Início"
          icon={House}
          onClick={() => router.push("/app-aluno/inicio")}
        />

        <Item
          ativo={ativoTreinos}
          label="Treinos"
          icon={Dumbbell}
          onClick={() => router.push("/app-aluno/treinos")}
        />

        <Item
          ativo={ativoAvaliacoes}
          label="Avaliações"
          icon={Activity}
          onClick={() => router.push("/app-aluno/avaliacoes")}
        />

        <Item
          ativo={ativoFinanceiro}
          label="Financeiro"
          icon={CreditCard}
          onClick={() => router.push("/app-aluno/financeiro")}
        />

        <Item
          ativo={ativoPerfil}
          label="Perfil"
          icon={UserCircle2}
          onClick={() => router.push("/app-aluno/perfil")}
        />
      </div>
    </div>
  );
}