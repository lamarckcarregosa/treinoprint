"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";

const logout = async ()=>{
  await supabase.auth.signOut();
  router.push("/login");
};

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
const { user, loading } = useAuth();
const router = useRouter();

useEffect(()=>{
  if(!loading && !user){
    router.push("/login");
  }
},[user,loading]);

if(loading) return <p className="p-6">Carregando...</p>;
export default function Gestao() {

  
  return (
    <div>
      ...
    </div>
  );
}

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

  // 🔄 Carregar dados
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

  // =========================
  // ALUNOS
  // =========================
  const adicionarAluno = async ()=>{
  if(!novoAluno || !user) return;

  // Buscar plano
  const { data: profile } = await supabase
    .from("profiles")
    .select("plano")
    .eq("id", user.id)
    .single();

  // Contar alunos
  const { count } = await supabase
    .from("alunos")
    .select("*", { count: "exact", head: true });

  if(profile?.plano === "free" && count! >= 10){
    alert("Limite do plano Free atingido (10 alunos).");
    return;
  }

  await supabase.from("alunos").insert([
    {
      nome: novoAluno,
      user_id: user.id
    }
  ]);

  setNovoAluno("");
  carregarDados();
};
  const excluirAluno = async (id:number)=>{
    await fetch(`/api/alunos/${id}`,{method:"DELETE"});
    carregarDados();
  };

  // =========================
  // PERSONALS
  // =========================
  const adicionarPersonal = async ()=>{
  if(!novoAluno || !user) return;

  await supabase.from("personals").insert([
    {
      nome: novoPersonal,
      user_id: user.id
    }
  ]);

  setNovoPersonal("");
  carregarDados();


  const excluirPersonal = async (id:number)=>{
    await fetch(`/api/personals/${id}`,{method:"DELETE"});
    carregarDados();
  };

  // =========================
  // TREINOS
  // =========================

  const adicionarExercicio = ()=>{
    if(!novoExercicio.nome) return;
    setNovoTreino({
      ...novoTreino,
      exercicios:[...novoTreino.exercicios,novoExercicio]
    });
    setNovoExercicio({
      nome:"",
      series:"",
      repeticoes:"",
      carga:"",
      observacao:""
    });
  };

  const salvarTreino = async ()=>{
    if(novoTreino.exercicios.length === 0) return;

    await fetch("/api/treinos",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(novoTreino)
    });

    setNovoTreino({
      dia:"Segunda",
      nivel:"Iniciante",
      tipo:"Masculino",
      exercicios:[]
    });

    carregarDados();
  };

  const excluirTreino = async (id:number)=>{
    await fetch(`/api/treinos/${id}`,{method:"DELETE"});
    carregarDados();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">

      <h1 className="text-3xl font-bold">Gestão TreinoPrint</h1>


<button
  onClick={logout}
  className="bg-red-600 text-white px-4 py-2 rounded"
>
  Sair
</button>
      {/* ================= ALUNOS ================= */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold text-xl">Alunos</h2>

        <div className="flex gap-2">
          <input
            value={novoAluno}
            onChange={e=>setNovoAluno(e.target.value)}
            placeholder="Nome do aluno"
            className="border p-2 flex-1 rounded"
          />
          <button onClick={adicionarAluno} className="bg-blue-600 text-white px-4 rounded">
            Cadastrar
          </button>
        </div>

        {alunos.map(a=>(
          <div key={a.id} className="flex justify-between border-b py-1">
            {a.nome}
            <button onClick={()=>excluirAluno(a.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* ================= PERSONALS ================= */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold text-xl">Personals</h2>

        <div className="flex gap-2">
          <input
            value={novoPersonal}
            onChange={e=>setNovoPersonal(e.target.value)}
            placeholder="Nome do personal"
            className="border p-2 flex-1 rounded"
          />
          <button onClick={adicionarPersonal} className="bg-blue-600 text-white px-4 rounded">
            Cadastrar
          </button>
        </div>

        {personals.map(p=>(
          <div key={p.id} className="flex justify-between border-b py-1">
            {p.nome}
            <button onClick={()=>excluirPersonal(p.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* ================= TREINOS ================= */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="font-semibold text-xl">Criar Treino</h2>

        <div className="grid grid-cols-3 gap-2">
          <select value={novoTreino.dia} onChange={e=>setNovoTreino({...novoTreino,dia:e.target.value})} className="border p-2 rounded">
            {dias.map(d=><option key={d}>{d}</option>)}
          </select>

          <select value={novoTreino.nivel} onChange={e=>setNovoTreino({...novoTreino,nivel:e.target.value})} className="border p-2 rounded">
            {niveis.map(n=><option key={n}>{n}</option>)}
          </select>

          <select value={novoTreino.tipo} onChange={e=>setNovoTreino({...novoTreino,tipo:e.target.value})} className="border p-2 rounded">
            {tipos.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Novo Exercício */}
        <div className="grid grid-cols-5 gap-2">
          <input placeholder="Exercício" value={novoExercicio.nome}
            onChange={e=>setNovoExercicio({...novoExercicio,nome:e.target.value})}
            className="border p-2 rounded"/>

          <input placeholder="Séries" value={novoExercicio.series}
            onChange={e=>setNovoExercicio({...novoExercicio,series:e.target.value})}
            className="border p-2 rounded"/>

          <input placeholder="Reps" value={novoExercicio.repeticoes}
            onChange={e=>setNovoExercicio({...novoExercicio,repeticoes:e.target.value})}
            className="border p-2 rounded"/>

          <input placeholder="Carga" value={novoExercicio.carga}
            onChange={e=>setNovoExercicio({...novoExercicio,carga:e.target.value})}
            className="border p-2 rounded"/>

          <button onClick={adicionarExercicio} className="bg-green-600 text-white rounded">
            +
          </button>
        </div>

        {novoTreino.exercicios.map((ex,i)=>(
          <div key={i} className="text-sm border-b py-1">
            {ex.nome} - {ex.series}x{ex.repeticoes}
          </div>
        ))}

        <button onClick={salvarTreino} className="bg-black text-white px-4 py-2 rounded">
          Salvar Treino
        </button>

        <h3 className="font-semibold mt-6">Treinos Cadastrados</h3>

        {treinos.map(t=>(
          <div key={t.id} className="border p-2 rounded flex justify-between">
            {t.dia} | {t.nivel} | {t.tipo}
            <button onClick={()=>excluirTreino(t.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}