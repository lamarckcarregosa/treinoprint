"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings2,
  Users,
  KeyRound,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import ProtegePagina from "@/components/ProtegePagina";

function CardSistema({
  titulo,
  descricao,
  onClick,
  icon: Icon,
  destaque = false,
}: {
  titulo: string;
  descricao: string;
  onClick: () => void;
  icon: any;
  destaque?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full text-left rounded-3xl border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        destaque
          ? "bg-black text-white border-black"
          : "bg-white text-gray-900 border-black/5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              destaque
                ? "bg-white/10 text-white"
                : "bg-black text-white"
            }`}
          >
            <Icon size={22} />
          </div>

          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p
              className={`mt-2 text-sm ${
                destaque ? "text-white/80" : "text-gray-500"
              }`}
            >
              {descricao}
            </p>
          </div>
        </div>

        <div
          className={`transition group-hover:translate-x-1 ${
            destaque ? "text-white" : "text-gray-400"
          }`}
        >
          <ArrowRight size={20} />
        </div>
      </div>
    </button>
  );
}

function SistemaPageContent() {
  const router = useRouter();
  const [tipoUsuario, setTipoUsuario] = useState("");

  useEffect(() => {
    setTipoUsuario(localStorage.getItem("treinoprint_user_tipo") || "");
  }, []);

  if (tipoUsuario && tipoUsuario !== "admin") {
    return <p className="p-6">Acesso negado.</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Sistema</h1>
        <p className="text-gray-500 mt-2">
          Administração, segurança e configurações gerais da academia
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <CardSistema
          titulo="Usuários"
          descricao="Cadastrar, editar, ativar e gerenciar usuários da academia."
          onClick={() => router.push("/usuarios")}
          icon={Users}
        />

        <CardSistema
          titulo="Configurações da academia"
          descricao="Atualize nome, logo, telefone, e-mail, endereço e CNPJ."
          onClick={() => router.push("/configuracoes/academia")}
          icon={Settings2}
        />

        <CardSistema
          titulo="Alterar senha"
          descricao="Troque sua senha de acesso ao sistema com segurança."
          onClick={() => router.push("/usuarios/novasenha")}
          icon={KeyRound}
        />

        <CardSistema
          titulo="Planos"
          descricao="Cadastre e gerencie os planos comerciais dos alunos."
          onClick={() => router.push("/sistema/planos")}
          icon={Settings2}
        />
        <CardSistema
  titulo="Permissões"
  descricao="Defina o acesso de cada usuário às áreas do sistema."
  onClick={() => router.push("/sistema/permissoes")}
  icon={ShieldCheck}
/>

        {tipoUsuario === "superadmin" ? (
          <CardSistema
            titulo="Super Admin"
            descricao="Criar novas academias, administradores e preparar ambientes de teste."
            onClick={() => router.push("/superadmin/academias")}
            icon={ShieldCheck}
            destaque
          />
        ) : null}
      </section>
    </main>
  );
}

export default function SistemaPage() {
  return (
    <ProtegePagina permissao="sistema">
      <SistemaPageContent />
    </ProtegePagina>
  );
}