"use client";

import { useEffect, useMemo, useState } from "react";

type Aluno = {
  id: number | string;
  nome: string;
};

type Personal = {
  id: number | string;
  nome: string;
};

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

  const [alunoSelecionado, setAlunoSelecionado] = useState("");
  const [personalSelecionado, setPersonalSelecionado] = useState("");

  const [buscaAluno, setBuscaAluno] = useState("");
  const [carregandoUltimo, setCarregandoUltimo] = useState(false);

  const [diaSelecionado, setDiaSelecionado] = useState(diasSemana[0]);
  const [nivel, setNivel] = useState(niveis[0]);
  const [tipo, setTipo] = useState(tipos[0]);
  const [semana, setSemana] = useState("2026-03-02");

  const [treinoBanco, setTreinoBanco] = useState<any | null>(null);
  const [carregandoTreino, setCarregandoTreino] = useState(false);
  const [msgTreino, setMsgTreino] = useState("");

  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);

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

  const carregarAlunos = async () => {
    try {
      const res = await apiFetch("/api/alunos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        console.error("Erro ao carregar alunos:", json);
        setErroPagina(json.error || "Erro ao carregar alunos");
        return;
      }

      const lista = Array.isArray(json) ? json : [];
      setAlunos(lista);

      if (lista.length > 0 && !alunoSelecionado) {
        setAlunoSelecionado(lista[0].nome);
      }
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
      setErroPagina("Erro ao carregar alunos");
    }
  };

  const carregarPersonals = async () => {
    try {
      const res = await apiFetch("/api/personals", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        console.error("Erro ao carregar personals:", json);
        return;
      }

      const lista = Array.isArray(json) ? json : [];
      setPersonals(lista);

      if (lista.length > 0 && !personalSelecionado) {
        setPersonalSelecionado(lista[0].nome);
      }
    } catch (error) {
      console.error("Erro ao carregar personals:", error);
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

      if (!res.ok) {
        setMsgTreino("Erro ao buscar treino no banco.");
        setExercicios([]);
        return;
      }

      const primeiro = Array.isArray(data) ? data[0] : null;
      setTreinoBanco(primeiro);

      if (!primeiro) {
        setMsgTreino("Nenhum treino no banco para essa combinação.");
        setExercicios([]);
        return;
      }

      setMsgTreino(`Treino carregado com sucesso.`);
      setExercicios(Array.isArray(primeiro.exercicios) ? primeiro.exercicios : []);
    } catch (error) {
      console.error("Erro ao buscar treino:", error);
      setMsgTreino("Erro ao buscar treino no banco.");
      setExercicios([]);
    } finally {
      setCarregandoTreino(false);
    }
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

  if (loadingPagina) {
    return <p className="p-6">Carregando...</p>;
  }

  if (erroPagina) {
    return <p className="p-6 text-red-600">{erroPagina}</p>;
  }
const alunosFiltrados = alunos.filter((a) =>
  a.nome.toLowerCase().includes(buscaAluno.toLowerCase())
);

const reimprimirUltimoTreino = async () => {
  try {
    setCarregandoUltimo(true);

    const res = await apiFetch("/api/historico-impressoes/ultimo", {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || "Nenhum treino anterior encontrado");
      return;
    }

    setAlunoSelecionado(json.aluno_nome || "");
    setPersonalSelecionado(json.personal_nome || "");
    setSemana(json.semana || "");
    setDiaSelecionado(json.dia || diasSemana[0]);
    setNivel(json.nivel || niveis[0]);
    setTipo(json.tipo || tipos[0]);
    setExercicios(Array.isArray(json.exercicios) ? json.exercicios : []);
    setTreinoBanco({
      id: json.id,
    });
    setMsgTreino("Último treino carregado para reimpressão.");
  } catch (error) {
    console.error(error);
    alert("Erro ao buscar último treino impresso");
  } finally {
    setCarregandoUltimo(false);
  }
};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-gray-900">Imprimir</h1>
        <p className="text-gray-500 mt-2">Selecione aluno, personal e carregue o treino do banco</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <section className="bg-white rounded-2xl shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Semana</label>
              <input
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
                placeholder="2026-03-02"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Defina a semana do treino a ser buscado
              </p>
            </div>

            <div className="md:col-span-2">
  <label className="text-sm font-semibold text-gray-600">Aluno</label>

  <input
    value={buscaAluno}
    onChange={(e) => setBuscaAluno(e.target.value)}
    placeholder="Buscar aluno..."
    className="w-full border rounded-xl p-3 mt-1"
  />

  <div className="mt-2 border rounded-xl max-h-44 overflow-auto">
    {alunosFiltrados.length === 0 ? (
      <p className="p-3 text-sm text-gray-500">Nenhum aluno encontrado.</p>
    ) : (
      alunosFiltrados.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => {
            setAlunoSelecionado(a.nome);
            setBuscaAluno(a.nome);
          }}
          className={`w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-gray-50 ${
            alunoSelecionado === a.nome ? "bg-blue-50 font-semibold" : ""
          }`}
        >
          {a.nome}
        </button>
      ))
    )}
  </div>
</div>

            <div className="md:col-span-2">
              <label className="text-sm font-semibold text-gray-600">Personal</label>
              <select
                value={personalSelecionado}
                onChange={(e) => setPersonalSelecionado(e.target.value)}
                className="w-full border rounded-xl p-3 mt-1"
              >
                <option value="">-- Selecione --</option>
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
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setExercicios([]);
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
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setExercicios([]);
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
                  setTreinoBanco(null);
                  setMsgTreino("");
                  setExercicios([]);
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
              <div className="md:col-span-2 flex items-center gap-2 pt-2">
  <button
    type="button"
    onClick={reimprimirUltimoTreino}
    disabled={carregandoUltimo}
    className="bg-gray-800 hover:bg-black disabled:opacity-60 text-white px-4 py-2 rounded-xl"
  >
    {carregandoUltimo ? "Carregando..." : "Reimprimir último treino"}
  </button>
</div>

              <span className="text-xs">
                {treinoBanco ? (
                  <span className="text-green-700">Treino encontrado.</span>
                ) : (
                  <span className="text-gray-500">Selecione os filtros e busque.</span>
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
          </section>

          <section className="bg-white rounded-2xl shadow p-6 space-y-3">
            <h2 className="font-semibold">Exercícios carregados</h2>

            <div className="border rounded-xl">
              {exercicios.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nenhum exercício carregado.</p>
              ) : (
                exercicios.map((ex, i) => (
                  <div key={i} className="px-3 py-2 border-b last:border-b-0">
                    <p className="text-sm font-semibold">
                      {i + 1}. {ex.nome}
                    </p>
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
            disabled={exercicios.length === 0 || !alunoSelecionado || !personalSelecionado}
            className="no-print w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-2xl p-4 font-semibold"
          >
            Imprimir treino
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <div className="print-area bg-white p-3 mx-auto font-mono text-xs border border-gray-300">
            <div className="text-center mb-2">
              {logoAcademia ? (
                <img
                  src={logoAcademia}
                  alt="Logo da academia"
                  style={{ width: "130px", margin: "0 auto" }}
                />
              ) : (
                <img
                  src="/logo-sistema.png"
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