"use client";

import { useMemo, useState } from "react";

type SexoMapa = "masculino" | "feminino" | "neutro";

type Medidas = {
  peito?: number | null;
  costas?: number | null;
  cintura?: number | null;
  abdomen?: number | null;
  quadril?: number | null;
  gluteo?: number | null;

  braco_esquerdo?: number | null;
  braco_direito?: number | null;

  biceps_esquerdo?: number | null;
  biceps_direito?: number | null;
  triceps_esquerdo?: number | null;
  triceps_direito?: number | null;
  antebraco_esquerdo?: number | null;
  antebraco_direito?: number | null;
  pulso_esquerdo?: number | null;
  pulso_direito?: number | null;

  coxa_esquerda?: number | null;
  coxa_direita?: number | null;
  panturrilha_esquerda?: number | null;
  panturrilha_direita?: number | null;
};

type RegiaoKey =
  | "peito"
  | "costas"
  | "cintura"
  | "abdomen"
  | "quadril"
  | "gluteo"
  | "biceps_esquerdo"
  | "biceps_direito"
  | "triceps_esquerdo"
  | "triceps_direito"
  | "antebraco_esquerdo"
  | "antebraco_direito"
  | "pulso_esquerdo"
  | "pulso_direito"
  | "coxa_esquerda"
  | "coxa_direita"
  | "panturrilha_esquerda"
  | "panturrilha_direita"
  | "braco_esquerdo"
  | "braco_direito";

type Vista = "frente" | "costas";

function formatMedida(v?: number | null) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "-";
  return `${Number(v).toFixed(1)} cm`;
}

function AbaButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-black text-white shadow-sm"
          : "border border-black/10 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

function ItemMedida({
  label,
  valor,
  regiao,
  ativa,
  onEnter,
  onLeave,
}: {
  label: string;
  valor?: number | null;
  regiao: RegiaoKey;
  ativa: boolean;
  onEnter: (regiao: RegiaoKey) => void;
  onLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={() => onEnter(regiao)}
      onMouseLeave={onLeave}
      className={`cursor-default rounded-xl border px-4 py-3 transition ${
        ativa
          ? "border-blue-500 bg-blue-50 shadow-sm"
          : "border-black/5 bg-white"
      }`}
    >
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-gray-900">
        {formatMedida(valor)}
      </p>
    </div>
  );
}

function hit(hovered: RegiaoKey | null, keys: RegiaoKey[]) {
  return hovered ? keys.includes(hovered) : false;
}

function fillFor(hovered: RegiaoKey | null, keys: RegiaoKey[]) {
  return hit(hovered, keys) ? "#60A5FA" : "#D4D4D8";
}

function strokeFor(hovered: RegiaoKey | null, keys: RegiaoKey[]) {
  return hit(hovered, keys) ? "#2563EB" : "#A1A1AA";
}

function opacityFor(hovered: RegiaoKey | null, keys: RegiaoKey[]) {
  return hit(hovered, keys) ? 1 : 0.94;
}

function getShape(sexo: SexoMapa) {
  if (sexo === "masculino") {
    return {
      ombroEsq: 76,
      ombroDir: 144,
      troncoTopEsq: 84,
      troncoTopDir: 136,
      cinturaEsq: 94,
      cinturaDir: 126,
      quadrilEsq: 84,
      quadrilDir: 136,
      coxaEsq: 98,
      coxaDir: 122,
    };
  }

  if (sexo === "feminino") {
    return {
      ombroEsq: 82,
      ombroDir: 138,
      troncoTopEsq: 88,
      troncoTopDir: 132,
      cinturaEsq: 96,
      cinturaDir: 124,
      quadrilEsq: 78,
      quadrilDir: 142,
      coxaEsq: 96,
      coxaDir: 124,
    };
  }

  return {
    ombroEsq: 79,
    ombroDir: 141,
    troncoTopEsq: 86,
    troncoTopDir: 134,
    cinturaEsq: 95,
    cinturaDir: 125,
    quadrilEsq: 82,
    quadrilDir: 138,
    coxaEsq: 97,
    coxaDir: 123,
  };
}

