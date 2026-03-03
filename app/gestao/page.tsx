"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/authcontext";
import { supabase } from "../../lib/supabase";

interface Aluno { id: number; nome: string }
interface Personal { id: number; nome: string }

interface Exercicio {
  nome: string;
  series: string;
  repeticoes: string;
  carga: string;
  observacao: string;
}

interface Treino {
  id: number;
  dia: string;
  nivel: string;
  tipo: string;
  exercicios: Exercicio[];
}

export default function Gestao() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // ✅ hooks sempre no topo
  const dias = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
  const niveis = ["Iniciante","Intermediário","Avançado"];
  const tipos = ["Masculino","Feminino"];

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [personals, setPersonals] = useState<Personal[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>([]);

  const [novoAluno, setNovoAluno] = useState("");
  const [novoPersonal, setNovoPersonal] = useState("");

  const [novoTreino, setNovoTreino] = useState({
    dia: "Segunda",
    nivel: "Iniciante",
    tipo: "Masculino",
    exercicios: [] as Exercicio[],
  });

  const [novoExercicio, setNovoExercicio] = useState<Exercicio>({
    nome: "",
    series: "",
    repeticoes: "",
    carga: "",
    observacao: "",
  });

  // 🔐 proteção
  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const carregarDados = useCallback(async () => {
    const headers = await getAuthHeaders();

    const [a, p, t] = await Promise.all([
      fetch("/api/alunos", { headers }).then(r => r.json()),
      fetch("/api/personals", { headers }).then(r => r.json()),
      fetch("/api/treinos", { headers }).then(r => r.json()),
    ]);

    const treinosParse = (t || []).map((tr: any) => ({
      ...tr,
      exercicios: typeof tr.exercicios === "string" ? JSON.parse(tr.exercicios) : tr.exercicios,
    }));

    setAlunos(a || []);
    setPersonals(p || []);
    setTreinos(treinosParse);
  }, [getAuthHeaders]);

  // ✅ só carrega quando tiver user
  useEffect(() => {
    if (user) carregarDados();
  }, [user, carregarDados]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // =========================
  // ALUNOS
  // =========================
  const adicionarAluno = async () => {
    if (!novoAluno.trim()) return;

    const headers = {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    };

    await fetch("/api/alunos", {
      method: "POST",
      headers,
      body: JSON.stringify({ nome: novoAluno.trim() }),
    });

    setNovoAluno("");
    carregarDados();
  };

  const excluirAluno = async (id: number) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/alunos/${id}`, { method: "DELETE", headers });
    carregarDados();
  };

  // =========================
  // PERSONALS
  // =========================
  const adicionarPersonal = async () => {
    if (!novoPersonal.trim()) return;

    const headers = {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    };

    await fetch("/api/personals", {
      method: "POST",
      headers,
      body: JSON.stringify({ nome: novoPersonal.trim() }),
    });

    setNovoPersonal("");
    carregarDados();
  };

  const excluirPersonal = async (id: number) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/personals/${id}`, { method: "DELETE", headers });
    carregarDados();
  };

  // =========================
  // TREINOS
  // =========================
  const adicionarExercicio = () => {
    if (!novoExercicio.nome.trim()) return;

    setNovoTreino(prev => ({
      ...prev,
      exercicios: [...prev.exercicios, { ...novoExercicio, nome: novoExercicio.nome.trim() }],
    }));

    setNovoExercicio({
      nome: "",
      series: "",
      repeticoes: "",
      carga: "",
      observacao: "",
    });
  };

  const salvarTreino = async () => {
    if (novoTreino.exercicios.length === 0) return;

    const headers = {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    };

    await fetch("/api/treinos", {
      method: "POST",
      headers,
      body: JSON.stringify(novoTreino),
    });

    setNovoTreino({
      dia: "Segunda",
      nivel: "Iniciante",
      tipo: "Masculino",
      exercicios: [],
    });

    carregarDados();
  };

  const excluirTreino = async (id: number) => {
    const headers = await getAuthHeaders();
    await fetch(`/api/treinos/${id}`, { method: "DELETE", headers });
    carregarDados();
  };

  // ✅ render
  if (loading) return <p className="p-6">Carregando...</p>;
  if (!user) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão TreinoPrint</h1>
          <p className="text-xs text-gray-500 mt-1">Usuário logado: {user.email}</p>
        </div>

        <button onClick={logout} className="bg-red-600 text-white px-4 py-2 rounded">
          Sair
        </button>
      </div>

      {/* ALUNOS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold text-xl">Alunos</h2>

        <div className="flex gap-2">
          <input
            value={novoAluno}
            onChange={(e) => setNovoAluno(e.target.value)}
            placeholder="Nome do aluno"
            className="border p-2 flex-1 rounded"
          />
          <button onClick={adicionarAluno} className="bg-blue-600 text-white px-4 rounded">
            Cadastrar
          </button>
        </div>

        {alunos.map((a) => (
          <div key={a.id} className="flex justify-between border-b py-1">
            {a.nome}
            <button onClick={() => excluirAluno(a.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* PERSONALS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="font-semibold text-xl">Personals</h2>

        <div className="flex gap-2">
          <input
            value={novoPersonal}
            onChange={(e) => setNovoPersonal(e.target.value)}
            placeholder="Nome do personal"
            className="border p-2 flex-1 rounded"
          />
          <button onClick={adicionarPersonal} className="bg-blue-600 text-white px-4 rounded">
            Cadastrar
          </button>
        </div>

        {personals.map((p) => (
          <div key={p.id} className="flex justify-between border-b py-1">
            {p.nome}
            <button onClick={() => excluirPersonal(p.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* TREINOS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="font-semibold text-xl">Criar Treino</h2>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={novoTreino.dia}
            onChange={(e) => setNovoTreino({ ...novoTreino, dia: e.target.value })}
            className="border p-2 rounded"
          >
            {dias.map((d) => <option key={d}>{d}</option>)}
          </select>

          <select
            value={novoTreino.nivel}
            onChange={(e) => setNovoTreino({ ...novoTreino, nivel: e.target.value })}
            className="border p-2 rounded"
          >
            {niveis.map((n) => <option key={n}>{n}</option>)}
          </select>

          <select
            value={novoTreino.tipo}
            onChange={(e) => setNovoTreino({ ...novoTreino, tipo: e.target.value })}
            className="border p-2 rounded"
          >
            {tipos.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-5 gap-2">
          <input
            placeholder="Exercício"
            value={novoExercicio.nome}
            onChange={(e) => setNovoExercicio({ ...novoExercicio, nome: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Séries"
            value={novoExercicio.series}
            onChange={(e) => setNovoExercicio({ ...novoExercicio, series: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Reps"
            value={novoExercicio.repeticoes}
            onChange={(e) => setNovoExercicio({ ...novoExercicio, repeticoes: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Carga"
            value={novoExercicio.carga}
            onChange={(e) => setNovoExercicio({ ...novoExercicio, carga: e.target.value })}
            className="border p-2 rounded"
          />
          <button onClick={adicionarExercicio} className="bg-green-600 text-white rounded">
            +
          </button>
        </div>

        {novoTreino.exercicios.map((ex, i) => (
          <div key={i} className="text-sm border-b py-1">
            {ex.nome} — {ex.series || "-"}x{ex.repeticoes || "-"} — {ex.carga || "-"}
          </div>
        ))}

        <button onClick={salvarTreino} className="bg-black text-white px-4 py-2 rounded">
          Salvar Treino
        </button>

        <h3 className="font-semibold mt-6">Treinos Cadastrados</h3>

        {treinos.map((t) => (
          <div key={t.id} className="border p-2 rounded flex justify-between">
            {t.dia} | {t.nivel} | {t.tipo}
            <button onClick={() => excluirTreino(t.id)} className="text-red-600">
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}