"use client";

import { useRouter } from "next/navigation";

type Atalho = {
  titulo: string;
  subtitulo: string;
  rota: string;
};

export default function HomePage() {
  const router = useRouter();

  const atalhos: Atalho[] = [
    { titulo: "Dashboard", subtitulo: "Visão geral", rota: "/dashboard" },
    { titulo: "Imprimir", subtitulo: "Impressão de treinos", rota: "/imprimir" },
    { titulo: "Alunos", subtitulo: "Cadastro e consulta", rota: "/alunos" },
    { titulo: "Treinos", subtitulo: "Gerenciar treinos", rota: "/treinos" },
    { titulo: "Personais", subtitulo: "Cadastro de profissionais", rota: "/personals" },
    { titulo: "Financeiro", subtitulo: "Mensalidades e despesas", rota: "/financeiro" },
    { titulo: "Usuários", subtitulo: "Controle de acesso", rota: "/usuarios" },
    { titulo: "Pagamentos", subtitulo: "Gestão de pagamentos", rota: "/pagamentos" },
  ];

  const nome = typeof window !== "undefined"
    ? localStorage.getItem("treinoprint_user_nome") || "Usuário"
    : "Usuário";

  const academia = typeof window !== "undefined"
    ? localStorage.getItem("treinoprint_academia_nome") || ""
    : "";

  const tipo = typeof window !== "undefined"
    ? localStorage.getItem("treinoprint_user_tipo") || ""
    : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Início</h1>
        <p className="text-gray-500 mt-2">
          Bem-vindo, {nome} • {academia}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <p>
          Perfil atual: <strong>{tipo}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {atalhos.map((item) => (
          <button
            key={item.rota}
            onClick={() => router.push(item.rota)}
            className="bg-white rounded-2xl shadow p-5 text-left hover:shadow-md transition"
          >
            <p className="font-bold text-lg">{item.titulo}</p>
            <p className="text-sm text-gray-500 mt-2">{item.subtitulo}</p>
          </button>
        ))}
      </div>
    </div>
  );
}