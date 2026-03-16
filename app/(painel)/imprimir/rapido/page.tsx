"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  descanso?: string;
  obs?: string;
};

export default function ImpressaoRapidaPage() {
  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [tituloTreino, setTituloTreino] = useState("TREINO PERSONALIZADO");
  const [personalNome, setPersonalNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoesGerais, setObservacoesGerais] = useState("");
  const [codigoTreinoAtual, setCodigoTreinoAtual] = useState("");
  const [diaSemanaAtual, setDiaSemanaAtual] = useState("");
  const [historicoSalvo, setHistoricoSalvo] = useState(false);
  const inicializadoRef = useRef(false);
const imprimindoRef = useRef(false);

  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const alunoId = params.get("aluno_id") || "";
  const aluno = params.get("aluno") || "";
  const treinoId = params.get("treino_id") || "";
  const dia = params.get("dia") || "";
  const tipo = params.get("tipo") || "";
  const nivel = params.get("nivel") || "";
  const codigoTreino = params.get("codigo_treino") || "";
  const diaSemana = params.get("dia_semana") || "";
  const personalParam = params.get("personal_nome") || "";
  const autoPrint = params.get("auto_print") === "1";

  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  }, []);

  const salvarHistoricoAntesDeImprimir = async (dados: {
    exercicios: Exercicio[];
    personalNome?: string;
    codigoTreinoAtual?: string;
    diaSemanaAtual?: string;
  }) => {
    try {
      if (historicoSalvo) return;
      if (!aluno || !Array.isArray(dados.exercicios) || dados.exercicios.length === 0) {
        return;
      }

      const origemHistorico = dados.codigoTreinoAtual
        ? "treino_personalizado"
        : "padrao";

      await apiFetch("/api/historico-impressoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aluno_id: alunoId ? Number(alunoId) : null,
          aluno_nome: aluno,
          personal_nome: dados.personalNome || null,
          semana: null,
          dia: dados.diaSemanaAtual || dia || null,
          nivel: nivel || null,
          tipo: tipo || null,
          exercicios: dados.exercicios,
          origem: origemHistorico,
          codigo_treino: dados.codigoTreinoAtual || null,
        }),
      });

      setHistoricoSalvo(true);
    } catch (error) {
      console.error("Erro ao salvar histórico da impressão rápida:", error);
    }
  };

 const dispararPrint = async (dados: {
  exercicios: Exercicio[];
  personalNome?: string;
  codigoTreinoAtual?: string;
  diaSemanaAtual?: string;
}) => {
  if (!autoPrint) return;
  if (imprimindoRef.current) return;

  imprimindoRef.current = true;

  await salvarHistoricoAntesDeImprimir(dados);

  setTimeout(() => {
    window.print();
  }, 700);
};

  useEffect(() => {
  const carregar = async () => {
  try {
    if (inicializadoRef.current) return;
    inicializadoRef.current = true;

    setLoading(true);
    setErro("");
    setHistoricoSalvo(false);

        if (personalParam) {
          setPersonalNome(personalParam);
        }

        const resAcademia = await apiFetch("/api/minha-academia", {
          cache: "no-store",
        });

        const jsonAcademia = await resAcademia.json().catch(() => ({}));

        if (!resAcademia.ok) {
          setErro((jsonAcademia as any).error || "Erro ao carregar academia");
          return;
        }

        setLogoAcademia((jsonAcademia as any).logo_url || "");
        setNomeAcademia((jsonAcademia as any).nome || "");

        // 1) prioridade total: treino padrão selecionado por treino_id
        if (treinoId) {
          const resTreinos = await apiFetch("/api/treinos", {
            cache: "no-store",
          });

          const jsonTreinos = await resTreinos.json().catch(() => []);

          if (!resTreinos.ok) {
            setErro((jsonTreinos as any).error || "Erro ao carregar treino padrão");
            return;
          }

          const treinoSelecionado = Array.isArray(jsonTreinos)
            ? jsonTreinos.find((item: any) => String(item.id) === String(treinoId))
            : null;

          if (treinoSelecionado) {
            const exerciciosCarregados = Array.isArray(treinoSelecionado.exercicios)
              ? treinoSelecionado.exercicios
              : [];

            setTituloTreino(
              `TREINO ${treinoSelecionado.dia || dia || ""}`.trim() ||
                "TREINO PERSONALIZADO"
            );
            setPersonalNome(personalParam || "");
            setObjetivo("");
            setObservacoesGerais("");
            setCodigoTreinoAtual("");
            setDiaSemanaAtual(treinoSelecionado.dia || dia || "");
            setExercicios(exerciciosCarregados);

            await dispararPrint({
              exercicios: exerciciosCarregados,
              personalNome: personalParam || "",
              codigoTreinoAtual: "",
              diaSemanaAtual: treinoSelecionado.dia || dia || "",
            });

            return;
          }
        }

        // 2) tenta treino personalizado específico
        if (alunoId && (codigoTreino || diaSemana)) {
          const qp = new URLSearchParams({
            aluno_id: alunoId,
          });

          if (codigoTreino) qp.set("codigo_treino", codigoTreino);
          if (diaSemana) qp.set("dia_semana", diaSemana);

          const resPersonalizado = await apiFetch(
            `/api/treinos-personalizados/ativo?${qp.toString()}`,
            { cache: "no-store" }
          );

          const jsonPersonalizado = await resPersonalizado.json().catch(() => null);

          if (
            resPersonalizado.ok &&
            jsonPersonalizado &&
            Array.isArray(jsonPersonalizado.itens) &&
            jsonPersonalizado.itens.length > 0
          ) {
            const personalFinal = personalParam || jsonPersonalizado.personal_nome || "";
            const codigoFinal = jsonPersonalizado.codigo_treino || "";
            const diaFinal = jsonPersonalizado.dia_semana || "";
            const exerciciosCarregados = (jsonPersonalizado.itens || []).map((item: any) => ({
              nome: item.nome,
              series: item.series || "",
              repeticoes: item.repeticoes || "",
              carga: item.carga || "",
              descanso: item.descanso || "",
              obs: item.obs || "",
            }));

            setTituloTreino(jsonPersonalizado.titulo || "TREINO PERSONALIZADO");
            setPersonalNome(personalFinal);
            setObjetivo(jsonPersonalizado.objetivo || "");
            setObservacoesGerais(jsonPersonalizado.observacoes || "");
            setCodigoTreinoAtual(codigoFinal);
            setDiaSemanaAtual(diaFinal);
            setExercicios(exerciciosCarregados);

            await dispararPrint({
              exercicios: exerciciosCarregados,
              personalNome: personalFinal,
              codigoTreinoAtual: codigoFinal,
              diaSemanaAtual: diaFinal,
            });

            return;
          }
        }

        // 3) só tenta qualquer personalizado se NÃO veio treino_id
        if (alunoId && !treinoId) {
          const resPersonalizado = await apiFetch(
            `/api/treinos-personalizados/ativo?aluno_id=${alunoId}`,
            { cache: "no-store" }
          );

          const jsonPersonalizado = await resPersonalizado.json().catch(() => null);

          if (
            resPersonalizado.ok &&
            jsonPersonalizado &&
            Array.isArray(jsonPersonalizado.itens) &&
            jsonPersonalizado.itens.length > 0
          ) {
            const personalFinal = personalParam || jsonPersonalizado.personal_nome || "";
            const codigoFinal = jsonPersonalizado.codigo_treino || "";
            const diaFinal = jsonPersonalizado.dia_semana || "";
            const exerciciosCarregados = (jsonPersonalizado.itens || []).map((item: any) => ({
              nome: item.nome,
              series: item.series || "",
              repeticoes: item.repeticoes || "",
              carga: item.carga || "",
              descanso: item.descanso || "",
              obs: item.obs || "",
            }));

            setTituloTreino(jsonPersonalizado.titulo || "TREINO PERSONALIZADO");
            setPersonalNome(personalFinal);
            setObjetivo(jsonPersonalizado.objetivo || "");
            setObservacoesGerais(jsonPersonalizado.observacoes || "");
            setCodigoTreinoAtual(codigoFinal);
            setDiaSemanaAtual(diaFinal);
            setExercicios(exerciciosCarregados);

            await dispararPrint({
              exercicios: exerciciosCarregados,
              personalNome: personalFinal,
              codigoTreinoAtual: codigoFinal,
              diaSemanaAtual: diaFinal,
            });

            return;
          }
        }

        // 4) fallback final treino padrão antigo
        const qsSemana = new URLSearchParams({
          semana: semanaAtual,
          dia,
          nivel,
          tipo,
        });

        const resTreinoSemana = await apiFetch(`/api/treinos?${qsSemana.toString()}`, {
          cache: "no-store",
        });

        let jsonTreino = await resTreinoSemana.json().catch(() => []);

        if (!Array.isArray(jsonTreino) || jsonTreino.length === 0) {
          const qsFallback = new URLSearchParams({
            dia,
            nivel,
            tipo,
          });

          const resTreinoFallback = await apiFetch(
            `/api/treinos?${qsFallback.toString()}`,
            {
              cache: "no-store",
            }
          );

          jsonTreino = await resTreinoFallback.json().catch(() => []);
        }

        const primeiro = Array.isArray(jsonTreino) ? jsonTreino[0] : null;

        if (!primeiro) {
          setErro("Nenhum treino encontrado para essa combinação");
          return;
        }

        const exerciciosCarregados = Array.isArray(primeiro.exercicios)
          ? primeiro.exercicios
          : [];

        setTituloTreino(`TREINO ${dia || ""}`.trim() || "TREINO PERSONALIZADO");
        setPersonalNome(personalParam || "");
        setObjetivo("");
        setObservacoesGerais("");
        setCodigoTreinoAtual("");
        setDiaSemanaAtual(dia || "");
        setExercicios(exerciciosCarregados);

        await dispararPrint({
          exercicios: exerciciosCarregados,
          personalNome: personalParam || "",
          codigoTreinoAtual: "",
          diaSemanaAtual: dia || "",
        });
      } catch {
        setErro("Erro ao preparar impressão rápida");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [
    semanaAtual,
    dia,
    tipo,
    nivel,
    alunoId,
    treinoId,
    codigoTreino,
    diaSemana,
    personalParam,
    autoPrint,
  ]);

  if (loading) {
    return <p className="p-6">Preparando impressão...</p>;
  }

  if (erro) {
    return <p className="p-6 text-red-600">{erro}</p>;
  }

  return (
    <main className="bg-white min-h-screen p-6">
      <div className="print-area bg-white p-3 mx-auto font-mono text-xs border border-gray-300 max-w-sm">
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
          <p className="text-lg font-bold tracking-widest">{tituloTreino}</p>
          <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
        </div>

        <div className="border-t border-dashed my-3" />

        <div className="text-xs space-y-1">
          <p>
            <strong>Aluno:</strong> {aluno || "_____________"}
          </p>

          {personalNome ? (
            <p>
              <strong>Personal:</strong> {personalNome}
            </p>
          ) : null}

          <p>
            <strong>Data:</strong> {new Date().toLocaleString("pt-BR")}
          </p>

          {codigoTreinoAtual ? (
            <p>
              <strong>Código:</strong> {codigoTreinoAtual}
            </p>
          ) : null}

          {diaSemanaAtual ? (
            <p>
              <strong>Dia:</strong> {diaSemanaAtual}
            </p>
          ) : dia ? (
            <p>
              <strong>Treino:</strong> {dia}
            </p>
          ) : null}

          {nivel ? (
            <p>
              <strong>Nível:</strong> {nivel}
            </p>
          ) : null}

          {tipo ? (
            <p>
              <strong>Tipo:</strong> {tipo}
            </p>
          ) : null}

          {objetivo ? (
            <p>
              <strong>Objetivo:</strong> {objetivo}
            </p>
          ) : null}
        </div>

        {observacoesGerais ? (
          <>
            <div className="border-t border-dashed my-3" />
            <div className="text-xs">
              <p className="font-bold">Observações gerais</p>
              <p>{observacoesGerais}</p>
            </div>
          </>
        ) : null}

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
            {ex.descanso ? <p>Descanso: {ex.descanso}</p> : null}
            {ex.obs ? <p className="italic text-[11px]">Obs: {ex.obs}</p> : null}
            <div className="border-t border-dashed mt-2" />
          </div>
        ))}

        <div className="text-center text-xs mt-4 space-y-1">
          <p>Horário: {new Date().toLocaleTimeString("pt-BR")}</p>
          <p className="font-semibold tracking-wider">Bom treino 💪</p>
        </div>
      </div>
    </main>
  );
}