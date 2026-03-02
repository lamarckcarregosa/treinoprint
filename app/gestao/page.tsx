"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authcontext";
import { supabase } from "../../lib/supabase";

interface Aluno { id:number; nome:string }
interface Personal { id:number; nome:string }

interface Exercicio {
  nome:string;
  series:string;
  repeticoes:string;
  carga:string;
  observacao:string;
}

interface Treino {
  id:number;
  dia:string;
  nivel:string;
  tipo:string;
  exercicios:Exercicio[];
}

export default function Gestao() {

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(()=>{
    if(!loading && !user){
      router.push("/login");
    }
  },[user,loading,router]);

  if(loading) return <p className="p-6">Carregando...</p>;

  const logout = async ()=>{
    await supabase.auth.signOut();
    router.push("/login");
  };

  const dias = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
  const niveis = ["Iniciante","Intermediário","Avançado"];
  const tipos = ["Masculino","Feminino"];

  const [alunos,setAlunos] = useState<Aluno[]>([]);
  const [personals,setPersonals] = useState<Personal[]>([]);
  const [treinos,setTreinos] = useState<Treino[]>([]);

  const [novoAluno,setNovoAluno] = useState("");
  const [novoPersonal,setNovoPersonal] = useState("");

  const [novoTreino,setNovoTreino] = useState({
    dia:"Segunda",
    nivel:"Iniciante",
    tipo:"Masculino",
    exercicios:[] as Exercicio[]
  });

  const [novoExercicio,setNovoExercicio] = useState<Exercicio>({
    nome:"",
    series:"",
    repeticoes:"",
    carga:"",
    observacao:""
  });

  const carregarDados = async ()=>{
    const [a,p,t] = await Promise.all([
      fetch("/api/alunos").then(r=>r.json()),
      fetch("/api/personals").then(r=>r.json()),
      fetch("/api/treinos").then(r=>r.json())
    ]);

    const treinosParse = t.map((tr:any)=>({
      ...tr,
      exercicios: typeof tr.exercicios === "string"
        ? JSON.parse(tr.exercicios)
        : tr.exercicios
    }));

    setAlunos(a);
    setPersonals(p);
    setTreinos(treinosParse);
  };

  useEffect(()=>{ carregarDados(); },[]);

  const adicionarPersonal = async ()=>{
    if(!novoPersonal || !user) return;

    await supabase.from("personals").insert([
      { nome: novoPersonal, user_id: user.id }
    ]);

    setNovoPersonal("");
    carregarDados();
  };

  const excluirPersonal = async (id:number)=>{
    await fetch(`/api/personals/${id}`,{method:"DELETE"});
    carregarDados();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Gestão TreinoPrint</h1>

      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Sair
      </button>
    </div>
  );
}