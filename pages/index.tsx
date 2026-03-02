"use client";

import { useState } from "react";
import Gestao from "./gestao/page";
import Impressao from "./imprimir/page";
import Dashboard from "./dashboard/page";

export default function Home() {
  const [abaAtiva, setAbaAtiva] = useState<"dashboard" | "gestao" | "impressao">("dashboard");

  const renderConteudo = () => {
    switch (abaAtiva) {
      case "dashboard":
        return <Dashboard />;
      case "gestao":
        return <Gestao />;
      case "impressao":
        return <Impressao />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Menu lateral */}
      <aside className="w-60 bg-black text-white flex flex-col p-6 space-y-4">
        <div className="flex items-center gap-2 mb-8">
          <img src="/logo-sistema.png" alt="Logo" width={250} height={250} className="w-10 h-10"/>
          <h1 className="text-xl font-bold"></h1>
        </div>

        <button
          className={`text-left p-3 rounded-xl font-semibold ${abaAtiva==="dashboard" ? "bg-gray-800" : "hover:bg-gray-700"}`}
          onClick={()=>setAbaAtiva("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={`text-left p-3 rounded-xl font-semibold ${abaAtiva==="gestao" ? "bg-gray-800" : "hover:bg-gray-700"}`}
          onClick={()=>setAbaAtiva("gestao")}
        >
          Gestão
        </button>

        <button
          className={`text-left p-3 rounded-xl font-semibold ${abaAtiva==="impressao" ? "bg-gray-800" : "hover:bg-gray-700"}`}
          onClick={()=>setAbaAtiva("impressao")}
        >
          Imprimir Treino
        </button>
      </aside>

      {/* Conteúdo */}
      <main className="flex-1 p-6 overflow-auto">
        {renderConteudo()}
      </main>
    </div>
  );
}