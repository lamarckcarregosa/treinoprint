"use client";

import { useState } from "react";

type Medidas = {
  peito?: number;
  costas?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  gluteo?: number;
  braco_esquerdo?: number;
  braco_direito?: number;
  coxa_esquerda?: number;
  coxa_direita?: number;
  panturrilha_esquerda?: number;
  panturrilha_direita?: number;
};

type Vista = "frente" | "costas";

export default function MapaCorporal({ medidas }: { medidas: Medidas }) {
  const [hover, setHover] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>("frente");

  function cor(area: string) {
    return hover === area ? "#7CFC00" : "#D6DAE1";
  }

  function classeCard(area: string) {
    return hover === area
      ? "border-lime-400 bg-lime-50"
      : "border-black/5 bg-white";
  }

  function Card({
    label,
    value,
    area,
  }: {
    label: string;
    value?: number;
    area: string;
  }) {
    return (
      <div
        onMouseEnter={() => setHover(area)}
        onMouseLeave={() => setHover(null)}
        className={`rounded-2xl border p-3 transition ${classeCard(area)}`}
      >
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-black text-gray-900">{value || 0}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setVista("frente");
            setHover(null);
          }}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            vista === "frente"
              ? "bg-black text-white"
              : "bg-white border border-black/10 text-gray-700"
          }`}
        >
          Frente
        </button>

        <button
          type="button"
          onClick={() => {
            setVista("costas");
            setHover(null);
          }}
          className={`px-4 py-2 rounded-xl font-semibold transition ${
            vista === "costas"
              ? "bg-black text-white"
              : "bg-white border border-black/10 text-gray-700"
          }`}
        >
          Costas
        </button>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-8 items-center">
        <div className="flex justify-center">
          {vista === "frente" ? (
            <svg
              width="260"
              height="560"
              viewBox="0 0 260 560"
              className="max-w-full"
            >
              <circle cx="130" cy="46" r="28" fill="#C9CED6" />
              <rect x="118" y="74" width="24" height="18" rx="8" fill="#C9CED6" />

              <path
                d="M95 100 Q130 84 165 100 L176 140 Q130 158 84 140 Z"
                fill={cor("peito")}
                onMouseEnter={() => setHover("peito")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M104 143 Q130 136 156 143 L156 194 Q130 206 104 194 Z"
                fill={cor("abdomen")}
                onMouseEnter={() => setHover("abdomen")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <rect
                x="98"
                y="186"
                width="64"
                height="24"
                rx="12"
                fill={cor("cintura")}
                onMouseEnter={() => setHover("cintura")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M92 214 Q130 206 168 214 Q172 244 156 262 L104 262 Q88 244 92 214 Z"
                fill={cor("quadril")}
                onMouseEnter={() => setHover("quadril")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M64 106 Q76 98 88 108 L90 238 Q78 246 64 238 Z"
                fill={cor("bracoE")}
                onMouseEnter={() => setHover("bracoE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M172 108 Q184 98 196 106 L196 238 Q182 246 170 238 Z"
                fill={cor("bracoD")}
                onMouseEnter={() => setHover("bracoD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M104 262 L124 262 L120 408 Q112 420 102 414 Z"
                fill={cor("coxaE")}
                onMouseEnter={() => setHover("coxaE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M136 262 L156 262 L158 414 Q148 420 140 408 Z"
                fill={cor("coxaD")}
                onMouseEnter={() => setHover("coxaD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M103 414 L118 414 L117 515 Q109 522 103 516 Z"
                fill={cor("panturrilhaE")}
                onMouseEnter={() => setHover("panturrilhaE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M142 414 L157 414 L157 516 Q151 522 143 515 Z"
                fill={cor("panturrilhaD")}
                onMouseEnter={() => setHover("panturrilhaD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <line x1="130" y1="102" x2="130" y2="206" stroke="#EEF1F4" strokeWidth="2" />
              <line x1="130" y1="262" x2="130" y2="515" stroke="#EEF1F4" strokeWidth="2" />
              <line x1="104" y1="170" x2="156" y2="170" stroke="#EEF1F4" strokeWidth="2" />
            </svg>
          ) : (
            <svg
              width="260"
              height="560"
              viewBox="0 0 260 560"
              className="max-w-full"
            >
              <circle cx="130" cy="46" r="28" fill="#C9CED6" />
              <rect x="118" y="74" width="24" height="18" rx="8" fill="#C9CED6" />

              <path
                d="M94 100 Q130 82 166 100 L174 160 Q130 178 86 160 Z"
                fill={cor("costas")}
                onMouseEnter={() => setHover("costas")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M103 162 Q130 154 157 162 L157 210 Q130 220 103 210 Z"
                fill={cor("lombar")}
                onMouseEnter={() => setHover("lombar")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <rect
                x="98"
                y="197"
                width="64"
                height="24"
                rx="12"
                fill={cor("cintura")}
                onMouseEnter={() => setHover("cintura")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M92 226 Q130 216 168 226 Q172 250 156 270 L104 270 Q88 250 92 226 Z"
                fill={cor("gluteo")}
                onMouseEnter={() => setHover("gluteo")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M64 106 Q76 98 88 108 L90 238 Q78 246 64 238 Z"
                fill={cor("bracoE")}
                onMouseEnter={() => setHover("bracoE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M172 108 Q184 98 196 106 L196 238 Q182 246 170 238 Z"
                fill={cor("bracoD")}
                onMouseEnter={() => setHover("bracoD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M104 270 L124 270 L120 412 Q112 424 102 418 Z"
                fill={cor("coxaE")}
                onMouseEnter={() => setHover("coxaE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M136 270 L156 270 L158 418 Q148 424 140 412 Z"
                fill={cor("coxaD")}
                onMouseEnter={() => setHover("coxaD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M103 418 L118 418 L117 518 Q109 525 103 519 Z"
                fill={cor("panturrilhaE")}
                onMouseEnter={() => setHover("panturrilhaE")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <path
                d="M142 418 L157 418 L157 519 Q151 525 143 518 Z"
                fill={cor("panturrilhaD")}
                onMouseEnter={() => setHover("panturrilhaD")}
                onMouseLeave={() => setHover(null)}
                className="cursor-pointer"
              />

              <line x1="130" y1="102" x2="130" y2="220" stroke="#EEF1F4" strokeWidth="2" />
              <line x1="130" y1="270" x2="130" y2="518" stroke="#EEF1F4" strokeWidth="2" />
            </svg>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {vista === "frente" ? (
            <>
              <Card label="Peito" value={medidas.peito} area="peito" />
              <Card label="Cintura" value={medidas.cintura} area="cintura" />
              <Card label="Abdômen" value={medidas.abdomen} area="abdomen" />
              <Card label="Quadril" value={medidas.quadril} area="quadril" />
              <Card label="Braço esquerdo" value={medidas.braco_esquerdo} area="bracoE" />
              <Card label="Braço direito" value={medidas.braco_direito} area="bracoD" />
              <Card label="Coxa esquerda" value={medidas.coxa_esquerda} area="coxaE" />
              <Card label="Coxa direita" value={medidas.coxa_direita} area="coxaD" />
              <Card
                label="Panturrilha esquerda"
                value={medidas.panturrilha_esquerda}
                area="panturrilhaE"
              />
              <Card
                label="Panturrilha direita"
                value={medidas.panturrilha_direita}
                area="panturrilhaD"
              />
            </>
          ) : (
            <>
              <Card label="Costas" value={medidas.costas} area="costas" />
              <Card label="Lombar" value={medidas.cintura} area="lombar" />
              <Card label="Glúteo" value={medidas.gluteo || medidas.quadril} area="gluteo" />
              <Card label="Cintura" value={medidas.cintura} area="cintura" />
              <Card label="Braço esquerdo" value={medidas.braco_esquerdo} area="bracoE" />
              <Card label="Braço direito" value={medidas.braco_direito} area="bracoD" />
              <Card label="Coxa esquerda" value={medidas.coxa_esquerda} area="coxaE" />
              <Card label="Coxa direita" value={medidas.coxa_direita} area="coxaD" />
              <Card
                label="Panturrilha esquerda"
                value={medidas.panturrilha_esquerda}
                area="panturrilhaE"
              />
              <Card
                label="Panturrilha direita"
                value={medidas.panturrilha_direita}
                area="panturrilhaD"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}