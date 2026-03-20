"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";
import { Activity, Printer, Search, User, Dumbbell } from "lucide-react";

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
  descanso?: string;
  obs?: string;
};

type TreinoPersonalizadoResumo = {
  id: number;
  titulo?: string | null;
  codigo_treino?: string | null;
  dia_semana?: string | null;
  objetivo?: string | null;
  observacoes?: string | null;
  ativo: boolean;
};

const diasSemana = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

const niveis = ["Iniciante", "Intermediário", "Avançado"];
const tipos = ["Masculino", "Feminino"];

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm md:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 md:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-semibold text-gray-600">{children}</label>;
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
  const [tituloTreino, setTituloTreino] = useState("TREINO PERSONALIZADO");
  const [objetivoTreino, setObjetivoTreino] = useState("");
  const [observacoesTreino, setObservacoesTreino] = useState("");
  const [codigoTreinoAtual, setCodigoTreinoAtual] = useState("");
  const [diaTreinoAtual, setDiaTreinoAtual] = useState("");

  const [treinosPersonalizados, setTreinosPersonalizados] = useState<
    TreinoPersonalizadoResumo[]
  >([]);
  const [treinoPersonalizadoSelecionado, setTreinoPersonalizadoSelecionado] =
    useState("");
  const [carregandoTreinosPersonalizados, setCarregandoTreinosPersonalizados] =
    useState(false);

  const [loadingPagina, setLoadingPagina] = useState(true);
  const [erroPagina, setErroPagina] = useState("");

  const dataAtual = useMemo(
    () =>
      new Date().toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    []
  );

  const alunoSelecionadoObj = useMemo(() => {
    return (
      alunos.find((a) => String(a.nome) === String(alunoSelecionado)) || null
    );
  }, [alunos, alunoSelecionado]);

  const carregarAcademia = async () => {
    try {
      const res = await apiFetch("/api/minha-academia", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Erro ao carregar academia:", json);
        return;
      }

      setLogoAcademia((json as any).logo_url || "");
      setNomeAcademia((json as any).nome || "");
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
        setErroPagina((json as any).error || "Erro ao carregar alunos");
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

  const limparContextoTreino = () => {
    setTreinoBanco(null);
    setMsgTreino("");
    setExercicios([]);
    setTituloTreino("TREINO PERSONALIZADO");
    setObjetivoTreino("");
    setObservacoesTreino("");
    setCodigoTreinoAtual("");
    setDiaTreinoAtual("");
  };

  const carregarTreinosPersonalizadosDoAluno = async (
    alunoId: number | string
  ) => {
    try {
      setCarregandoTreinosPersonalizados(true);

      const res = await apiFetch(
        `/api/treinos-personalizados?aluno_id=${alunoId}&ativo=true`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        console.error("Erro ao carregar treinos personalizados:", json);
        setTreinosPersonalizados([]);
        return;
      }

      const lista = Array.isArray(json) ? json : [];
      setTreinosPersonalizados(lista);
    } catch (error) {
      console.error("Erro ao carregar treinos personalizados:", error);
      setTreinosPersonalizados([]);
    } finally {
      setCarregandoTreinosPersonalizados(false);
    }
  };

  const carregarTreinoPersonalizado = async () => {
    if (!alunoSelecionadoObj?.id) {
      alert("Selecione um aluno válido.");
      return;
    }

    setCarregandoTreino(true);
    setMsgTreino("");
    setTreinoBanco(null);

    try {
      const params = new URLSearchParams({
        aluno_id: String(alunoSelecionadoObj.id),
      });

      const treinoEscolhido = treinosPersonalizados.find(
        (t) => String(t.id) === String(treinoPersonalizadoSelecionado)
      );

      if (treinoEscolhido?.codigo_treino) {
        params.set("codigo_treino", treinoEscolhido.codigo_treino);
      }

      if (treinoEscolhido?.dia_semana) {
        params.set("dia_semana", treinoEscolhido.dia_semana);
      }

      const res = await apiFetch(
        `/api/treinos-personalizados/ativo?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setMsgTreino((json as any)?.error || "Erro ao buscar treino personalizado.");
        setExercicios([]);
        return;
      }

      if (!json || !Array.isArray((json as any).itens) || (json as any).itens.length === 0) {
        setMsgTreino("Nenhum treino personalizado encontrado.");
        setExercicios([]);
        return;
      }

      setTreinoBanco(json);

      const itens = Array.isArray((json as any).itens) ? (json as any).itens : [];

      setTituloTreino((json as any).titulo || "TREINO PERSONALIZADO");
      setObjetivoTreino((json as any).objetivo || "");
      setObservacoesTreino((json as any).observacoes || "");
      setCodigoTreinoAtual((json as any).codigo_treino || "");
      setDiaTreinoAtual((json as any).dia_semana || "");

      setExercicios(
        itens.map((item: any) => ({
          nome: item.nome || item.nome_exercicio_snapshot || "",
          series: item.series || "",
          repeticoes: item.repeticoes || "",
          carga: item.carga || "",
          descanso: item.descanso || "",
          obs: item.obs || item.observacoes || "",
        }))
      );

      setMsgTreino("Treino personalizado carregado com sucesso.");
    } catch (error) {
      console.error("Erro ao buscar treino personalizado:", error);
      setMsgTreino("Erro ao buscar treino personalizado.");
      setExercicios([]);
    } finally {
      setCarregandoTreino(false);
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

  useEffect(() => {
    if (alunoSelecionadoObj?.id) {
      setTreinoPersonalizadoSelecionado("");
      setTreinosPersonalizados([]);
      limparContextoTreino();
      carregarTreinosPersonalizadosDoAluno(alunoSelecionadoObj.id);
    }
  }, [alunoSelecionadoObj?.id]);

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

      const res = await apiFetch(`/api/treinos?${qs.toString()}`, {
        cache: "no-store",
      });
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

      setTituloTreino(`TREINO ${diaSelecionado || ""}`.trim() || "TREINO PERSONALIZADO");
      setObjetivoTreino("");
      setObservacoesTreino("");
      setCodigoTreinoAtual("");
      setDiaTreinoAtual(diaSelecionado || "");

      setMsgTreino("Treino padrão carregado com sucesso.");
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
          aluno_id: alunoSelecionadoObj?.id || null,
          aluno_nome: alunoSelecionado,
          personal_nome: personalSelecionado,
          semana,
          dia: diaTreinoAtual || diaSelecionado,
          nivel,
          tipo,
          exercicios,
          user_id: userId,
          origem:
            codigoTreinoAtual || treinoPersonalizadoSelecionado
              ? "treino_personalizado"
              : "treino_padrao",
          codigo_treino: codigoTreinoAtual || null,
        }),
      });
    } catch (error) {
      console.error("Erro ao salvar histórico da impressão:", error);
    }

    window.print();
  };

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
        alert((json as any).error || "Nenhum treino anterior encontrado");
        return;
      }

      setAlunoSelecionado((json as any).aluno_nome || "");
      setPersonalSelecionado((json as any).personal_nome || "");
      setSemana((json as any).semana || "");
      setDiaSelecionado((json as any).dia || diasSemana[0]);
      setNivel((json as any).nivel || niveis[0]);
      setTipo((json as any).tipo || tipos[0]);
      setExercicios(
        Array.isArray((json as any).exercicios) ? (json as any).exercicios : []
      );
      setTreinoBanco({
        id: (json as any).id,
      });
      setTituloTreino(
        (json as any).codigo_treino
          ? `TREINO ${(json as any).codigo_treino}`
          : `TREINO ${(json as any).dia || ""}`.trim() || "TREINO PERSONALIZADO"
      );
      setCodigoTreinoAtual((json as any).codigo_treino || "");
      setDiaTreinoAtual((json as any).dia || "");
      setObjetivoTreino("");
      setObservacoesTreino("");
      setMsgTreino("Último treino carregado para reimpressão.");
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar último treino impresso");
    } finally {
      setCarregandoUltimo(false);
    }
  };

  if (loadingPagina) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando impressão..."
      />
    );
  }

  if (erroPagina && alunos.length === 0 && personals.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar impressão"
        mensagem={erroPagina || "Não foi possível carregar a página."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="mt-1 text-5xl font-black md:text-4x1">
              Imprimir Treinos
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Selecione aluno, personal e carregue o treino padrão ou personalizado.
            </p>
          </div>

          <div className="min-w-[240px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-white/60">Status do sistema</p>
            <p className="mt-1 text-xl font-black">TreinoPrint Online</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      {erroPagina ? <p className="text-sm text-red-600">{erroPagina}</p> : null}

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card
            title="Configurações da impressão"
            subtitle="Escolha o aluno, o personal e a origem do treino."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>Semana</Label>
                <input
                  value={semana}
                  onChange={(e) => setSemana(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-3"
                  placeholder="2026-03-02"
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Defina a semana do treino padrão a ser buscado
                </p>
              </div>

              <div className="md:col-span-2">
                <Label>Aluno</Label>

                <div className="relative mt-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={buscaAluno}
                    onChange={(e) => setBuscaAluno(e.target.value)}
                    placeholder="Buscar aluno..."
                    className="w-full rounded-xl border p-3 pl-10"
                  />
                </div>

                <div className="mt-2 max-h-52 overflow-auto rounded-xl border">
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
                        className={`flex w-full items-center gap-3 border-b px-3 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                          alunoSelecionado === a.nome ? "bg-blue-50 font-semibold" : ""
                        }`}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100">
                          <User size={15} className="text-zinc-600" />
                        </div>
                        <span className="text-sm">{a.nome}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>Personal</Label>
                <select
                  value={personalSelecionado}
                  onChange={(e) => setPersonalSelecionado(e.target.value)}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  <option value="">-- Selecione --</option>
                  {personals.map((p) => (
                    <option key={p.id} value={p.nome}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <Label>Treino personalizado do aluno</Label>

                <select
                  value={treinoPersonalizadoSelecionado}
                  onChange={(e) => {
                    limparContextoTreino();
                    setTreinoPersonalizadoSelecionado(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  <option value="">-- Nenhum selecionado --</option>
                  {treinosPersonalizados.map((treino) => (
                    <option key={treino.id} value={treino.id}>
                      {(treino.titulo || "Treino sem título") +
                        ` • Código: ${treino.codigo_treino || "-"} • Dia: ${treino.dia_semana || "-"}`}
                    </option>
                  ))}
                </select>

                <p className="mt-1 text-[11px] text-gray-500">
                  {carregandoTreinosPersonalizados
                    ? "Carregando treinos personalizados..."
                    : "Selecione um treino personalizado ativo do aluno, se houver."}
                </p>
              </div>

              <div>
                <Label>Dia</Label>
                <select
                  value={diaSelecionado}
                  onChange={(e) => {
                    setTreinoBanco(null);
                    setMsgTreino("");
                    setExercicios([]);
                    setCodigoTreinoAtual("");
                    setDiaTreinoAtual("");
                    setTituloTreino("TREINO PERSONALIZADO");
                    setDiaSelecionado(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  {diasSemana.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Nível</Label>
                <select
                  value={nivel}
                  onChange={(e) => {
                    setTreinoBanco(null);
                    setMsgTreino("");
                    setExercicios([]);
                    setCodigoTreinoAtual("");
                    setDiaTreinoAtual("");
                    setTituloTreino("TREINO PERSONALIZADO");
                    setNivel(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  {niveis.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Tipo</Label>
                <select
                  value={tipo}
                  onChange={(e) => {
                    setTreinoBanco(null);
                    setMsgTreino("");
                    setExercicios([]);
                    setCodigoTreinoAtual("");
                    setDiaTreinoAtual("");
                    setTituloTreino("TREINO PERSONALIZADO");
                    setTipo(e.target.value);
                  }}
                  className="mt-1 w-full rounded-xl border p-3"
                >
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={carregarModelo}
                  disabled={carregandoTreino}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {carregandoTreino ? "Carregando..." : "Carregar treino padrão"}
                </button>

                <button
                  type="button"
                  onClick={carregarTreinoPersonalizado}
                  disabled={
                    carregandoTreino ||
                    !treinoPersonalizadoSelecionado ||
                    !alunoSelecionadoObj?.id
                  }
                  className="rounded-xl bg-violet-600 px-4 py-3 text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {carregandoTreino ? "Carregando..." : "Carregar treino personalizado"}
                </button>

                <button
                  type="button"
                  onClick={reimprimirUltimoTreino}
                  disabled={carregandoUltimo}
                  className="rounded-xl bg-gray-800 px-4 py-3 text-white hover:bg-black disabled:opacity-60"
                >
                  {carregandoUltimo ? "Carregando..." : "Reimprimir último treino"}
                </button>
              </div>

              <div className="md:col-span-2">
                {msgTreino ? (
                  <span className={`text-xs ${treinoBanco ? "text-green-700" : "text-red-600"}`}>
                    {msgTreino}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">
                    Selecione os filtros e carregue um treino.
                  </span>
                )}
              </div>
            </div>
          </Card>

          <Card
            title="Exercícios carregados"
            subtitle="Confira os exercícios antes da impressão."
          >
            <div className="max-h-[420px] overflow-y-auto rounded-xl border">
              {exercicios.length === 0 ? (
                <p className="p-3 text-sm text-gray-500">Nenhum exercício carregado.</p>
              ) : (
                exercicios.map((ex, i) => (
                  <div key={i} className="border-b px-3 py-3 last:border-b-0">
                    <p className="text-sm font-semibold">
                      {i + 1}. {ex.nome}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga:{" "}
                      {ex.carga || "-"}
                    </p>
                    {ex.descanso ? (
                      <p className="text-xs text-gray-600">Descanso: {ex.descanso}</p>
                    ) : null}
                    {ex.obs ? (
                      <p className="text-xs italic text-gray-500">Obs: {ex.obs}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          <button
            onClick={imprimir}
            disabled={exercicios.length === 0 || !alunoSelecionado || !personalSelecionado}
            className="no-print inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 p-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            <Printer size={18} />
            Imprimir treino
          </button>
        </div>

        <Card
          title="Pré-visualização"
          subtitle="Visualização do cupom/treino antes da impressão."
        >
          <div className="overflow-x-auto">
            <div className="mx-auto min-w-[280px] max-w-[380px] border border-gray-300 bg-white p-3 font-mono text-xs">
              <div className="mb-2 text-center">
                {logoAcademia ? (
                  <img
                    src={logoAcademia}
                    alt="Logo da academia"
                    className="mx-auto w-[130px]"
                  />
                ) : (
                  <img
                    src="/logo-cupom.png"
                    alt="Logo padrão"
                    className="mx-auto w-[130px]"
                  />
                )}

                <p className="mt-2 text-sm font-bold">{nomeAcademia}</p>
                <p className="text-lg font-bold tracking-widest">
                  {tituloTreino || "TREINO PERSONALIZADO"}
                </p>
                <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
              </div>

              <div className="my-3 border-t border-dashed" />

              <div className="space-y-1 text-xs">
                <p>
                  <strong>Aluno:</strong> {alunoSelecionado || "_____________"}
                </p>
                <p>
                  <strong>Personal:</strong> {personalSelecionado || "_____________"}
                </p>
                <p>
                  <strong>Data:</strong> {dataAtual}
                </p>

                {codigoTreinoAtual ? (
                  <p>
                    <strong>Código:</strong> {codigoTreinoAtual}
                  </p>
                ) : null}

                <p>
                  <strong>Treino:</strong> {diaTreinoAtual || diaSelecionado}
                </p>

                {!codigoTreinoAtual ? (
                  <>
                    <p>
                      <strong>Nível:</strong> {nivel}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {tipo}
                    </p>
                  </>
                ) : null}

                {objetivoTreino ? (
                  <p>
                    <strong>Objetivo:</strong> {objetivoTreino}
                  </p>
                ) : null}
              </div>

              {observacoesTreino ? (
                <>
                  <div className="my-3 border-t border-dashed" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">Observações gerais</p>
                    <p>{observacoesTreino}</p>
                  </div>
                </>
              ) : null}

              <div className="my-3 border-t border-dashed" />

              {exercicios.map((ex, i) => (
                <div key={i} className="mb-4 text-xs">
                  <p className="text-sm font-bold">
                    {i + 1}. {ex.nome}
                  </p>
                  <p>
                    Séries: {ex.series || "-"} | Reps: {ex.repeticoes || "-"} | Carga:{" "}
                    {ex.carga || "-"}
                  </p>
                  {ex.descanso ? <p>Descanso: {ex.descanso}</p> : null}
                  {ex.obs ? <p className="text-[11px] italic">Obs: {ex.obs}</p> : null}
                  <div className="mt-2 border-t border-dashed" />
                </div>
              ))}

              <div className="mt-4 space-y-1 text-center text-xs">
                <p>Horário: {new Date().toLocaleTimeString("pt-BR")}</p>
                <p className="font-semibold tracking-wider">Bom treino 💪</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}