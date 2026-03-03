"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {

  const router = useRouter();
  const [email,setEmail] = useState("");
  const [senha,setSenha] = useState("");
  const [erro,setErro] = useState("");

  const entrar = async ()=>{
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

    if(error){
      setErro("Email ou senha inválidos");
      return;
    }

    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-xl w-96 space-y-4">

        <h1 className="text-2xl font-bold text-center">TreinoPrint</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={e=>setSenha(e.target.value)}
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
  );
}