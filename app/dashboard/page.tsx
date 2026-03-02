"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

interface Treino { id:number; dia:string; nivel:string; tipo:string }

export default function Dashboard() {

  const { user, loading } = useAuth();
  const router = useRouter();

  const [treinos,setTreinos] = useState<Treino[]>([]);

  // 🔐 Proteção global
  useEffect(()=>{
    if(!loading && !user){
      router.push("/login");
    }
  },[user,loading]);

  // 🔄 Buscar treinos
  useEffect(()=>{
    const fetchTreinos = async ()=>{
      const res = await fetch("/api/treinos");
      const data = await res.json();
      setTreinos(data);
    };

    if(user) fetchTreinos();
  },[user]);

  if(loading) return <p className="p-6">Carregando...</p>;

  const totalTreinos = treinos.length;

  const diasMaisFrequentes = treinos.reduce((acc, t)=>{
    acc[t.dia] = (acc[t.dia]||0)+1;
    return acc;
  }, {} as Record<string,number>);

  const niveisCount = treinos.reduce((acc,t)=>{
    acc[t.nivel] = (acc[t.nivel]||0)+1;
    return acc;
  }, {} as Record<string,number>);

  const tiposCount = treinos.reduce((acc,t)=>{
    acc[t.tipo] = (acc[t.tipo]||0)+1;
    return acc;
  }, {} as Record<string,number>);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Dashboard TreinoPrint</h1>
      <p>Total de treinos cadastrados: <strong>{totalTreinos}</strong></p>

      <div>
        <h2 className="font-semibold">Treinos por Dia</h2>
        <ul>
          {Object.entries(diasMaisFrequentes).map(([dia,count])=>
            <li key={dia}>{dia}: {count}</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Treinos por Nível</h2>
        <ul>
          {Object.entries(niveisCount).map(([nivel,count])=>
            <li key={nivel}>{nivel}: {count}</li>
          )}
        </ul>
      </div>

      <div>
        <h2 className="font-semibold">Treinos por Tipo</h2>
        <ul>
          {Object.entries(tiposCount).map(([tipo,count])=>
            <li key={tipo}>{tipo}: {count}</li>
          )}
        </ul>
      </div>
    </div>
  );
}