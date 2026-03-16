"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

type Exercicio = {
  nome: string;
  series?: string;
  repeticoes?: string;
  carga?: string;
  obs?: string;
};

type Aluno = {
  id: number;
  nome: string;
};

type Treino = {
  id: number;
  semana?: string;
  dia?: string;
  nivel?: string;
  tipo?: string;
  exercicios?: Exercicio[];
};

export default function ImpressaoRapidaPage() {
  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");

  const [nomeAluno, setNomeAluno] = useState("");
  const [nomePersonal, setNomePersonal] = useState("");

  const [diaTreino, setDiaTreino] = useState("");
  const [nivelTreino, setNivelTreino] = useState("");
  const [tipoTreino, setTipoTreino] = useState("");

  const [exercicios, setExercicios] = useState<Exercicio[]>([]);

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const jaProcessouRef = useRef(false);

  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const alunoId = params.get("aluno_id") || "";
  const treinoId = params.get("treino_id") || "";
  const origem = params.get("origem") || "";
  const autoPrint = params.get("auto_print") || "";
  const personalNomeParam = params.get("personal_nome") || "";

  const registrarHistorico = async (
    alunoNome: string,
    personalNome: string,
    treinoObj: Treino
  ) => {
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
          aluno_nome: alunoNome,
          personal_nome: personalNome || null,
          semana: treinoObj.semana || null,
          dia: treinoObj.dia || null,
          nivel: treinoObj.nivel || null,
          tipo: treinoObj.tipo || null,
          exercicios: treinoObj.exercicios || [],
          user_id: userId || null,
        }),
      });
    } catch (error) {
      console.error("Erro ao registrar histórico:", error);
    }
  };

  useEffect(() => {
    if (jaProcessouRef.current) return;
    jaProcessouRef.current = true;

    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

        if (!alunoId) {
          setErro("Aluno não informado.");
          return;
        }

        if (!treinoId) {
          setErro("Treino não informado.");
          return;
        }

        const [resAcademia, resAluno, resTreino] = await Promise.all([
          apiFetch("/api/minha-academia", { cache: "no-store" }),
          apiFetch(`/api/alunos/${alunoId}`, { cache: "no-store" }),
          apiFetch(`/api/treinos/${treinoId}`, { cache: "no-store" }),
        ]);

        const jsonAcademia = await resAcademia.json().catch(() => ({}));
        const jsonAluno = await resAluno.json().catch(() => ({}));
        const jsonTreino = await resTreino.json().catch(() => ({}));

        if (!resAcademia.ok) {
          setErro((jsonAcademia as any).error || "Erro ao carregar academia");
          return;
        }

        if (!resAluno.ok) {
          setErro((jsonAluno as any).error || "Erro ao carregar aluno");
          return;
        }

        if (!resTreino.ok) {
          setErro((jsonTreino as any).error || "Erro ao carregar treino");
          return;
        }

        const alunoObj = jsonAluno as Aluno;
        const treinoObj = jsonTreino as Treino;

        setLogoAcademia((jsonAcademia as any).logo_url || "");
        setNomeAcademia((jsonAcademia as any).nome || "");

        setNomeAluno(alunoObj?.nome || "");

        const personalFinal =
          personalNomeParam ||
          (typeof window !== "undefined"
            ? localStorage.getItem("treinoprint_nome") || ""
            : "");

        setNomePersonal(personalFinal || "-");

        setDiaTreino(treinoObj?.dia || "");
        setNivelTreino(treinoObj?.nivel || "");
        setTipoTreino(treinoObj?.tipo || "");

        setExercicios(
          Array.isArray(treinoObj?.exercicios) ? treinoObj.exercicios : []
        );

        await registrarHistorico(
          alunoObj?.nome || "",
          personalFinal || "",
          treinoObj
        );

        if (autoPrint === "1" || origem === "catraca") {
          setTimeout(() => {
            window.print();
          }, 700);
        }
      } catch (error) {
        console.error(error);
        setErro("Erro ao preparar impressão.");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [alunoId, treinoId, origem, autoPrint, personalNomeParam]);

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
          <p className="text-lg font-bold tracking-widest">
            TREINO PERSONALIZADO
          </p>
          <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
        </div>

        <div className="border-t border-dashed my-3" />

        <div className="text-xs space-y-1">
          <p><strong>Aluno:</strong> {nomeAluno}</p>
          <p><strong>Personal:</strong> {nomePersonal}</p>
          <p><strong>Data:</strong> {new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Treino:</strong> {diaTreino}</p>
          <p><strong>Nível:</strong> {nivelTreino}</p>
          <p><strong>Tipo:</strong> {tipoTreino}</p>
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

            {ex.obs ? (
              <p className="italic text-[11px]">Obs: {ex.obs}</p>
            ) : null}

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