"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CircleAlert, AlertTriangle, Info, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";

type Alerta = {
  id: string;
  titulo: string;
  descricao: string;
  nivel: "danger" | "warning" | "info";
  modulo: "financeiro" | "treinos" | "alunos" | "sistema";
  href?: string;
  mostrarPopup?: boolean;
  total?: number;
};

function getIcon(nivel: Alerta["nivel"]) {
  if (nivel === "danger") return CircleAlert;
  if (nivel === "warning") return AlertTriangle;
  return Info;
}

function getNivelClass(nivel: Alerta["nivel"]) {
  if (nivel === "danger") return "text-red-700 bg-red-50 border-red-200";
  if (nivel === "warning") return "text-yellow-700 bg-yellow-50 border-yellow-200";
  return "text-blue-700 bg-blue-50 border-blue-200";
}

export default function BellAlertas() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const carregouRef = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (carregouRef.current) return;
    carregouRef.current = true;

    const carregar = async () => {
      try {
        const tipo = localStorage.getItem("treinoprint_user_tipo") || "";
        const academiaId = localStorage.getItem("treinoprint_academia_id") || "";

        if (!academiaId) return;

        const res = await apiFetch(`/api/alertas?tipo=${tipo}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);
        if (!res.ok) return;

        setAlertas(Array.isArray(json) ? json : []);
      } catch {}
    };

    carregar();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setAberto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setAberto((v) => !v)}
        className="relative w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition"
        title="Notificações"
      >
        <Bell size={18} className="text-white" />
        {alertas.length > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {alertas.length}
          </span>
        ) : null}
      </button>

      {aberto ? (
        <div className="absolute right-0 top-[56px] w-[380px] max-w-[92vw] rounded-3xl border border-black/5 bg-white shadow-2xl p-4 z-[80]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Notificações</h3>
              <p className="text-xs text-gray-500 mt-1">
                {alertas.length} alerta(s) ativo(s)
              </p>
            </div>

            <button
              onClick={() => setAberto(false)}
              className="w-9 h-9 rounded-xl border hover:bg-zinc-50 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-4 max-h-[420px] overflow-y-auto pr-1 space-y-3">
            {alertas.length === 0 ? (
              <div className="rounded-2xl border border-dashed p-4 text-sm text-gray-500">
                Nenhuma notificação no momento.
              </div>
            ) : (
              alertas.map((alerta) => {
                const Icon = getIcon(alerta.nivel);

                return (
                  <button
                    key={alerta.id}
                    onClick={() => {
                      setAberto(false);
                      if (alerta.href) router.push(alerta.href);
                    }}
                    className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-sm ${getNivelClass(
                      alerta.nivel
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold">{alerta.titulo}</p>
                        <p className="text-sm mt-1 opacity-90">
                          {alerta.descricao}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}