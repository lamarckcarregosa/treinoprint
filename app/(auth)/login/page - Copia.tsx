"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  
const router = useRouter();

const [academia,setAcademia] = useState("");
  const [usuario,setUsuario] = useState("");
  const [senha,setSenha] = useState("");
  const [erro,setErro] = useState("");

   const entrar = async () => {

    setErro("");

    if(!academia || !usuario || !senha){
      setErro("Preencha todos os campos");
      return;
    }

    const email = `${academia}.${usuario}@treinoprint.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if(error){
      setErro("Academia, usuário ou senha inválidos");
      return;
    }

    router.push("/");
  };

   

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* CARD */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image
            src="/logo-sistema.png"
            alt="TreinoPrint"
            width={70}
            height={70}
            priority
          />
          <h1 className="text-3xl font-extrabold tracking-tight">TreinoPrint</h1>
        </div>

        <div className="space-y-3">
           <input
          type="text"
          placeholder="Academia"
          value={academia}
          onChange={(e)=>setAcademia(e.target.value.toLowerCase())}
          className="w-full border p-3 rounded"
        />

        <input
          type="text"
          placeholder="Usuário"
          value={usuario}
          onChange={(e)=>setUsuario(e.target.value.toLowerCase())}
          className="w-full border p-3 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e)=>setSenha(e.target.value)}
          className="w-full border p-3 rounded"
        />

        {erro && <p className="text-red-500 text-sm">{erro}</p>}

        <button
          onClick={entrar}
          className="w-full bg-black text-white p-3 rounded"
        >
          Entrar
        </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Versão MVP v1</p>
        <p>By Lamarck Carregosa - 2026</p>
      </div>
    </main>
  );
}