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
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 ${
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto w-full flex items-center">
        <Item
          ativo={pathname === "/app-aluno/inicio"}
          label="Início"
          icon={House}
          onClick={() => router.push("/app-aluno/inicio")}
        />

        <Item
          ativo={pathname === "/app-aluno/treinos"}
          label="Treinos"
          icon={Dumbbell}
          onClick={() => router.push("/app-aluno/treinos")}
        />

        <Item
          ativo={pathname === "/app-aluno/avaliacoes"}
          label="Avaliações"
          icon={Activity}
          onClick={() => router.push("/app-aluno/avaliacoes")}
        />

        <Item
          ativo={pathname === "/app-aluno/financeiro"}
          label="Financeiro"
          icon={CreditCard}
          onClick={() => router.push("/app-aluno/financeiro")}
        />

        <Item
          ativo={pathname === "/app-aluno/perfil"}
          label="Perfil"
          icon={UserCircle2}
          onClick={() => router.push("/app-aluno/perfil")}
        />
      </div>
    </div>
  );
}