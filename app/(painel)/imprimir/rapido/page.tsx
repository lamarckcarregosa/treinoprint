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

export default function ImpressaoRapidaPage() {
  const [logoAcademia, setLogoAcademia] = useState("");
  const [nomeAcademia, setNomeAcademia] = useState("");
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const aluno = params.get("aluno") || "";
  const dia = params.get("dia") || "";
  const tipo = params.get("tipo") || "";
  const nivel = params.get("nivel") || "";

  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    return hoje.toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);
        setErro("");

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

        setExercicios(Array.isArray(primeiro.exercicios) ? primeiro.exercicios : []);

        setTimeout(() => {
          window.print();
        }, 700);
      } catch {
        setErro("Erro ao preparar impressão rápida");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [semanaAtual, dia, tipo, nivel]);

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
            <strong>Aluno:</strong> {aluno}
          </p>
          <p>
            <strong>Data:</strong> {new Date().toLocaleString("pt-BR")}
          </p>
          <p>
            <strong>Treino:</strong> {dia}
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
    </main>
  );
}