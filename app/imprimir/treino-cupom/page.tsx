"use client";

import { useEffect, useMemo, useState } from "react";
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
  tipo?: string;
  nivel?: string;
  exercicios?: Exercicio[];
};

const ROTA_HISTORICO_ATUAL = "/api/historico-impressoes";

export default function ImpressaoRapidaPage() {
  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");
  const [nomeAluno, setNomeAluno] = useState("");
  const [nomePersonal, setNomePersonal] = useState("");
  const [diaTreino, setDiaTreino] = useState("");
  const [tipoTreino, setTipoTreino] = useState("");
  const [nivelTreino, setNivelTreino] = useState("");
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [historicoSalvo, setHistoricoSalvo] = useState(false);

  const params = useMemo(() => {
    if (typeof window === "undefined") return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  }, []);

  const aluno = params.get("aluno") || "";
  const dia = params.get("dia") || "";
  const tipo = params.get("tipo") || "";
  const nivel = params.get("nivel") || "";

  const alunoId = params.get("aluno_id") || "";
  const treinoId = params.get("treino_id") || "";
  const autoPrint = params.get("auto_print") || "";
  const origem = params.get("origem") || "";

  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  }, []);

  const registrarHistorico = async (
    alunoNome: string,
    personalNome: string,
    treino: Treino
  ) => {
    try {
      const res = await apiFetch(ROTA_HISTORICO_ATUAL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          aluno_nome: alunoNome,
          personal_nome: personalNome,
          semana: treino.semana || null,
          dia: treino.dia || null,
          nivel: treino.nivel || null,
          tipo: treino.tipo || null,
          exercicios: treino.exercicios || [],
        }),
      });

      if (res.ok) {
        setHistoricoSalvo(true);
      }
    } catch {}
  };

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");
        setHistoricoSalvo(false);

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

        const personalLogado =
          typeof window !== "undefined"
            ? localStorage.getItem("treinoprint_nome") || "Personal"
            : "Personal";

        setNomePersonal(personalLogado);

        // FLUXO DA CATRACA
        if (alunoId && treinoId) {
          const [resAluno, resTreinos] = await Promise.all([
            apiFetch(`/api/alunos/${alunoId}`, {
              cache: "no-store",
            }),
            apiFetch(`/api/treinos`, {
              cache: "no-store",
            }),
          ]);

          const jsonAluno = await resAluno.json().catch(() => ({}));
          const jsonTreinos = await resTreinos.json().catch(() => []);

          if (!resAluno.ok) {
            setErro((jsonAluno as any).error || "Erro ao carregar aluno");
            return;
          }

          if (!resTreinos.ok) {
            setErro((jsonTreinos as any).error || "Erro ao carregar treino");
            return;
          }

          const treinoEncontrado = Array.isArray(jsonTreinos)
            ? jsonTreinos.find((item: any) => String(item.id) === String(treinoId))
            : null;

          if (!treinoEncontrado) {
            setErro("Treino não encontrado");
            return;
          }

          const alunoObj = jsonAluno as Aluno;
          const treinoObj = treinoEncontrado as Treino;

          setNomeAluno(alunoObj.nome || "");
          setDiaTreino(treinoObj.dia || "");
          setTipoTreino(treinoObj.tipo || "");
          setNivelTreino(treinoObj.nivel || "");
          setExercicios(Array.isArray(treinoObj.exercicios) ? treinoObj.exercicios : []);

          await registrarHistorico(alunoObj.nome || "", personalLogado, treinoObj);

          if (autoPrint === "1" || origem === "catraca") {
            setTimeout(() => {
              try {
                window.focus();
                window.print();
              } catch {}

              setTimeout(() => {
                try {
                  window.close();
                } catch {}
              }, 1200);
            }, 600);
          }

          return;
        }

        // FLUXO ANTIGO NORMAL
        setNomeAluno(aluno);

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

          const resTreinoFallback = await apiFetch(`/api/treinos?${qsFallback.toString()}`, {
            cache: "no-store",
          });

          jsonTreino = await resTreinoFallback.json().catch(() => []);
        }

        const primeiro = Array.isArray(jsonTreino) ? jsonTreino[0] : null;

        if (!primeiro) {
          setErro("Nenhum treino encontrado para essa combinação");
          return;
        }

        setDiaTreino(primeiro.dia || dia);
        setTipoTreino(primeiro.tipo || tipo);
        setNivelTreino(primeiro.nivel || nivel);
        setExercicios(Array.isArray(primeiro.exercicios) ? primeiro.exercicios : []);

        setTimeout(() => {
          try {
            window.focus();
            window.print();
          } catch {}

          setTimeout(() => {
            try {
              window.close();
            } catch {}
          }, 1200);
        }, 600);
      } catch {
        setErro("Erro ao preparar impressão rápida");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [semanaAtual, dia, tipo, nivel, aluno, alunoId, treinoId, autoPrint, origem]);

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
          <p className="text-lg font-bold tracking-widest">TREINO PERSONALIZADO</p>
          <p className="text-[10px] text-gray-500">Sistema TreinoPrint</p>
        </div>

        <div className="border-t border-dashed my-3" />

        <div className="text-xs space-y-1">
          <p>
            <strong>Aluno:</strong> {nomeAluno}
          </p>
          <p>
            <strong>Personal:</strong> {nomePersonal || "-"}
          </p>
          <p>
            <strong>Data:</strong> {new Date().toLocaleString("pt-BR")}
          </p>
          <p>
            <strong>Treino:</strong> {diaTreino}
          </p>
          <p>
            <strong>Nível:</strong> {nivelTreino}
          </p>
          <p>
            <strong>Tipo:</strong> {tipoTreino}
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
          {historicoSalvo ? (
            <p className="text-[10px] text-gray-500">Histórico registrado</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}