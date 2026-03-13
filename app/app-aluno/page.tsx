"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AppAlunoIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const logado =
      typeof window !== "undefined"
        ? localStorage.getItem("treinoprint_aluno_logado")
        : null;

    if (logado) {
      router.replace("/app-aluno/inicio");
    } else {
      router.replace("/app-aluno/login");
    }
  }, [router]);

  return <p className="p-4">Carregando...</p>;
}