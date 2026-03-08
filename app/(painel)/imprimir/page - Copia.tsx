"use client";

import { useEffect, useMemo, useState } from "react";

type Aluno = { id: number; nome: string };
type Personal = { id: string | number; nome: string };

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
};

const diasSemana = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const niveis = ["Iniciante", "Intermediário", "Avançado"];
const tipos = ["Masculino", "Feminino"];

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});

  if (academiaId) {
    headers.set("x-academia-id", academiaId);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export default function ImprimirPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [personals, setPersonals] = useState<Personal[]>([]);

  const [novoAluno, setNovoAluno] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");
  const LIMITE_LISTA = 7;

  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [personalSelecionado, setPersonalSelecionado] = useState("");

  const [diaSelecionado, setDiaSelecionado] = useState(diasSemana[0]);
  const [nivel, setNivel] = useState(niveis[0]);
  const [tipo, setTipo] = useState(tipos[0]);

  const [semana, setSemana] = useState("2026-03-02");

  const [treinoBanco, setTreinoBanco] = useState<any | null>(null);
  const [carregandoTreino, setCarregandoTreino] = useState(false);
  const [msgTreino, setMsgTreino] = useState("");

  const [modoLivre, setModoLivre] = useState(false);

  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [novoEx, setNovoEx] = useState<Exercicio>({
    nome: "",
    series: "",
    repeticoes: "",
    carga: "",
    obs: "",
  });

  const [loadingPagina, setLoadingPagina] = useState(true);
  const [erroPagina, setErroPagina] = useState("");

  const dataAtual = useMemo(
    () => new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }),
    []
  );

  const carregarAcademia = async () => {
    try {
      const res = await apiFetch("/api/minha-academia", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok) {
        console.error("Erro ao carregar academia:", json);
        return;
      }

      setLogoAcademia(json.logo_url || "");
      setNomeAcademia(json.nome || "");
    } catch (error) {
      console.error("Erro ao carregar academia:", error);
    }
  };

  const carregarPersonals = async () => {
    try {
      const res = await apiFetch("/api/personals", { cache: "no-store" });
      const json = await res.json().catch(() => []);
      const lista = Array.isArray(json) ? json : [];

      setPersonals(lista);

      if (lista.length > 0) {
        setPersonalSelecionado(lista[0].nome);
      }
    } catch (error) {
      console.error("Erro ao carregar personals:", error);
    }
  };

  const carregarAlunos = async () => {
    try {
      const res = await apiFetch("/api/alunos", { cache: "no-store" });
      const json = await res.json().catch(() => []);
      setAlunos(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setErroPagina("Erro ao carregar alunos");
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      try {
        setLoadingPagina(true);
        setErroPagina("");

        await Promise.all([
          carregarAcademia(),
          carregarAlunos(),
          carregarPersonals(),
        ]);
      } finally {
        setLoadingPagina(false);
      }
    };

    iniciar();
  }, []);

  const cadastrarAluno = async () => {
    const nome = novoAluno.trim();
    if (!nome) return;

    const res = await apiFetch("/api/alunos", {
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

    const res = await apiFetch(`/api/alunos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Erro ao excluir aluno");
      return;
    }

    await carregarAlunos();
  };

  const carregarModelo = async () => {
    setCarregandoTreino(true);
    setMsgTreino("");
    setTreinoBanco(null);

    try {
      const qs = new URLSearchParams({
        semana,
        dia: diaSelecionado,
        nivel,
        tipo,
      });

      const res = await apiFetch(`/api/treinos?${qs.toString()}`, { cache: "no-store" });
      const data = await res.json().catch(() => []);

      const primeiro = Array.isArray(data) ? data[0] : null;
      setTreinoBanco(primeiro);

      if (!primeiro) {
        setMsgTreino("Nenhum treino no banco para essa combinação.");
        if (!modoLivre) setExercicios([]);
        return;
      }

      setMsgTreino(`Treino carregado (ID: ${primeiro.id}).`);

      if (!modoLivre) {
        const ex = primeiro?.exercicios;
        setExercicios(Array.isArray(ex) ? ex : []);
      }
    } catch (error) {
      console.error("Erro ao buscar treino:", error);
      setMsgTreino("Erro ao buscar treino no banco.");
    } finally {
      setCarregandoTreino(false);
    }
  };

  const addExercicio = () => {
    if (!novoEx.nome.trim()) return;

    setModoLivre(true);
    setExercicios((prev) => [...prev, { ...novoEx, nome: novoEx.nome.trim().toUpperCase() }]);
    setNovoEx({
      nome: "",
      series: "",
      repeticoes: "",
      carga: "",
      obs: "",
    });
  };

  const delExercicio = (idx: number) => {
    setModoLivre(true);
    setExercicios((prev) => prev.filter((_, i) => i !== idx));
  };

  const imprimir = async () => {
  try {
    const userId =
      typeof window !== "undefined"
        ? localStorage.getItem("treinoprint_user_id")
        : null;

    await apiFetch("/api/historico-impressoes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        aluno_nome: alunoSelecionado,
        personal_nome: personalSelecionado,
        semana,
        dia: diaSelecionado,
        nivel,
        tipo,
        exercicios,
        user_id: userId,
      }),
    });
  } catch (error) {
    console.error("Erro ao salvar histórico da impressão:", error);
  }

  window.print();
};
  const alunosFiltrados = alunos
    .filter((a) => a.nome.toLowerCase().includes(buscaAluno.toLowerCase()))
    .slice(0, LIMITE_LISTA);

  if (loadingPagina) {
    return <p className="p-6">Carregando...</p>;
  }

  if (erroPagina) {
    return <p className="p-6 text-red-600">{erroPagina}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Imprimir</h1>
        <p className="text-gray-500 mt-2">Geração e impressão de treinos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
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

            <input
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
              placeholder="Buscar aluno..."
              className="border rounded-xl p-3 w-full"
            />

            <div className="max-h-44 overflow-auto border rounded-xl">
              {alunos.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nenhum aluno cadastrado.</p>
              ) : (
                <>
                  {alunosFiltrados.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                    >
                      <span className="text-sm">{a.nome}</span>
                      <button onClick={() => removerAluno(a.id)} className="text-sm text-red-600">
                        Excluir
                      </button>
                    </div>
                  ))}

                  <div className="px-3 py-2 text-xs text-gray-500">
                    Mostrando {alunosFiltrados.length} de {alunos.length} alunos
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Semana</label>
              <input
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
                placeholder="2026-03-02"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Aluno</label>
              <select
                value={alunoSelecionado}
                onChange={(e) => setAlunoSelecionado(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              >
                <option value="">-- Selecione --</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.nome}>
                    {a.nome}
                  </option>
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
                {personals.map((p) => (
                  <option key={p.id} value={p.nome}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Dia</label>
              <select
                value={diaSelecionado}
                onChange={(e) => {
                  setModoLivre(false);
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setDiaSelecionado(e.target.value);
                }}
                className="w-full border rounded-xl p-3 mt-1"
              >
                {diasSemana.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-600">Nível</label>
              <select
                value={nivel}
                onChange={(e) => {
                  setModoLivre(false);
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setNivel(e.target.value);
                }}
                className="w-full border rounded-xl p-3 mt-1"
              >
                {niveis.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => {
                  setModoLivre(false);
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setTipo(e.target.value);
                }}
                className="w-full border rounded-xl p-3 mt-1"
              >
                {tipos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={carregarModelo}
                disabled={carregandoTreino}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl"
              >
                {carregandoTreino ? "Carregando..." : "Carregar treino do banco"}
              </button>

              <span className="text-xs">
                {treinoBanco ? (
                  <span className="text-green-700">Treino encontrado.</span>
                ) : (
                  <span className="text-gray-500">Selecione e clique para buscar.</span>
                )}
              </span>
            </div>

            {msgTreino ? (
              <div className="md:col-span-2 text-xs mt-2">
                <span className={treinoBanco ? "text-green-700" : "text-red-600"}>
                  {msgTreino}
                </span>
              </div>
            ) : null}

            <div className="md:col-span-2 flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                checked={modoLivre}
                onChange={(e) => setModoLivre(e.target.checked)}
              />
              <span className="text-sm text-gray-600">Modo livre (não puxar do banco)</span>
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow p-6 space-y-3">
            <h2 className="font-semibold">
              Exercícios {modoLivre ? "(treino livre)" : "(do banco)"}
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input
                className="border rounded-xl p-2 col-span-2"
                placeholder="Exercício"
                value={novoEx.nome}
                onChange={(e) => setNovoEx({ ...novoEx, nome: e.target.value })}
              />
              <input
                className="border rounded-xl p-2"
                placeholder="Séries"
                value={novoEx.series}
                onChange={(e) => setNovoEx({ ...novoEx, series: e.target.value })}
              />
              <input
                className="border rounded-xl p-2"
                placeholder="Reps"
                value={novoEx.repeticoes}
                onChange={(e) => setNovoEx({ ...novoEx, repeticoes: e.target.value })}
              />
              <input
                className="border rounded-xl p-2"
                placeholder="Carga"
                value={novoEx.carga}
                onChange={(e) => setNovoEx({ ...novoEx, carga: e.target.value })}
              />
            </div>

            <textarea
              className="border rounded-xl p-2 w-full"
              placeholder="Observação"
              value={novoEx.obs}
              onChange={(e) => setNovoEx({ ...novoEx, obs: e.target.value })}
            />

            <button onClick={addExercicio} className="w-full bg-black text-white rounded-xl p-3">
              Adicionar exercício
            </button>

            <div className="border rounded-xl">
              {exercicios.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nenhum exercício.</p>
              ) : (
                exercicios.map((ex, i) => (
                  <div key={i} className="px-3 py-2 border-b last:border-b-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">
                        {i + 1}. {ex.nome}
                      </p>
                      <button onClick={() => delExercicio(i)} className="text-sm text-red-600">
                        Remover
                      </button>
                    </div>
                    <p className="text-xs text-gray-600">
                      Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga:{" "}
                      {ex.carga || "-"}
                    </p>
                    {ex.obs ? <p className="text-xs italic text-gray-500">Obs: {ex.obs}</p> : null}
                  </div>
                ))
              )}
            </div>
          </section>

          <button
            onClick={imprimir}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl p-4 font-semibold"
          >
            Imprimir treino
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="print-area bg-white p-3 mx-auto font-mono text-xs">
            <div className="text-center mb-2">
              {logoAcademia ? (
                <img
                  src={logoAcademia}
                  alt="Logo da academia"
                  style={{ width: "130px", margin: "0 auto" }}
                />
              ) : (
                <img
                  src="/logo-padrao.png"
                  alt="Logo padrão"
                  style={{ width: "130px", margin: "0 auto" }}
                />
              )}

              <p className="text-sm font-bold mt-2">{nomeAcademia}</p>
              <p className="text-lg font-bold tracking-widest">TREINO PERSONALIZADO</p>
              <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
            </div>

            <div className="border-t border-dashed my-3" />

            <div className="text-xs space-y-1">
              <p>
                <strong>Aluno:</strong> {alunoSelecionado || "_____________"}
              </p>
              <p>
                <strong>Personal:</strong> {personalSelecionado || "_____________"}
              </p>
              <p>
                <strong>Data:</strong> {dataAtual}
              </p>
              <p>
                <strong>Treino:</strong> {diaSelecionado}
              </p>
              <p>
                <strong>Nível:</strong> {nivel}
              </p>
              <p>
                <strong>Tipo:</strong> {tipo}
              </p>
            </div>

            <div className="border-t border-dashed my-3" />

            {exercicios.map((ex, i) => (
              <div key={i} className="text-xs mb-4">
                <p className="font-bold text-sm">
                  {i + 1}. {ex.nome}
                </p>
                <p>
                  Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga:{" "}
                  {ex.carga || "-"}
                </p>
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
  );
}