function SilhuetaFrente({
  hovered,
  setHovered,
  sexo,
}: {
  hovered: RegiaoKey | null;
  setHovered: (v: RegiaoKey | null) => void;
  sexo: SexoMapa;
}) {
  const s = getShape(sexo);

  return (
    <svg
      viewBox="0 0 220 470"
      className="h-[430px] w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="110" cy="42" r="26" fill="#E5E7EB" stroke="#A1A1AA" strokeWidth="1.5" />

      <path
        d={`M${s.troncoTopEsq} 72
           C92 66, 128 66, ${s.troncoTopDir} 72
           L148 114
           C151 126, 143 138, 131 138
           L89 138
           C77 138, 69 126, 72 114 Z`}
        fill={fillFor(hovered, ["peito"])}
        stroke={strokeFor(hovered, ["peito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["peito"])}
        onMouseEnter={() => setHovered("peito")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M92 138
           L128 138
           C133 154, 132 170, ${s.cinturaDir} 184
           L${s.cinturaEsq} 184
           C88 170, 87 154, 92 138 Z`}
        fill={fillFor(hovered, ["abdomen"])}
        stroke={strokeFor(hovered, ["abdomen"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["abdomen"])}
        onMouseEnter={() => setHovered("abdomen")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.cinturaEsq} 184
           C98 178, 122 178, ${s.cinturaDir} 184
           C129 195, 126 204, 120 210
           L100 210
           C94 204, 91 195, ${s.cinturaEsq} 184 Z`}
        fill={fillFor(hovered, ["cintura"])}
        stroke={strokeFor(hovered, ["cintura"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["cintura"])}
        onMouseEnter={() => setHovered("cintura")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.quadrilEsq} 210
           C92 204, 128 204, ${s.quadrilDir} 210
           C142 224, 136 236, 126 242
           L94 242
           C84 236, 78 224, ${s.quadrilEsq} 210 Z`}
        fill={fillFor(hovered, ["quadril"])}
        stroke={strokeFor(hovered, ["quadril"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["quadril"])}
        onMouseEnter={() => setHovered("quadril")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.ombroEsq} 84
           C66 94, 58 111, 58 126
           C58 142, 64 154, 71 162
           C75 166, 82 166, 86 160
           C90 150, 90 108, 84 90
           C82 84, 80 82, ${s.ombroEsq} 84 Z`}
        fill={fillFor(hovered, ["biceps_esquerdo", "braco_esquerdo"])}
        stroke={strokeFor(hovered, ["biceps_esquerdo", "braco_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["biceps_esquerdo", "braco_esquerdo"])}
        onMouseEnter={() => setHovered("biceps_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.ombroDir} 84
           C154 94, 162 111, 162 126
           C162 142, 156 154, 149 162
           C145 166, 138 166, 134 160
           C130 150, 130 108, 136 90
           C138 84, 140 82, ${s.ombroDir} 84 Z`}
        fill={fillFor(hovered, ["biceps_direito", "braco_direito"])}
        stroke={strokeFor(hovered, ["biceps_direito", "braco_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["biceps_direito", "braco_direito"])}
        onMouseEnter={() => setHovered("biceps_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M68 164
           C60 178, 58 194, 62 208
           C65 216, 73 220, 79 214
           C84 207, 84 182, 80 168
           C78 162, 72 160, 68 164 Z"
        fill={fillFor(hovered, ["antebraco_esquerdo"])}
        stroke={strokeFor(hovered, ["antebraco_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["antebraco_esquerdo"])}
        onMouseEnter={() => setHovered("antebraco_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M152 164
           C160 178, 162 194, 158 208
           C155 216, 147 220, 141 214
           C136 207, 136 182, 140 168
           C142 162, 148 160, 152 164 Z"
        fill={fillFor(hovered, ["antebraco_direito"])}
        stroke={strokeFor(hovered, ["antebraco_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["antebraco_direito"])}
        onMouseEnter={() => setHovered("antebraco_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <circle
        cx="66"
        cy="220"
        r="7"
        fill={fillFor(hovered, ["pulso_esquerdo"])}
        stroke={strokeFor(hovered, ["pulso_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["pulso_esquerdo"])}
        onMouseEnter={() => setHovered("pulso_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <circle
        cx="154"
        cy="220"
        r="7"
        fill={fillFor(hovered, ["pulso_direito"])}
        stroke={strokeFor(hovered, ["pulso_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["pulso_direito"])}
        onMouseEnter={() => setHovered("pulso_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.coxaEsq} 242
           C90 254, 85 277, 87 306
           C89 323, 100 328, 106 319
           C111 309, 111 266, 107 246
           C106 241, 102 239, ${s.coxaEsq} 242 Z`}
        fill={fillFor(hovered, ["coxa_esquerda"])}
        stroke={strokeFor(hovered, ["coxa_esquerda"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["coxa_esquerda"])}
        onMouseEnter={() => setHovered("coxa_esquerda")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.coxaDir} 242
           C130 254, 135 277, 133 306
           C131 323, 120 328, 114 319
           C109 309, 109 266, 113 246
           C114 241, 118 239, ${s.coxaDir} 242 Z`}
        fill={fillFor(hovered, ["coxa_direita"])}
        stroke={strokeFor(hovered, ["coxa_direita"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["coxa_direita"])}
        onMouseEnter={() => setHovered("coxa_direita")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M92 320
           C87 336, 87 364, 92 390
           C94 398, 104 398, 106 390
           C110 366, 109 341, 103 322
           C101 318, 95 316, 92 320 Z"
        fill={fillFor(hovered, ["panturrilha_esquerda"])}
        stroke={strokeFor(hovered, ["panturrilha_esquerda"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["panturrilha_esquerda"])}
        onMouseEnter={() => setHovered("panturrilha_esquerda")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M128 320
           C133 336, 133 364, 128 390
           C126 398, 116 398, 114 390
           C110 366, 111 341, 117 322
           C119 318, 125 316, 128 320 Z"
        fill={fillFor(hovered, ["panturrilha_direita"])}
        stroke={strokeFor(hovered, ["panturrilha_direita"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["panturrilha_direita"])}
        onMouseEnter={() => setHovered("panturrilha_direita")}
        onMouseLeave={() => setHovered(null)}
      />
    </svg>
  );
}

function SilhuetaCostas({
  hovered,
  setHovered,
  sexo,
}: {
  hovered: RegiaoKey | null;
  setHovered: (v: RegiaoKey | null) => void;
  sexo: SexoMapa;
}) {
  const s = getShape(sexo);

  return (
    <svg
      viewBox="0 0 220 470"
      className="h-[430px] w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="110" cy="42" r="26" fill="#E5E7EB" stroke="#A1A1AA" strokeWidth="1.5" />

      <path
        d={`M${s.troncoTopEsq} 72
           C92 66, 128 66, ${s.troncoTopDir} 72
           L148 118
           C151 130, 143 144, 131 144
           L89 144
           C77 144, 69 130, 72 118 Z`}
        fill={fillFor(hovered, ["costas"])}
        stroke={strokeFor(hovered, ["costas"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["costas"])}
        onMouseEnter={() => setHovered("costas")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M92 144
           L128 144
           C132 160, 130 174, 124 188
           L96 188
           C90 174, 88 160, 92 144 Z`}
        fill={fillFor(hovered, ["cintura"])}
        stroke={strokeFor(hovered, ["cintura"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["cintura"])}
        onMouseEnter={() => setHovered("cintura")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.quadrilEsq + 2} 190
           C94 184, 126 184, ${s.quadrilDir - 2} 190
           C140 204, 134 218, 124 226
           L96 226
           C86 218, 80 204, ${s.quadrilEsq + 2} 190 Z`}
        fill={fillFor(hovered, ["gluteo", "quadril"])}
        stroke={strokeFor(hovered, ["gluteo", "quadril"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["gluteo", "quadril"])}
        onMouseEnter={() => setHovered("gluteo")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.ombroEsq} 84
           C66 94, 58 111, 58 126
           C58 142, 64 154, 71 162
           C75 166, 82 166, 86 160
           C90 150, 90 108, 84 90
           C82 84, 80 82, ${s.ombroEsq} 84 Z`}
        fill={fillFor(hovered, ["triceps_esquerdo", "braco_esquerdo"])}
        stroke={strokeFor(hovered, ["triceps_esquerdo", "braco_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["triceps_esquerdo", "braco_esquerdo"])}
        onMouseEnter={() => setHovered("triceps_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.ombroDir} 84
           C154 94, 162 111, 162 126
           C162 142, 156 154, 149 162
           C145 166, 138 166, 134 160
           C130 150, 130 108, 136 90
           C138 84, 140 82, ${s.ombroDir} 84 Z`}
        fill={fillFor(hovered, ["triceps_direito", "braco_direito"])}
        stroke={strokeFor(hovered, ["triceps_direito", "braco_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["triceps_direito", "braco_direito"])}
        onMouseEnter={() => setHovered("triceps_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M68 164
           C60 178, 58 194, 62 208
           C65 216, 73 220, 79 214
           C84 207, 84 182, 80 168
           C78 162, 72 160, 68 164 Z"
        fill={fillFor(hovered, ["antebraco_esquerdo"])}
        stroke={strokeFor(hovered, ["antebraco_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["antebraco_esquerdo"])}
        onMouseEnter={() => setHovered("antebraco_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M152 164
           C160 178, 162 194, 158 208
           C155 216, 147 220, 141 214
           C136 207, 136 182, 140 168
           C142 162, 148 160, 152 164 Z"
        fill={fillFor(hovered, ["antebraco_direito"])}
        stroke={strokeFor(hovered, ["antebraco_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["antebraco_direito"])}
        onMouseEnter={() => setHovered("antebraco_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <circle
        cx="66"
        cy="220"
        r="7"
        fill={fillFor(hovered, ["pulso_esquerdo"])}
        stroke={strokeFor(hovered, ["pulso_esquerdo"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["pulso_esquerdo"])}
        onMouseEnter={() => setHovered("pulso_esquerdo")}
        onMouseLeave={() => setHovered(null)}
      />

      <circle
        cx="154"
        cy="220"
        r="7"
        fill={fillFor(hovered, ["pulso_direito"])}
        stroke={strokeFor(hovered, ["pulso_direito"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["pulso_direito"])}
        onMouseEnter={() => setHovered("pulso_direito")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.coxaEsq} 228
           C90 242, 85 272, 87 304
           C89 322, 100 327, 106 318
           C111 308, 111 262, 107 234
           C106 229, 102 227, ${s.coxaEsq} 228 Z`}
        fill={fillFor(hovered, ["coxa_esquerda"])}
        stroke={strokeFor(hovered, ["coxa_esquerda"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["coxa_esquerda"])}
        onMouseEnter={() => setHovered("coxa_esquerda")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d={`M${s.coxaDir} 228
           C130 242, 135 272, 133 304
           C131 322, 120 327, 114 318
           C109 308, 109 262, 113 234
           C114 229, 118 227, ${s.coxaDir} 228 Z`}
        fill={fillFor(hovered, ["coxa_direita"])}
        stroke={strokeFor(hovered, ["coxa_direita"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["coxa_direita"])}
        onMouseEnter={() => setHovered("coxa_direita")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M92 320
           C87 336, 87 364, 92 390
           C94 398, 104 398, 106 390
           C110 366, 109 341, 103 322
           C101 318, 95 316, 92 320 Z"
        fill={fillFor(hovered, ["panturrilha_esquerda"])}
        stroke={strokeFor(hovered, ["panturrilha_esquerda"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["panturrilha_esquerda"])}
        onMouseEnter={() => setHovered("panturrilha_esquerda")}
        onMouseLeave={() => setHovered(null)}
      />

      <path
        d="M128 320
           C133 336, 133 364, 128 390
           C126 398, 116 398, 114 390
           C110 366, 111 341, 117 322
           C119 318, 125 316, 128 320 Z"
        fill={fillFor(hovered, ["panturrilha_direita"])}
        stroke={strokeFor(hovered, ["panturrilha_direita"])}
        strokeWidth="1.5"
        opacity={opacityFor(hovered, ["panturrilha_direita"])}
        onMouseEnter={() => setHovered("panturrilha_direita")}
        onMouseLeave={() => setHovered(null)}
      />
    </svg>
  );
}

export default function MapaCorporal({
  medidas,
  sexo = "neutro",
}: {
  medidas: Medidas;
  sexo?: SexoMapa;
}) {
  const [hovered, setHovered] = useState<RegiaoKey | null>(null);
  const [vista, setVista] = useState<Vista>("frente");

  const grupos = useMemo(
    () => ({
      tronco: [
        { key: "peito" as RegiaoKey, label: "Peito", valor: medidas.peito, vistas: ["frente"] as Vista[] },
        { key: "costas" as RegiaoKey, label: "Costas", valor: medidas.costas, vistas: ["costas"] as Vista[] },
        { key: "cintura" as RegiaoKey, label: "Cintura", valor: medidas.cintura, vistas: ["frente", "costas"] as Vista[] },
        { key: "abdomen" as RegiaoKey, label: "Abdômen", valor: medidas.abdomen, vistas: ["frente"] as Vista[] },
        { key: "quadril" as RegiaoKey, label: "Quadril", valor: medidas.quadril, vistas: ["frente", "costas"] as Vista[] },
        { key: "gluteo" as RegiaoKey, label: "Glúteo", valor: medidas.gluteo, vistas: ["costas"] as Vista[] },
      ],
      superiores: [
        { key: "biceps_esquerdo" as RegiaoKey, label: "Bíceps esquerdo", valor: medidas.biceps_esquerdo, vistas: ["frente"] as Vista[] },
        { key: "biceps_direito" as RegiaoKey, label: "Bíceps direito", valor: medidas.biceps_direito, vistas: ["frente"] as Vista[] },
        { key: "triceps_esquerdo" as RegiaoKey, label: "Tríceps esquerdo", valor: medidas.triceps_esquerdo, vistas: ["costas"] as Vista[] },
        { key: "triceps_direito" as RegiaoKey, label: "Tríceps direito", valor: medidas.triceps_direito, vistas: ["costas"] as Vista[] },
        { key: "antebraco_esquerdo" as RegiaoKey, label: "Antebraço esquerdo", valor: medidas.antebraco_esquerdo, vistas: ["frente", "costas"] as Vista[] },
        { key: "antebraco_direito" as RegiaoKey, label: "Antebraço direito", valor: medidas.antebraco_direito, vistas: ["frente", "costas"] as Vista[] },
        { key: "pulso_esquerdo" as RegiaoKey, label: "Pulso esquerdo", valor: medidas.pulso_esquerdo, vistas: ["frente", "costas"] as Vista[] },
        { key: "pulso_direito" as RegiaoKey, label: "Pulso direito", valor: medidas.pulso_direito, vistas: ["frente", "costas"] as Vista[] },
      ],
      inferiores: [
        { key: "coxa_esquerda" as RegiaoKey, label: "Coxa esquerda", valor: medidas.coxa_esquerda, vistas: ["frente", "costas"] as Vista[] },
        { key: "coxa_direita" as RegiaoKey, label: "Coxa direita", valor: medidas.coxa_direita, vistas: ["frente", "costas"] as Vista[] },
        { key: "panturrilha_esquerda" as RegiaoKey, label: "Panturrilha esquerda", valor: medidas.panturrilha_esquerda, vistas: ["frente", "costas"] as Vista[] },
        { key: "panturrilha_direita" as RegiaoKey, label: "Panturrilha direita", valor: medidas.panturrilha_direita, vistas: ["frente", "costas"] as Vista[] },
      ],
      legado:
        (medidas.braco_esquerdo ?? null) !== null ||
        (medidas.braco_direito ?? null) !== null
          ? [
              {
                key: "braco_esquerdo" as RegiaoKey,
                label: "Braço esquerdo (legado)",
                valor: medidas.braco_esquerdo,
                vistas: ["frente", "costas"] as Vista[],
              },
              {
                key: "braco_direito" as RegiaoKey,
                label: "Braço direito (legado)",
                valor: medidas.braco_direito,
                vistas: ["frente", "costas"] as Vista[],
              },
            ]
          : [],
    }),
    [medidas]
  );

  const porVista = <T extends { vistas: Vista[] }>(arr: T[]) =>
    arr.filter((item) => item.vistas.includes(vista));

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_1fr]">
      <div className="rounded-2xl bg-zinc-50 p-6">
        <div className="mb-4 flex items-center justify-center gap-2">
          <AbaButton active={vista === "frente"} onClick={() => setVista("frente")}>
            Frente
          </AbaButton>
          <AbaButton active={vista === "costas"} onClick={() => setVista("costas")}>
            Costas
          </AbaButton>
        </div>

        <div className="mx-auto w-full max-w-[260px]">
          {vista === "frente" ? (
            <SilhuetaFrente hovered={hovered} setHovered={setHovered} sexo={sexo} />
          ) : (
            <SilhuetaCostas hovered={hovered} setHovered={setHovered} sexo={sexo} />
          )}
        </div>

        <p className="mt-4 text-center text-xs text-zinc-500">
          Passe o mouse na silhueta ou nas medidas para destacar a região.
        </p>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="text-base font-bold text-gray-900">Tronco</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {porVista(grupos.tronco).map((item) => (
              <ItemMedida
                key={item.key}
                regiao={item.key}
                label={item.label}
                valor={item.valor}
                ativa={hovered === item.key}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-gray-900">Membros superiores</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {porVista(grupos.superiores).map((item) => (
              <ItemMedida
                key={item.key}
                regiao={item.key}
                label={item.label}
                valor={item.valor}
                ativa={hovered === item.key}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              />
            ))}
          </div>

          {grupos.legado.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {porVista(grupos.legado).map((item) => (
                <ItemMedida
                  key={item.key}
                  regiao={item.key}
                  label={item.label}
                  valor={item.valor}
                  ativa={hovered === item.key}
                  onEnter={setHovered}
                  onLeave={() => setHovered(null)}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <h3 className="text-base font-bold text-gray-900">Membros inferiores</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {porVista(grupos.inferiores).map((item) => (
              <ItemMedida
                key={item.key}
                regiao={item.key}
                label={item.label}
                valor={item.valor}
                ativa={hovered === item.key}
                onEnter={setHovered}
                onLeave={() => setHovered(null)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}