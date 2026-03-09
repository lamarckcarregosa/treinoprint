"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/authcontext";

type Aluno = { id: number; nome: string };

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
};

const diasSemana = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
const niveis = ["Iniciante","Intermediário","Avançado"];
const tipos = ["Masculino","Feminino"];

const personalsFixos = [
  "Orlando","Cris","Vitoria","Lucas","Ana","Pedro","Rafael","Bruna","Diego","Camila",
];

// ✅ Admin do Supabase via app_metadata.role === "admin"
function isAdminUser(user: any) {
  return user?.app_metadata?.role === "admin";
}

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [novoAluno, setNovoAluno] = useState("");

  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [personalSelecionado, setPersonalSelecionado] = useState(personalsFixos[0]);

  const [diaSelecionado, setDiaSelecionado] = useState(diasSemana[0]);
  const [nivel, setNivel] = useState(niveis[0]);
  const [tipo, setTipo] = useState(tipos[0]);

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [novoEx, setNovoEx] = useState<Exercicio>({
    nome: "",
    series: "",
    repeticoes: "",
    carga: "",
    obs: "",
  });

  const dataAtual = useMemo(
    () => new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    []
  );

  // 🔐 Proteção: só admin entra
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (!isAdminUser(user)) {
      router.push("/login");
      return;
    }
  }, [loading, user, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const carregarAlunos = async () => {
    const res = await fetch("/api/alunos");
    const json = await res.json().catch(() => []);
    setAlunos(Array.isArray(json) ? json : []);
  };

  // Só carrega quando estiver logado e admin
  useEffect(() => {
    if (!loading && user && isAdminUser(user)) {
      carregarAlunos();
    }
  }, [loading, user]);

  const cadastrarAluno = async () => {
    const nome = novoAluno.trim();
    if (!nome) return;

    const res = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert(err?.error ?? "Erro ao cadastrar aluno");
      return;
    }

    setNovoAluno("");
    await carregarAlunos();
  };

  const removerAluno = async (id: number) => {
    if (!confirm("Excluir este aluno?")) return;
    const res = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
    if (!res.ok) alert("Erro ao excluir aluno");
    await carregarAlunos();
  };

  const addExercicio = () => {
    if (!novoEx.nome?.trim()) return;
    setExercicios((prev) => [...prev, { ...novoEx, nome: novoEx.nome.trim().toUpperCase() }]);
    setNovoEx({ nome: "", series: "", repeticoes: "", carga: "", obs: "" });
  };

  const delExercicio = (idx: number) => {
    setExercicios((prev) => prev.filter((_, i) => i !== idx));
  };

  const imprimir = () => window.print();

  if (loading) return <p className="p-6">Carregando...</p>;
  if (!user) return null;
  if (!isAdminUser(user)) return <p className="p-6">Sem permissão.</p>;

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-sistema.png" alt="TreinoPrint" width={90} height={90} />
            <div>
              <h1 className="text-2xl font-bold">TreinoPrint</h1>
              <p className="text-xs text-gray-500">Logado: {user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
          >
            Sair
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COLUNA ESQUERDA */}
          <div className="space-y-6">
            {/* Cadastro de aluno */}
            <section className="bg-white rounded-2xl shadow p-6 space-y-3">
              <h2 className="font-semibold">Cadastro de alunos</h2>

              <div className="flex gap-2">
                <input
                  value={novoAluno}
                  onChange={(e) => setNovoAluno(e.target.value)}
                  placeholder="Nome do aluno"
                  className="border rounded-xl p-3 flex-1"
                />
                <button onClick={cadastrarAluno} className="bg-black text-white rounded-xl px-4">
                  Cadastrar
                </button>
              </div>

              <div className="max-h-44 overflow-auto border rounded-xl">
                {alunos.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">Nenhum aluno cadastrado.</p>
                ) : (
                  alunos.map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                      <span className="text-sm">{a.nome}</span>
                      <button onClick={() => removerAluno(a.id)} className="text-sm text-red-600">
                        Excluir
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Seleções */}
            <section className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-600">Aluno</label>
                <select
                  value={alunoSelecionado}
                  onChange={(e) => setAlunoSelecionado(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                >
                  <option value="">-- Selecione --</option>
                  {alunos.map((a) => (
                    <option key={a.id} value={a.nome}>{a.nome}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-600">Personal</label>
                <select
                  value={personalSelecionado}
                  onChange={(e) => setPersonalSelecionado(e.target.value)}
                  className="w-full border rounded-xl p-3 mt-1"
                >
                  {personalsFixos.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Dia</label>
                <select value={diaSelecionado} onChange={(e) => setDiaSelecionado(e.target.value)} className="w-full border rounded-xl p-3 mt-1">
                  {diasSemana.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Nível</label>
                <select value={nivel} onChange={(e) => setNivel(e.target.value)} className="w-full border rounded-xl p-3 mt-1">
                  {niveis.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-600">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full border rounded-xl p-3 mt-1">
                  {tipos.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </section>

            {/* Exercícios */}
            <section className="bg-white rounded-2xl shadow p-6 space-y-3">
              <h2 className="font-semibold">Exercícios (treino livre)</h2>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <input className="border rounded-xl p-2 col-span-2" placeholder="Exercício"
                  value={novoEx.nome} onChange={(e) => setNovoEx({ ...novoEx, nome: e.target.value })} />
                <input className="border rounded-xl p-2" placeholder="Séries"
                  value={novoEx.series} onChange={(e) => setNovoEx({ ...novoEx, series: e.target.value })} />
                <input className="border rounded-xl p-2" placeholder="Reps"
                  value={novoEx.repeticoes} onChange={(e) => setNovoEx({ ...novoEx, repeticoes: e.target.value })} />
                <input className="border rounded-xl p-2" placeholder="Carga"
                  value={novoEx.carga} onChange={(e) => setNovoEx({ ...novoEx, carga: e.target.value })} />
              </div>

              <textarea className="border rounded-xl p-2 w-full" placeholder="Observação"
                value={novoEx.obs} onChange={(e) => setNovoEx({ ...novoEx, obs: e.target.value })} />

              <button onClick={addExercicio} className="w-full bg-black text-white rounded-xl p-3">
                Adicionar exercício
              </button>

              <div className="border rounded-xl">
                {exercicios.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">Nenhum exercício adicionado.</p>
                ) : (
                  exercicios.map((ex, i) => (
                    <div key={i} className="px-3 py-2 border-b last:border-b-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{i + 1}. {ex.nome}</p>
                        <button onClick={() => delExercicio(i)} className="text-sm text-red-600">Remover</button>
                      </div>
                      <p className="text-xs text-gray-600">
                        Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga: {ex.carga || "-"}
                      </p>
                      {ex.obs ? <p className="text-xs italic text-gray-500">Obs: {ex.obs}</p> : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            <button onClick={imprimir} className="no-print w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-semibold">
              Imprimir treino
            </button>
          </div>

          {/* COLUNA DIREITA */}
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="print-area bg-white p-6 max-w-sm mx-auto font-mono border border-gray-300">
              <div className="flex justify-center mb-4">
                <img src="/logo.png" alt="Logo Academia" style={{ width: "130px" }} />
              </div>

              <div className="text-center mb-2">
                <p className="text-lg font-bold tracking-widest">TREINO PERSONALIZADO</p>
                <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
              </div>

              <div className="border-t border-dashed my-3" />

              <div className="text-xs space-y-1">
                <p><strong>Aluno:</strong> {alunoSelecionado || "_____________"}</p>
                <p><strong>Personal:</strong> {personalSelecionado || "_____________"}</p>
                <p><strong>Data:</strong> {dataAtual}</p>
                <p><strong>Treino:</strong> {diaSelecionado}</p>
                <p><strong>Nível:</strong> {nivel}</p>
                <p><strong>Tipo:</strong> {tipo}</p>
              </div>

              <div className="border-t border-dashed my-3" />

              {exercicios.map((ex, i) => (
                <div key={i} className="text-xs mb-4">
                  <p className="font-bold text-sm">{i + 1}. {ex.nome}</p>
                  <p>Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga: {ex.carga || "-"}</p>
                  {ex.obs ? <p className="italic text-[11px]">Obs: {ex.obs}</p> : null}
                  <div className="border-t border-dashed mt-2" />
                </div>
              ))}

              <div className="text-center text-xs mt-4 space-y-1">
                <p>Horário: {new Date().toLocaleTimeString("pt-BR")}</p>
                <p className="font-semibold tracking-wider">Bom treino 💪</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}