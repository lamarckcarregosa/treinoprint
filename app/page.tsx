"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
mport { useAuth } from "@/context/AuthContext";

const diasSemana = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const niveis = ["Iniciante","Intermediário","Avançado"];
const tipos = ["Masculino","Feminino"];

interface Exercicio { nome:string; series:string; repeticoes:string; carga:string; observacao:string }
interface Aluno { id?:number; nome:string }
interface Personal { id?:number; nome:string }
interface Treino { id?:number; dia:string; nivel:string; tipo:string; exercicios:Exercicio[] }

export default function Home() {
  const router = useRouter();

  const [alunos,setAlunos] = useState<Aluno[]>([]);
  const [personals,setPersonals] = useState<Personal[]>([]);
  const [treinos,setTreinos] = useState<Treino[]>([]);

  const [nomeAluno,setNomeAluno] = useState("");
  const [nomePersonal,setNomePersonal] = useState("");
  const [diaSelecionado,setDiaSelecionado] = useState("Segunda");
  const [nivel,setNivel] = useState("Iniciante");
  const [tipo,setTipo] = useState("Masculino");

  const dataAtual = new Date().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"});
const { user, loading } = useAuth();

useEffect(()=>{
  if(!loading && !user){
    router.push("/login");
  }
},[user,loading]);

if(loading) return <p className="p-6">Carregando...</p>;
  // Carregar dados via API
  useEffect(()=>{
    const fetchData = async()=>{
      try{
        const [resAlunos,resPersonals,resTreinos] = await Promise.all([
          fetch("/api/alunos").then(r=>r.json()),
          fetch("/api/personals").then(r=>r.json()),
          fetch("/api/treinos").then(r=>r.json())
        ]);

        setAlunos(resAlunos);
        setPersonals(resPersonals);

        // Parse dos exercícios que estão em string JSON
        const treinosParseados = resTreinos.map((t:any)=>({
          ...t,
          exercicios: typeof t.exercicios === "string" ? JSON.parse(t.exercicios) : t.exercicios
        }));
        setTreinos(treinosParseados);

      }catch(e){
        console.error("Erro ao carregar dados:",e);
      }
    };
    fetchData();
  },[]);

  // Filtra os exercícios do treino selecionado (Dia/Nível/Tipo)
  const exerciciosDoTreino = treinos.find(t=>t.dia===diaSelecionado && t.nivel===nivel && t.tipo===tipo)?.exercicios || [];

  // Função impressão
  const imprimirTreino = ()=>{ window.print(); };

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-3xl w-full max-w-5xl overflow-hidden">
        {/* HEADER */}
        <div className="bg-black text-white p-4 flex items-center justify-center gap-4">
          <Image src="/logo-sistema.png" alt="Logo" width={90} height={90}/>
          <h4 className="text-xl font-bold">Imprimir Treino</h4>
        </div>

        <div className="p-6 space-y-4">

          {/* Seleção Aluno */}
          <div>
            <label className="text-sm font-semibold text-gray-600">Aluno</label>
            <select value={nomeAluno} onChange={e=>setNomeAluno(e.target.value)} className="w-full p-3 border rounded-xl mt-1">
              <option value="">-- Selecione --</option>
              {alunos.map(a=><option key={a.id} value={a.nome}>{a.nome}</option>)}
            </select>
          </div>

          {/* Seleção Personal */}
          <div>
            <label className="text-sm font-semibold text-gray-600 mt-2">Personal</label>
            <select value={nomePersonal} onChange={e=>setNomePersonal(e.target.value)} className="w-full p-3 border rounded-xl mt-1">
              <option value="">-- Selecione --</option>
              {personals.map(p=><option key={p.id} value={p.nome}>{p.nome}</option>)}
            </select>
          </div>

          {/* Dia / Nível / Tipo */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <label>Dia do treino</label>
              <select value={diaSelecionado} onChange={e=>setDiaSelecionado(e.target.value)} className="w-full p-3 border rounded-xl">{diasSemana.map(d=><option key={d}>{d}</option>)}</select>
            </div>
            <div>
              <label>Nível</label>
              <select value={nivel} onChange={e=>setNivel(e.target.value)} className="w-full p-3 border rounded-xl">{niveis.map(n=><option key={n}>{n}</option>)}</select>
            </div>
            <div>
              <label>Tipo</label>
              <select value={tipo} onChange={e=>setTipo(e.target.value)} className="w-full p-3 border rounded-xl">{tipos.map(t=><option key={t}>{t}</option>)}</select>
            </div>
          </div>

          {/* Área de impressão */}
          <div className="print-area bg-white p-6 max-w-sm mx-auto font-mono border border-gray-300 shadow-none mt-4">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="Logo Academia" style={{ width: "130px" }} />
            </div>
            <div className="text-center mb-2">
              <p className="text-lg font-bold tracking-widest">TREINO PERSONALIZADO</p>
              <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
            </div>
            <div className="border-t border-dashed my-3"></div>

            <div className="text-xs space-y-1">
              <p><strong>Aluno:</strong> {nomeAluno || "_____________"}</p>
              <p><strong>Personal:</strong> {nomePersonal || "_____________"}</p>
              <p><strong>Data:</strong> {dataAtual}</p>
              <p><strong>Treino:</strong> {diaSelecionado}</p>
              <p><strong>Nível:</strong> {nivel}</p>
              <p><strong>Tipo:</strong> {tipo}</p>
            </div>

            <div className="border-t border-dashed my-3"></div>

            {exerciciosDoTreino.map((ex,i)=>(
              <div key={i} className="text-xs mb-4">
                <p className="font-bold text-sm">{i+1}. {ex.nome.toUpperCase()}</p>
                <p>Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga: {ex.carga || "-"}</p>
                {ex.observacao && <p className="italic text-[11px]">Obs: {ex.observacao}</p>}
                <div className="border-t border-dashed mt-2"></div>
              </div>
            ))}

            <div className="text-center text-xs mt-4 space-y-1">
              <p>Horário: {new Date().toLocaleTimeString("pt-BR")}</p>
              <p className="font-semibold tracking-wider">Bom treino 💪</p>
            </div>
          </div>

          <button onClick={imprimirTreino} className="w-full bg-green-600 hover:bg-green-800 text-white p-4 rounded-2xl font-semibold mt-2 no-print">
            Imprimir Treino
          </button>

          <style jsx global>{`
            @media print {
              body * { visibility: hidden; }
              .print-area, .print-area * { visibility: visible; }
              .print-area { position: absolute; left: 0; top: 0; width: 100%; }
            }
          `}</style>
        </div>
      </div>
    </main>
  );
}