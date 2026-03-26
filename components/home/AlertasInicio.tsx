"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CircleAlert, Info, X } from "lucide-react";
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

function estiloNivel(nivel: Alerta["nivel"]) {
  if (nivel === "danger") {
    return {
      card: "border-red-200 bg-red-50",
      text: "text-red-700",
      icon: CircleAlert,
    };
  }

  if (nivel === "warning") {
    return {
      card: "border-yellow-200 bg-yellow-50",
      text: "text-yellow-700",
      icon: AlertTriangle,
    };
  }

  return {
    card: "border-blue-200 bg-blue-50",
    text: "text-blue-700",
    icon: Info,
  };
}

export default function AlertasInicio() {
  const router = useRouter();
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupFechado, setPopupFechado] = useState("");
  const carregouRef = useRef(false);

  useEffect(() => {
    if (carregouRef.current) return;
    carregouRef.current = true;

    const carregar = async () => {
      try {
        const tipo = localStorage.getItem("treinoprint_user_tipo") || "";
        const academiaId = localStorage.getItem("treinoprint_academia_id") || "";

        if (!academiaId) {
          setLoading(false);
          return;
        }

        const res = await apiFetch(`/api/alertas?tipo=${tipo}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => []);

        if (!res.ok) {
          setLoading(false);
          return;
        }

        setAlertas(Array.isArray(json) ? json : []);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const popupPrincipal = useMemo(() => {
    if (typeof window === "undefined") return null;

    const hoje = new Date().toISOString().slice(0, 10);

    return alertas.find((alerta) => {
      if (!alerta.mostrarPopup) return false;

      const chave = `treinoprint_alerta_visto_${alerta.id}_${hoje}`;
      const visto = localStorage.getItem(chave);

      return !visto && popupFechado !== alerta.id;
    });
  }, [alertas, popupFechado]);

  const fecharPopup = (id: string) => {
    const hoje = new Date().toISOString().slice(0, 10);
    const chave = `treinoprint_alerta_visto_${id}_${hoje}`;
    localStorage.setItem(chave, "1");
    setPopupFechado(id);
  };

  if (loading || alertas.length === 0) return null;

  return (
    <>
      <section className="rounded-[28px] bg-white border border-black/5 shadow-sm p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Alertas do dia</h2>
            <p className="text-sm text-gray-500 mt-1">
              Avisos importantes para sua operação.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            <Bell size={14} />
            {alertas.length} alerta(s)
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-6">
          {alertas.map((alerta) => {
            const estilo = estiloNivel(alerta.nivel);
            const Icon = estilo.icon;

            return (
              <button
                key={alerta.id}
                onClick={() => alerta.href && router.push(alerta.href)}
                className={`w-full text-left rounded-2xl border p-4 transition hover:shadow-sm ${estilo.card}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${estilo.text}`}>
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className={`font-bold ${estilo.text}`}>{alerta.titulo}</p>
                    <p className="text-sm text-gray-700 mt-1">{alerta.descricao}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {popupPrincipal ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-xl border border-black/5 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-500">Alerta importante</p>
                <h3 className="text-xl font-black text-gray-900 mt-1">
                  {popupPrincipal.titulo}
                </h3>
              </div>

              <button
                onClick={() => fecharPopup(popupPrincipal.id)}
                className="rounded-xl border px-2 py-2"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              {popupPrincipal.descricao}
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  fecharPopup(popupPrincipal.id);
                  if (popupPrincipal.href) router.push(popupPrincipal.href);
                }}
                className="flex-1 rounded-xl bg-black text-white py-3"
              >
                Ver detalhes
              </button>

              <button
                onClick={() => fecharPopup(popupPrincipal.id)}
                className="flex-1 rounded-xl border py-3"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}