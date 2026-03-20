"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/apiFetch";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  Search,
  Dumbbell,
  Plus,
  Activity,
  ArrowLeft,
  Sparkles,
  Save,
} from "lucide-react";

type Aluno = {
  id: number;
  nome: string;
};

type Exercicio = {
  id: number;
  nome: string;
  grupo_muscular?: string | null;
  categoria?: string | null;
  nivel?: string | null;
  observacoes_padrao?: string | null;
  ativo: boolean;
};

type ItemTreino = {
  id?: number;
  local_id: string;
  exercicio_id: number | null;
  nome_exercicio_snapshot: string;
  series: string;
  repeticoes: string;
  carga: string;
  descanso: string;
  observacoes: string;
  ordem: number;
};

type TreinoResumo = {
  id: number;
  titulo?: string | null;
  codigo_treino?: string | null;
  dia_semana?: string | null;
  ativo: boolean;
};

function gerarIdLocal() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const diasSemana = [
  "",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

function embaralhar<T>(lista: T[]) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function normalizarTexto(valor?: string | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isComposto(exercicio: Exercicio) {
  const cat = normalizarTexto(exercicio.categoria);
  const nome = normalizarTexto(exercicio.nome);

  return (
    cat.includes("composto") ||
    nome.includes("agachamento") ||
    nome.includes("supino") ||
    nome.includes("remada") ||
    nome.includes("puxada") ||
    nome.includes("levantamento terra") ||
    nome.includes("desenvolvimento") ||
    nome.includes("leg press")
  );
}

function isIsolado(exercicio: Exercicio) {
  return !isComposto(exercicio);
}

function getPeriodizacao(objetivo: string, nivel: string) {
  if (objetivo === "hipertrofia") {
    if (nivel === "iniciante") {
      return [
        {
          semana: 1,
          series: "3",
          repeticoes: "12",
          descanso: "60s",
          obs: "Adaptação técnica e controle de execução",
        },
        {
          semana: 2,
          series: "3",
          repeticoes: "10-12",
          descanso: "60s",
          obs: "Aumentar carga levemente se houver boa execução",
        },
        {
          semana: 3,
          series: "4",
          repeticoes: "8-10",
          descanso: "60-75s",
          obs: "Semana principal de estímulo",
        },
        {
          semana: 4,
          series: "2",
          repeticoes: "12",
          descanso: "45-60s",
          obs: "Deload: reduzir carga e focar técnica",
        },
      ];
    }

    if (nivel === "intermediario") {
      return [
        {
          semana: 1,
          series: "4",
          repeticoes: "10-12",
          descanso: "60s",
          obs: "Base de volume",
        },
        {
          semana: 2,
          series: "4",
          repeticoes: "8-10",
          descanso: "60-75s",
          obs: "Aumentar carga progressivamente",
        },
        {
          semana: 3,
          series: "4",
          repeticoes: "6-8",
          descanso: "75-90s",
          obs: "Semana mais intensa",
        },
        {
          semana: 4,
          series: "2-3",
          repeticoes: "10-12",
          descanso: "45-60s",
          obs: "Deload com redução de carga",
        },
      ];
    }

    return [
      {
        semana: 1,
        series: "4",
        repeticoes: "8-10",
        descanso: "60-75s",
        obs: "Volume controlado",
      },
      {
        semana: 2,
        series: "4",
        repeticoes: "6-8",
        descanso: "75-90s",
        obs: "Aumentar carga se atingir a meta",
      },
      {
        semana: 3,
        series: "5",
        repeticoes: "5-6",
        descanso: "90s",
        obs: "Pico de intensidade",
      },
      {
        semana: 4,
        series: "2-3",
        repeticoes: "10",
        descanso: "60s",
        obs: "Deload e recuperação",
      },
    ];
  }

  if (objetivo === "emagrecimento") {
    return [
      {
        semana: 1,
        series: "3",
        repeticoes: "15",
        descanso: "30-45s",
        obs: "Base metabólica",
      },
      {
        semana: 2,
        series: "3",
        repeticoes: "12-15",
        descanso: "30-45s",
        obs: "Reduzir pausas",
      },
      {
        semana: 3,
        series: "4",
        repeticoes: "12",
        descanso: "30s",
        obs: "Maior densidade de treino",
      },
      {
        semana: 4,
        series: "2-3",
        repeticoes: "15",
        descanso: "45s",
        obs: "Semana de recuperação ativa",
      },
    ];
  }

  if (objetivo === "resistencia") {
    return [
      {
        semana: 1,
        series: "2",
        repeticoes: "15-20",
        descanso: "30s",
        obs: "Adaptação",
      },
      {
        semana: 2,
        series: "3",
        repeticoes: "15-20",
        descanso: "30s",
        obs: "Aumentar volume",
      },
      {
        semana: 3,
        series: "3",
        repeticoes: "20",
        descanso: "20-30s",
        obs: "Maior resistência muscular",
      },
      {
        semana: 4,
        series: "2",
        repeticoes: "15",
        descanso: "45s",
        obs: "Recuperação",
      },
    ];
  }

  return [
    {
      semana: 1,
      series: "2-3",
      repeticoes: "12",
      descanso: "45s",
      obs: "Base inicial",
    },
    {
      semana: 2,
      series: "3",
      repeticoes: "10-12",
      descanso: "45s",
      obs: "Aumentar leve carga",
    },
    {
      semana: 3,
      series: "3",
      repeticoes: "8-10",
      descanso: "60s",
      obs: "Progressão principal",
    },
    {
      semana: 4,
      series: "2",
      repeticoes: "12",
      descanso: "45s",
      obs: "Recuperação",
    },
  ];
}

function getDivisao(divisao: string) {
  const mapa: Record<
    string,
    { codigo: string; titulo: string; dia_semana: string; grupos: string[] }[]
  > = {
    fullbody: [
      {
        codigo: "A",
        titulo: "Treino A",
        dia_semana: "Segunda",
        grupos: [
          "quadriceps",
          "posterior",
          "peito",
          "costas",
          "ombro",
          "abdomen",
        ],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        dia_semana: "Quarta",
        grupos: [
          "quadriceps",
          "gluteo",
          "peito",
          "costas",
          "ombro",
          "abdomen",
        ],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        dia_semana: "Sexta",
        grupos: [
          "quadriceps",
          "posterior",
          "peito",
          "costas",
          "panturrilha",
          "abdomen",
        ],
      },
    ],
    ab: [
      {
        codigo: "A",
        titulo: "Treino A",
        dia_semana: "Segunda",
        grupos: ["peito", "ombro", "triceps", "abdomen"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        dia_semana: "Quarta",
        grupos: [
          "costas",
          "biceps",
          "quadriceps",
          "posterior",
          "gluteo",
          "panturrilha",
        ],
      },
      {
        codigo: "A",
        titulo: "Treino A2",
        dia_semana: "Sexta",
        grupos: ["peito", "ombro", "triceps", "abdomen"],
      },
      {
        codigo: "B",
        titulo: "Treino B2",
        dia_semana: "Sábado",
        grupos: [
          "costas",
          "biceps",
          "quadriceps",
          "posterior",
          "gluteo",
          "panturrilha",
        ],
      },
    ],
    abc: [
      {
        codigo: "A",
        titulo: "Treino A",
        dia_semana: "Segunda",
        grupos: ["peito", "ombro", "triceps"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        dia_semana: "Quarta",
        grupos: ["costas", "biceps", "abdomen"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        dia_semana: "Sexta",
        grupos: ["quadriceps", "posterior", "gluteo", "panturrilha"],
      },
    ],
    abcd: [
      {
        codigo: "A",
        titulo: "Treino A",
        dia_semana: "Segunda",
        grupos: ["peito", "triceps"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        dia_semana: "Terça",
        grupos: ["costas", "biceps"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        dia_semana: "Quinta",
        grupos: ["quadriceps", "panturrilha"],
      },
      {
        codigo: "D",
        titulo: "Treino D",
        dia_semana: "Sexta",
        grupos: ["ombro", "posterior", "gluteo", "abdomen"],
      },
    ],
    abcde: [
      {
        codigo: "A",
        titulo: "Treino A",
        dia_semana: "Segunda",
        grupos: ["peito", "triceps"],
      },
      {
        codigo: "B",
        titulo: "Treino B",
        dia_semana: "Terça",
        grupos: ["costas", "biceps"],
      },
      {
        codigo: "C",
        titulo: "Treino C",
        dia_semana: "Quarta",
        grupos: ["quadriceps", "panturrilha"],
      },
      {
        codigo: "D",
        titulo: "Treino D",
        dia_semana: "Quinta",
        grupos: ["ombro", "abdomen"],
      },
      {
        codigo: "E",
        titulo: "Treino E",
        dia_semana: "Sexta",
        grupos: ["posterior", "gluteo", "abdomen"],
      },
    ],
  };

  return mapa[divisao] || mapa.abc;
}

function getFaixaExerciciosPorTreino(divisao: string, gruposCount: number) {
  if (divisao === "fullbody") return { min: 8, max: 10 };
  if (divisao === "ab") return { min: 7, max: 9 };
  if (divisao === "abc") return { min: 7, max: 8 };
  if (divisao === "abcd") return { min: 6, max: 8 };
  if (divisao === "abcde") return { min: 6, max: 8 };
  return {
    min: Math.max(6, gruposCount * 2),
    max: Math.max(8, gruposCount * 2),
  };
}

function selecionarExerciciosInteligente(
  biblioteca: Exercicio[],
  grupo: string,
  nivel: string,
  usadosGlobais: Set<number>,
  quantidadeDesejada: number
) {
  const candidatosBase = biblioteca.filter((ex) => {
    const grupoOk =
      normalizarTexto(ex.grupo_muscular) === normalizarTexto(grupo);
    const nivelEx = normalizarTexto(ex.nivel || "todos");
    const nivelOk = nivelEx === "todos" || nivelEx === normalizarTexto(nivel);
    const ativoOk = ex.ativo !== false;
    return grupoOk && nivelOk && ativoOk;
  });

  const candidatosNaoUsados = candidatosBase.filter(
    (ex) => !usadosGlobais.has(ex.id)
  );
  const compostos = embaralhar(candidatosNaoUsados.filter(isComposto));
  const isolados = embaralhar(candidatosNaoUsados.filter(isIsolado));

  const selecionados: Exercicio[] = [];

  if (compostos.length > 0) {
    selecionados.push(compostos.shift() as Exercicio);
  }

  while (selecionados.length < quantidadeDesejada && isolados.length > 0) {
    selecionados.push(isolados.shift() as Exercicio);
  }

  while (selecionados.length < quantidadeDesejada && compostos.length > 0) {
    selecionados.push(compostos.shift() as Exercicio);
  }

  if (selecionados.length < quantidadeDesejada) {
    const fallback = embaralhar(candidatosBase).filter(
      (ex) => !selecionados.some((s) => s.id === ex.id)
    );

    while (selecionados.length < quantidadeDesejada && fallback.length > 0) {
      selecionados.push(fallback.shift() as Exercicio);
    }
  }

  selecionados.forEach((ex) => usadosGlobais.add(ex.id));
  return selecionados;
}

function distribuirQuantidadePorGrupo(grupos: string[], divisao: string) {
  const mapa: Record<string, number> = {};

  for (const grupo of grupos) {
    const nome = normalizarTexto(grupo);

    if (divisao === "fullbody") {
      if (["peito", "costas", "quadriceps", "posterior"].includes(nome))
        mapa[grupo] = 2;
      else mapa[grupo] = 1;
      continue;
    }

    if (divisao === "ab") {
      if (["peito", "costas", "quadriceps"].includes(nome)) mapa[grupo] = 2;
      else if (["posterior", "gluteo", "ombro"].includes(nome))
        mapa[grupo] = 1;
      else mapa[grupo] = 1;
      continue;
    }

    if (divisao === "abc") {
      if (["peito", "costas", "quadriceps"].includes(nome)) mapa[grupo] = 3;
      else if (
        ["ombro", "triceps", "biceps", "posterior", "gluteo"].includes(nome)
      )
        mapa[grupo] = 2;
      else mapa[grupo] = 1;
      continue;
    }

    if (divisao === "abcd") {
      if (["peito", "costas", "quadriceps", "ombro"].includes(nome))
        mapa[grupo] = 3;
      else if (["triceps", "biceps", "posterior", "gluteo"].includes(nome))
        mapa[grupo] = 2;
      else mapa[grupo] = 1;
      continue;
    }

    if (divisao === "abcde") {
      if (["peito", "costas", "quadriceps", "ombro"].includes(nome))
        mapa[grupo] = 4;
      else if (["triceps", "biceps", "posterior", "gluteo"].includes(nome))
        mapa[grupo] = 3;
      else mapa[grupo] = 2;
      continue;
    }

    mapa[grupo] = 2;
  }

  return mapa;
}

function ajustarVolumeTotal(
  itensParciais: { grupo: string; exercicios: Exercicio[] }[],
  divisao: string
) {
  const gruposCount = itensParciais.length;
  const faixa = getFaixaExerciciosPorTreino(divisao, gruposCount);

  let totalAtual = itensParciais.reduce(
    (acc, item) => acc + item.exercicios.length,
    0
  );

  if (totalAtual > faixa.max) {
    for (let i = itensParciais.length - 1; i >= 0 && totalAtual > faixa.max; i--) {
      while (itensParciais[i].exercicios.length > 1 && totalAtual > faixa.max) {
        itensParciais[i].exercicios.pop();
        totalAtual--;
      }
    }
  }

  return itensParciais;
}

function gerarTreinosAutomaticosPro(
  biblioteca: Exercicio[],
  objetivo: string,
  nivel: string,
  frequencia: number,
  divisao: string,
  semanaEscolhida: number
) {
  const periodizacao = getPeriodizacao(objetivo, nivel);
  const semanaCfg =
    periodizacao.find((item) => item.semana === semanaEscolhida) ||
    periodizacao[0];

  const estruturaBase = getDivisao(divisao);
  const estrutura = estruturaBase.slice(
    0,
    Math.min(frequencia, estruturaBase.length)
  );

  const treinosGerados: any[] = [];
  const usadosGlobais = new Set<number>();

  for (let blocoIndex = 0; blocoIndex < estrutura.length; blocoIndex++) {
    const bloco = estrutura[blocoIndex];
    const distribuicao = distribuirQuantidadePorGrupo(bloco.grupos, divisao);

    const itensParciais = bloco.grupos.map((grupo) => ({
      grupo,
      exercicios: selecionarExerciciosInteligente(
        biblioteca,
        grupo,
        nivel,
        usadosGlobais,
        distribuicao[grupo] || 1
      ),
    }));

    const itensAjustados = ajustarVolumeTotal(itensParciais, divisao);

    let ordem = 1;
    const itens: any[] = [];

    for (const itemGrupo of itensAjustados) {
      for (const ex of itemGrupo.exercicios) {
        itens.push({
          exercicio_id: ex.id || null,
          nome_exercicio_snapshot: ex.nome || "",
          series: semanaCfg.series,
          repeticoes: semanaCfg.repeticoes,
          carga: "",
          descanso: semanaCfg.descanso,
          observacoes: [
            ex.observacoes_padrao || "",
            `Semana ${semanaCfg.semana}`,
            semanaCfg.obs,
          ]
            .filter(Boolean)
            .join(" | "),
          ordem: ordem++,
        });
      }
    }

    treinosGerados.push({
      titulo: `${bloco.titulo} - Semana ${semanaCfg.semana}`,
      codigo_treino: bloco.codigo,
      dia_semana: bloco.dia_semana,
      ordem: blocoIndex + 1,
      semana_periodizacao: semanaCfg.semana,
      itens,
    });
  }

  return treinosGerados;
}

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
  return <label className="mb-1 block text-sm font-medium text-gray-600">{children}</label>;
}

export default function TreinoPersonalizadoAlunoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const alunoId = Number(params?.id);

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [treinosExistentes, setTreinosExistentes] = useState<TreinoResumo[]>([]);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [buscaExercicio, setBuscaExercicio] = useState("");

  const [treinoId, setTreinoId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [codigoTreino, setCodigoTreino] = useState("");
  const [diaSemana, setDiaSemana] = useState("");
  const [ordemTreino, setOrdemTreino] = useState("0");
  const [ativo, setAtivo] = useState(true);

  const [modalGeradorAberto, setModalGeradorAberto] = useState(false);
  const [gerandoAutomatico, setGerandoAutomatico] = useState(false);
  const [geradorObjetivo, setGeradorObjetivo] = useState("hipertrofia");
  const [geradorNivel, setGeradorNivel] = useState("iniciante");
  const [geradorFrequencia, setGeradorFrequencia] = useState("3");
  const [geradorDivisao, setGeradorDivisao] = useState("abc");
  const [geradorSemana, setGeradorSemana] = useState("1");

  const [bibliotecaExercicios, setBibliotecaExercicios] = useState<Exercicio[]>(
    []
  );
  const [itens, setItens] = useState<ItemTreino[]>([]);

  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [apagandoInativos, setApagandoInativos] = useState(false);

  const limparFormulario = () => {
    setTreinoId(null);
    setTitulo("");
    setObjetivo("");
    setObservacoes("");
    setCodigoTreino("");
    setDiaSemana("");
    setOrdemTreino("0");
    setAtivo(true);
    setItens([]);
  };

  const carregarBase = async () => {
    const [resAlunos, resExercicios, resTreinos] = await Promise.all([
      apiFetch("/api/alunos", { cache: "no-store" }),
      apiFetch("/api/exercicios?ativo=true", { cache: "no-store" }),
      apiFetch(`/api/treinos-personalizados?aluno_id=${alunoId}`, {
        cache: "no-store",
      }),
    ]);

    const jsonAlunos = await resAlunos.json().catch(() => []);
    const jsonExercicios = await resExercicios.json().catch(() => []);
    const jsonTreinos = await resTreinos.json().catch(() => []);

    if (!resAlunos.ok) {
      throw new Error((jsonAlunos as any).error || "Erro ao carregar aluno");
    }

    if (!resExercicios.ok) {
      throw new Error(
        (jsonExercicios as any).error || "Erro ao carregar exercícios"
      );
    }

    if (!resTreinos.ok) {
      console.error("Erro /api/treinos-personalizados:", jsonTreinos);
      throw new Error((jsonTreinos as any).error || "Erro ao carregar treinos");
    }

    const listaAlunos = Array.isArray(jsonAlunos) ? jsonAlunos : [];
    const alunoEncontrado =
      listaAlunos.find((item: any) => Number(item.id) === alunoId) || null;

    if (!alunoEncontrado) {
      throw new Error("Aluno não encontrado");
    }

    setAluno(alunoEncontrado);
    setExercicios(Array.isArray(jsonExercicios) ? jsonExercicios : []);
    setTreinosExistentes(Array.isArray(jsonTreinos) ? jsonTreinos : []);
  };

  const carregarBibliotecaExercicios = async () => {
    const res = await apiFetch("/api/exercicios?ativo=true", {
      cache: "no-store",
    });

    const json = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar exercícios");
    }

    const lista = Array.isArray(json) ? json : [];
    setBibliotecaExercicios(lista);
    return lista;
  };

  const carregarTreino = async (id: number) => {
    const res = await apiFetch(`/api/treinos-personalizados/${id}`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error((json as any).error || "Erro ao carregar treino");
    }

    setTreinoId(json.id || null);
    setTitulo(json.titulo || "");
    setObjetivo(json.objetivo || "");
    setObservacoes(json.observacoes || "");
    setCodigoTreino(json.codigo_treino || "");
    setDiaSemana(json.dia_semana || "");
    setOrdemTreino(String(json.ordem ?? 0));
    setAtivo(Boolean(json.ativo));

    setItens(
      Array.isArray(json.itens)
        ? json.itens.map((item: any) => ({
            id: item.id,
            local_id: gerarIdLocal(),
            exercicio_id: item.exercicio_id ? Number(item.exercicio_id) : null,
            nome_exercicio_snapshot: item.nome_exercicio_snapshot || "",
            series: item.series || "",
            repeticoes: item.repeticoes || "",
            carga: item.carga || "",
            descanso: item.descanso || "",
            observacoes: item.observacoes || "",
            ordem: Number(item.ordem || 0),
          }))
        : []
    );
  };

  const carregar = async () => {
    try {
      setErro("");

      if (!alunoId || Number.isNaN(alunoId)) {
        setErro("Aluno inválido");
        return;
      }

      await carregarBase();
      limparFormulario();
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar a página");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [alunoId]);

  const exerciciosFiltrados = useMemo(() => {
    const termo = buscaExercicio.trim().toLowerCase();
    if (!termo) return exercicios;

    return exercicios.filter((exercicio) => {
      const nome = String(exercicio.nome || "").toLowerCase();
      const grupo = String(exercicio.grupo_muscular || "").toLowerCase();
      const categoria = String(exercicio.categoria || "").toLowerCase();

      return (
        nome.includes(termo) ||
        grupo.includes(termo) ||
        categoria.includes(termo)
      );
    });
  }, [exercicios, buscaExercicio]);

  const treinosAtivos = useMemo(
    () => treinosExistentes.filter((t) => t.ativo),
    [treinosExistentes]
  );

  const treinosInativos = useMemo(
    () => treinosExistentes.filter((t) => !t.ativo),
    [treinosExistentes]
  );

  const adicionarExercicio = (exercicio: Exercicio) => {
    setItens((prev) => [
      ...prev,
      {
        local_id: gerarIdLocal(),
        exercicio_id: exercicio.id,
        nome_exercicio_snapshot: exercicio.nome,
        series: "",
        repeticoes: "",
        carga: "",
        descanso: "",
        observacoes: exercicio.observacoes_padrao || "",
        ordem: prev.length + 1,
      },
    ]);
  };

  const adicionarExercicioManual = () => {
    setItens((prev) => [
      ...prev,
      {
        local_id: gerarIdLocal(),
        exercicio_id: null,
        nome_exercicio_snapshot: "",
        series: "",
        repeticoes: "",
        carga: "",
        descanso: "",
        observacoes: "",
        ordem: prev.length + 1,
      },
    ]);
  };

  const atualizarItem = (
    localId: string,
    campo: keyof ItemTreino,
    valor: string | number | null
  ) => {
    setItens((prev) =>
      prev.map((item) =>
        item.local_id === localId ? { ...item, [campo]: valor } : item
      )
    );
  };

  const removerItem = (localId: string) => {
    setItens((prev) =>
      prev
        .filter((item) => item.local_id !== localId)
        .map((item, index) => ({
          ...item,
          ordem: index + 1,
        }))
    );
  };

  const moverItem = (indexAtual: number, direcao: "cima" | "baixo") => {
    setItens((prev) => {
      const novaLista = [...prev];
      const novoIndice = direcao === "cima" ? indexAtual - 1 : indexAtual + 1;

      if (novoIndice < 0 || novoIndice >= novaLista.length) return prev;

      const temp = novaLista[indexAtual];
      novaLista[indexAtual] = novaLista[novoIndice];
      novaLista[novoIndice] = temp;

      return novaLista.map((item, index) => ({
        ...item,
        ordem: index + 1,
      }));
    });
  };

  const abrirGeradorAutomatico = async () => {
    try {
      if (bibliotecaExercicios.length === 0) {
        await carregarBibliotecaExercicios();
      }
      setModalGeradorAberto(true);
    } catch (error: any) {
      alert(error?.message || "Erro ao carregar biblioteca de exercícios");
    }
  };

  const apagarTreinosInativos = async () => {
    try {
      if (treinosInativos.length === 0) {
        alert("Não há treinos inativos para apagar.");
        return;
      }

      const confirmar = window.confirm(
        `Deseja apagar ${treinosInativos.length} treino(s) inativo(s)?`
      );

      if (!confirmar) return;

      setApagandoInativos(true);

      for (const treino of treinosInativos) {
        const res = await apiFetch(`/api/treinos-personalizados/${treino.id}`, {
          method: "DELETE",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(
            (json as any).error ||
              `Erro ao apagar treino ${treino.titulo || treino.id}`
          );
          return;
        }
      }

      await carregarBase();
      alert("Treinos inativos apagados com sucesso.");
    } catch (error: any) {
      alert(error?.message || "Erro ao apagar treinos inativos");
    } finally {
      setApagandoInativos(false);
    }
  };

  const aplicarGeracaoAutomatica = async () => {
    try {
      setGerandoAutomatico(true);

      if (!aluno) {
        alert("Aluno não encontrado");
        return;
      }

      const freq = Number(geradorFrequencia);

      if (geradorDivisao === "fullbody" && freq > 3) {
        alert("Na versão ULTRA PRO, Full body permite no máximo 3x por semana.");
        return;
      }

      if (geradorDivisao === "abc" && freq > 3) {
        alert("Na divisão ABC, use até 3x por semana.");
        return;
      }

      if (geradorDivisao === "abcd" && freq > 4) {
        alert("Na divisão ABCD, use até 4x por semana.");
        return;
      }

      if (geradorDivisao === "abcde" && freq > 5) {
        alert("Na divisão ABCDE, use até 5x por semana.");
        return;
      }

      const biblioteca =
        bibliotecaExercicios.length > 0
          ? bibliotecaExercicios
          : await carregarBibliotecaExercicios();

      const treinosGerados = gerarTreinosAutomaticosPro(
        biblioteca,
        geradorObjetivo,
        geradorNivel,
        freq,
        geradorDivisao,
        Number(geradorSemana)
      );

      if (!treinosGerados.length) {
        alert("Não foi possível gerar os treinos com a biblioteca atual.");
        return;
      }

      const desativarAntigos = window.confirm(
        "Deseja desativar os treinos atuais deste aluno antes de gerar os novos?"
      );

      if (
        desativarAntigos &&
        Array.isArray(treinosExistentes) &&
        treinosExistentes.length > 0
      ) {
        for (const treinoExistente of treinosExistentes.filter((t) => t.ativo)) {
          const resGet = await apiFetch(
            `/api/treinos-personalizados/${treinoExistente.id}`,
            {
              cache: "no-store",
            }
          );

          const jsonGet = await resGet.json().catch(() => ({}));

          if (!resGet.ok) {
            alert(
              (jsonGet as any).error ||
                `Erro ao carregar treino ${
                  treinoExistente.titulo || treinoExistente.id
                }`
            );
            return;
          }

          const resPut = await apiFetch(
            `/api/treinos-personalizados/${treinoExistente.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                aluno_id: jsonGet.aluno_id,
                personal_nome: jsonGet.personal_nome || null,
                titulo: jsonGet.titulo || null,
                objetivo: jsonGet.objetivo || null,
                observacoes: jsonGet.observacoes || null,
                codigo_treino: jsonGet.codigo_treino || null,
                dia_semana: jsonGet.dia_semana || null,
                ordem: Number(jsonGet.ordem || 0),
                ativo: false,
                nivel: jsonGet.nivel || null,
                divisao: jsonGet.divisao || null,
                frequencia_semana: jsonGet.frequencia_semana || null,
                origem_geracao: jsonGet.origem_geracao || null,
                semana_periodizacao: jsonGet.semana_periodizacao || null,
                itens: Array.isArray(jsonGet.itens)
                  ? jsonGet.itens.map((item: any, index: number) => ({
                      exercicio_id: item.exercicio_id || null,
                      nome_exercicio_snapshot:
                        item.nome_exercicio_snapshot || "",
                      series: item.series || "",
                      repeticoes: item.repeticoes || "",
                      carga: item.carga || "",
                      descanso: item.descanso || "",
                      observacoes: item.observacoes || "",
                      ordem: Number(item.ordem || index + 1),
                    }))
                  : [],
              }),
            }
          );

          const jsonPut = await resPut.json().catch(() => ({}));

          if (!resPut.ok) {
            alert(
              (jsonPut as any).error ||
                `Erro ao desativar treino ${
                  treinoExistente.titulo || treinoExistente.id
                }`
            );
            return;
          }
        }
      }

      const personalNome =
        typeof window !== "undefined"
          ? localStorage.getItem("treinoprint_nome") || null
          : null;

      for (const treino of treinosGerados) {
        const res = await apiFetch("/api/treinos-personalizados", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            aluno_id: Number(aluno.id),
            personal_nome: personalNome,
            titulo: treino.titulo,
            objetivo: geradorObjetivo,
            observacoes: `Gerado automaticamente ULTRA PRO (${geradorDivisao.toUpperCase()}) • Semana ${treino.semana_periodizacao}`,
            codigo_treino: treino.codigo_treino,
            dia_semana: treino.dia_semana,
            ordem: treino.ordem,
            ativo: true,
            nivel: geradorNivel,
            divisao: geradorDivisao,
            frequencia_semana: freq,
            origem_geracao: "automatico_ultra_pro",
            semana_periodizacao: treino.semana_periodizacao,
            itens: treino.itens.map((item: any, index: number) => ({
              exercicio_id: item.exercicio_id || null,
              nome_exercicio_snapshot: item.nome_exercicio_snapshot || "",
              series: item.series || "",
              repeticoes: item.repeticoes || "",
              carga: item.carga || "",
              descanso: item.descanso || "",
              observacoes: item.observacoes || "",
              ordem: Number(item.ordem || index + 1),
            })),
          }),
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          alert(
            (json as any).error || `Erro ao salvar ${treino.titulo || "treino"}`
          );
          return;
        }
      }

      setModalGeradorAberto(false);
      await carregarBase();
      limparFormulario();

      alert(`${treinosGerados.length} treinos ULTRA PRO gerados com sucesso.`);
    } catch (error: any) {
      alert(error?.message || "Erro ao gerar treinos automáticos ULTRA PRO");
    } finally {
      setGerandoAutomatico(false);
    }
  };

  const salvar = async () => {
    try {
      if (!alunoId || Number.isNaN(alunoId)) {
        alert("Aluno inválido");
        return;
      }

      if (itens.length === 0) {
        alert("Adicione pelo menos um exercício");
        return;
      }

      const itemSemNome = itens.find(
        (item) => !String(item.nome_exercicio_snapshot || "").trim()
      );

      if (itemSemNome) {
        alert("Todos os exercícios precisam ter nome");
        return;
      }

      setSalvando(true);

      const payload = {
        aluno_id: alunoId,
        personal_nome:
          typeof window !== "undefined"
            ? localStorage.getItem("treinoprint_nome") || null
            : null,
        titulo: titulo || null,
        objetivo: objetivo || null,
        observacoes: observacoes || null,
        codigo_treino: codigoTreino || null,
        dia_semana: diaSemana || null,
        ordem: Number(ordemTreino || 0),
        ativo,
        itens: itens.map((item, index) => ({
          exercicio_id: item.exercicio_id,
          nome_exercicio_snapshot: item.nome_exercicio_snapshot,
          series: item.series,
          repeticoes: item.repeticoes,
          carga: item.carga,
          descanso: item.descanso,
          observacoes: item.observacoes,
          ordem: index + 1,
        })),
      };

      const res = await apiFetch(
        treinoId
          ? `/api/treinos-personalizados/${treinoId}`
          : `/api/treinos-personalizados`,
        {
          method: treinoId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao salvar treino personalizado");
        return;
      }

      const novoTreinoId =
        treinoId || (json as any)?.treino?.id || (json as any)?.id || null;

      alert(
        treinoId
          ? "Treino atualizado com sucesso"
          : "Treino criado com sucesso"
      );

      await carregarBase();

      if (novoTreinoId) {
        await carregarTreino(Number(novoTreinoId));
        setTreinoId(Number(novoTreinoId));
      } else {
        limparFormulario();
      }
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
  <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

  <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
    <div>
          <h1 className="mt-2 text-5xl font-black md:text-4xl">
        Treinos personalizados
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-300">
        {aluno
          ? `Monte, edite e gerencie os treinos personalizados do aluno: ${aluno.nome}.`
          : "Monte, edite e gerencie treinos personalizados do aluno."}
      </p>
    </div>

    <div className="min-w-[240px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
      <p className="text-xs text-white/60">Status do sistema</p>
      <p className="mt-1 text-xl font-black">TreinoPrint Online</p>
      <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
        <Activity size={16} />
        Operação ativa
      </div>
    </div>
  </div>

  <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
    <button
      onClick={() => router.push("/alunos")}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-700 px-5 py-3 text-white hover:bg-zinc-600"
    >
      <ArrowLeft size={18} />
      Voltar
    </button>

    <button
      onClick={() => limparFormulario()}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-white hover:bg-zinc-700"
    >
      <Plus size={18} />
      Novo treino
    </button>

    <button
      type="button"
      onClick={abrirGeradorAutomatico}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700"
    >
      <Sparkles size={18} />
      Gerar treino automático PRO
    </button>

    <button
      onClick={salvar}
      disabled={salvando}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-black hover:bg-zinc-100 disabled:opacity-60"
    >
      <Save size={18} />
      {salvando
        ? "Salvando..."
        : treinoId
        ? "Salvar alterações"
        : "Criar treino"}
    </button>
  </div>
</section>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <Card
        title="Treinos já cadastrados"
        subtitle="Gerencie treinos ativos e inativos do aluno."
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => setMostrarInativos((v) => !v)}
              className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2"
            >
              {mostrarInativos ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              {mostrarInativos ? "Ocultar inativos" : "Mostrar inativos"}
            </button>

            <button
              type="button"
              onClick={apagarTreinosInativos}
              disabled={apagandoInativos || treinosInativos.length === 0}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white disabled:opacity-60"
            >
              <Trash2 size={16} />
              {apagandoInativos
                ? "Apagando..."
                : `Apagar inativos (${treinosInativos.length})`}
            </button>
          </div>
        </div>

        {treinosExistentes.length === 0 ? (
          <p className="text-gray-500">Nenhum treino personalizado cadastrado.</p>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-green-700">
                Treinos ativos ({treinosAtivos.length})
              </h3>

              {treinosAtivos.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum treino ativo.</p>
              ) : (
                <div className="grid gap-3">
                  {treinosAtivos.map((treino) => (
                    <div
                      key={treino.id}
                      className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50/40 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {treino.titulo || "Treino sem título"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Código: {treino.codigo_treino || "-"} • Dia: {treino.dia_semana || "-"}
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          setLoading(true);
                          try {
                            await carregarBase();
                            await carregarTreino(treino.id);
                          } catch (error: any) {
                            setErro(error.message || "Erro ao carregar treino");
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                      >
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-600">
                Treinos inativos ({treinosInativos.length})
              </h3>

              {mostrarInativos ? (
                treinosInativos.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum treino inativo.</p>
                ) : (
                  <div className="grid max-h-[360px] gap-3 overflow-auto pr-1">
                    {treinosInativos.map((treino) => (
                      <div
                        key={treino.id}
                        className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {treino.titulo || "Treino sem título"}
                          </p>
                          <p className="text-sm text-gray-500">
                            Código: {treino.codigo_treino || "-"} • Dia: {treino.dia_semana || "-"}
                          </p>
                        </div>

                        <button
                          onClick={async () => {
                            setLoading(true);
                            try {
                              await carregarBase();
                              await carregarTreino(treino.id);
                            } catch (error: any) {
                              setErro(error.message || "Erro ao carregar treino");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                        >
                          Editar
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <p className="text-sm text-gray-400">
                  Lista recolhida para manter a página mais limpa.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card
        title="Dados do treino"
        subtitle="Informações gerais do treino selecionado."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <Label>Aluno</Label>
            <input
              value={aluno?.nome || ""}
              disabled
              className="w-full rounded-xl border bg-gray-100 p-3"
            />
          </div>

          <div className="flex items-end">
            <label className="flex h-[48px] w-full items-center gap-2 rounded-xl border px-3 py-3">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
              />
              <span className="text-sm">Treino ativo</span>
            </label>
          </div>

          <div>
            <Label>Código do treino</Label>
            <input
              value={codigoTreino}
              onChange={(e) => setCodigoTreino(e.target.value)}
              placeholder="Ex: A"
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <Label>Dia da semana</Label>
            <select
              value={diaSemana}
              onChange={(e) => setDiaSemana(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              {diasSemana.map((dia) => (
                <option key={dia} value={dia}>
                  {dia || "Selecione"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Título</Label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Treino A - Hipertrofia"
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <Label>Ordem</Label>
            <input
              type="number"
              value={ordemTreino}
              onChange={(e) => setOrdemTreino(e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="xl:col-span-2">
            <Label>Objetivo</Label>
            <input
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              placeholder="Ex: Ganho de massa"
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2 xl:col-span-3">
            <Label>Observações gerais</Label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do treino"
              className="min-h-28 w-full rounded-xl border p-3"
            />
          </div>
        </div>
      </Card>

      <Card
        title="Biblioteca de exercícios"
        subtitle="Busque e adicione exercícios ao treino."
      >
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={buscaExercicio}
                onChange={(e) => setBuscaExercicio(e.target.value)}
                placeholder="Buscar exercício por nome, grupo muscular ou categoria"
                className="w-full rounded-xl border p-3 pl-10"
              />
            </div>
          </div>

          <button
            onClick={adicionarExercicioManual}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-white"
          >
            <Plus size={16} />
            Adicionar exercício manual
          </button>
        </div>

        <div className="max-h-72 overflow-auto rounded-2xl border">
          {exerciciosFiltrados.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">Nenhum exercício encontrado.</p>
          ) : (
            exerciciosFiltrados.map((exercicio) => (
              <div
                key={exercicio.id}
                className="flex flex-col gap-3 border-b p-4 last:border-b-0 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{exercicio.nome}</p>
                  <p className="text-sm text-gray-500">
                    {exercicio.grupo_muscular || "-"} • {exercicio.categoria || "-"}
                  </p>
                </div>

                <button
                  onClick={() => adicionarExercicio(exercicio)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-white"
                >
                  <Dumbbell size={15} />
                  Adicionar
                </button>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card
        title="Exercícios do treino"
        subtitle="Edite, reordene e personalize os itens do treino."
      >
        {itens.length === 0 ? (
          <p className="text-gray-500">Nenhum exercício adicionado ainda.</p>
        ) : (
          <div className="space-y-4">
            {itens.map((item, index) => (
              <div
                key={item.local_id}
                className="space-y-4 rounded-2xl border p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Exercício #{index + 1}
                    </p>
                    <p className="text-sm text-gray-500">Ordem: {item.ordem}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      onClick={() => moverItem(index, "cima")}
                      className="rounded-xl border px-3 py-2"
                    >
                      Subir
                    </button>

                    <button
                      onClick={() => moverItem(index, "baixo")}
                      className="rounded-xl border px-3 py-2"
                    >
                      Descer
                    </button>

                    <button
                      onClick={() => removerItem(item.local_id)}
                      className="rounded-xl bg-red-600 px-3 py-2 text-white"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div className="md:col-span-2 xl:col-span-3">
                    <Label>Nome do exercício</Label>
                    <input
                      value={item.nome_exercicio_snapshot}
                      onChange={(e) =>
                        atualizarItem(
                          item.local_id,
                          "nome_exercicio_snapshot",
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div>
                    <Label>Séries</Label>
                    <input
                      value={item.series}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "series", e.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div>
                    <Label>Repetições</Label>
                    <input
                      value={item.repeticoes}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "repeticoes", e.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div>
                    <Label>Carga</Label>
                    <input
                      value={item.carga}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "carga", e.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div>
                    <Label>Descanso</Label>
                    <input
                      value={item.descanso}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "descanso", e.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Observações</Label>
                    <input
                      value={item.observacoes}
                      onChange={(e) =>
                        atualizarItem(item.local_id, "observacoes", e.target.value)
                      }
                      className="w-full rounded-xl border p-3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {modalGeradorAberto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white p-5 shadow-xl md:p-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-2xl font-black text-gray-900">
                Gerar treino automático
              </h2>

              <button
                type="button"
                onClick={() => setModalGeradorAberto(false)}
                className="rounded-xl border px-4 py-2"
              >
                Fechar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <Label>Objetivo</Label>
                <select
                  value={geradorObjetivo}
                  onChange={(e) => setGeradorObjetivo(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="hipertrofia">Hipertrofia</option>
                  <option value="emagrecimento">Emagrecimento</option>
                  <option value="resistencia">Resistência</option>
                  <option value="adaptacao">Adaptação</option>
                </select>
              </div>

              <div>
                <Label>Nível</Label>
                <select
                  value={geradorNivel}
                  onChange={(e) => setGeradorNivel(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="iniciante">Iniciante</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>
              </div>

              <div>
                <Label>Frequência semanal</Label>
                <select
                  value={geradorFrequencia}
                  onChange={(e) => setGeradorFrequencia(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="1">1x</option>
                  <option value="2">2x</option>
                  <option value="3">3x</option>
                  <option value="4">4x</option>
                  <option value="5">5x</option>
                </select>
              </div>

              <div>
                <Label>Divisão</Label>
                <select
                  value={geradorDivisao}
                  onChange={(e) => setGeradorDivisao(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="fullbody">Full body</option>
                  <option value="ab">AB</option>
                  <option value="abc">ABC</option>
                  <option value="abcd">ABCD</option>
                  <option value="abcde">ABCDE</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Semana da periodização</Label>
                <select
                  value={geradorSemana}
                  onChange={(e) => setGeradorSemana(e.target.value)}
                  className="w-full rounded-xl border p-3"
                >
                  <option value="1">Semana 1 (Adaptação)</option>
                  <option value="2">Semana 2 (Progressão)</option>
                  <option value="3">Semana 3 (Intensidade)</option>
                  <option value="4">Semana 4 (Deload)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border bg-zinc-50 p-4 text-sm text-zinc-700">
              O gerador ULTRA PRO usa seleção inteligente da biblioteca, melhor
              distribuição muscular, volume mais equilibrado, menos repetição de
              exercícios e periodização por semana. Os treinos antigos podem ser
              desativados sem exclusão.
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={aplicarGeracaoAutomatica}
                disabled={gerandoAutomatico}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-white disabled:opacity-60"
              >
                {gerandoAutomatico ? "Gerando..." : "Gerar treino"}
              </button>

              <button
                type="button"
                onClick={() => setModalGeradorAberto(false)}
                className="flex-1 rounded-xl border py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}