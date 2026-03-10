"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Permissao } from "@/lib/permissoes";
import { usePermissao } from "@/hooks/usePermissao";

export default function ProtegePagina({
  permissao,
  children,
}: {
  permissao: Permissao;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { permitido, carregado } = usePermissao(permissao);

  useEffect(() => {
    if (carregado && !permitido) {
      router.replace("/");
    }
  }, [carregado, permitido, router]);

  if (!carregado) {
    return <p className="p-6">Carregando...</p>;
  }

  if (!permitido) {
    return <p className="p-6">Acesso negado.</p>;
  }

  return <>{children}</>;
}