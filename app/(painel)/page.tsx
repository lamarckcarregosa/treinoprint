"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function HomePainelPage() {
  const [nome, setNome] = useState("Usuário");
  const [tipo, setTipo] = useState("");
  const [academia, setAcademia] = useState("");

  useEffect(() => {
    setNome(localStorage.getItem("treinoprint_user_nome") || "Usuário");
    setTipo(localStorage.getItem("treinoprint_user_tipo") || "");
    setAcademia(localStorage.getItem("treinoprint_academia_nome") || "");
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Início</h1>
        <p className="text-gray-500 mt-2">
          Bem-vindo, {nome} {academia ? `• ${academia}` : ""}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <p className="text-gray-700">
          Perfil atual: <strong>{tipo || "não definido"}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/dashboard" className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-2">Visão geral</p>
        </Link>

        <Link href="/imprimir" className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold">Imprimir</h2>
          <p className="text-sm text-gray-500 mt-2">Impressão de treinos</p>
        </Link>

        <Link href="/alunos" className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold">Alunos</h2>
          <p className="text-sm text-gray-500 mt-2">Cadastro e consulta</p>
        </Link>

        <Link href="/treinos" className="rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold">Treinos</h2>
          <p className="text-sm text-gray-500 mt-2">Gerenciar treinos</p>
        </Link>
      </div>
    </div>
  );
}