"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import PageContainer from "@/components/layout/PageContainer";
import SectionCard from "@/components/common/SectionCard";
import StatusBadge from "@/components/common/StatusBadge";
import {
  formatarTelefoneDigitacao,
  formatarTelefoneExibicao,
  normalizarTelefoneBR,
  telefoneBRValido,
} from "@/lib/telefone";

import {
  ChartColumnBig,
  IdCard,
  Activity,
  UserRoundPen,
  Printer,
  Undo2,
  Receipt,
  Target,
  ChevronDown,
  History,
  PlusCircle,
  PencilRuler,
} from "lucide-react";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string;
  cpf?: string;
  endereco?: string;
  data_nascimento?: string;
  plano?: string;
  data_matricula?: string;
  status?: string;
  foto_url?: string;
  objetivo?: string;
  peso_meta?: number | string;
  sexo?: string;
  created_at?: string;
};

type Pagamento = {
  id: number;
  competencia: string;
  valor: number;
  vencimento: string;
  data_pagamento?: string | null;
  status: string;
  forma_pagamento?: string | null;
};

type Impressao = {
  id: number;
  dia?: string;
  nivel?: string;
  personal_nome?: string;
  created_at: string;
};

type HistoricoTreino = {
  id: number;
  aluno_id?: number | null;
  aluno_nome?: string | null;
  personal_nome?: string | null;
  semana?: string | null;
  dia?: string | null;
  nivel?: string | null;
  tipo?: string | null;
  exercicios?: any[] | null;
  created_at: string;
  origem?: string | null;
  codigo_treino?: string | null;
  treino_personalizado_id?: number | null;
  titulo?: string | null;
  objetivo?: string | null;
  observacoes?: string | null;
  divisao?: string | null;
  frequencia_semana?: number | null;
  origem_geracao?: string | null;
  versao_treino?: number | null;
};

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, {
    ...init,
    headers,
  });
}

function formatBRL(valor: number | undefined) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatData(data?: string | null) {
  if (!data) return "-";

  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(data);
  const dt = isDateOnly ? new Date(`${data}T00:00:00`) : new Date(data);

  if (Number.isNaN(dt.getTime())) return data;

  return dt.toLocaleDateString("pt-BR");
}

function formatDataHora(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR");
}

export default function AlunoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [sexo, setSexo] = useState("masculino");

  const [erroTelefone, setErroTelefone] = useState("");

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [impressoes, setImpressoes] = useState<Impressao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [menuAval, setMenuAval] = useState(false);
  const menuAvalRef = useRef<HTMLDivElement | null>(null);

  const [editando, setEditando] = useState(false);
  const [salvandoAluno, setSalvandoAluno] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [plano, setPlano] = useState("");
  const [dataMatricula, setDataMatricula] = useState("");
  const [status, setStatus] = useState("ativo");
  const [fotoUrl, setFotoUrl] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [pesoMeta, setPesoMeta] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [historicoTreinos, setHistoricoTreinos] = useState<HistoricoTreino[]>(
    []
  );
  const [carregandoHistoricoTreinos, setCarregandoHistoricoTreinos] =
    useState(false);

  const carregarHistoricoTreinos = async (alunoId: number) => {
    try {
      setCarregandoHistoricoTreinos(true);

      const res = await apiFetch(
        `/api/alunos/${alunoId}/historico-treinos?limit=6`,
        {
          cache: "no-store",
        }
      );

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        console.error(
          (json as any).error || "Erro ao carregar histórico de treinos"
        );
        setHistoricoTreinos([]);
        return;
      }

      setHistoricoTreinos(Array.isArray(json) ? json : []);
    } catch (error) {
      console.error("Erro ao carregar histórico de treinos:", error);
      setHistoricoTreinos([]);
    } finally {
      setCarregandoHistoricoTreinos(false);
    }
  };

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");

      const [resAluno, resPagamentos, resImpressoes] = await Promise.all([
        apiFetch(`/api/alunos/${id}`, { cache: "no-store" }),
        apiFetch(`/api/alunos/${id}/pagamentos`, { cache: "no-store" }),
        apiFetch(`/api/alunos/${id}/impressoes`, { cache: "no-store" }),
      ]);

      const jsonAluno = await resAluno.json().catch(() => ({}));
      const jsonPagamentos = await resPagamentos.json().catch(() => []);
      const jsonImpressoes = await resImpressoes.json().catch(() => []);

      if (!resAluno.ok) {
        setErro(jsonAluno.error || "Erro ao carregar aluno");
        return;
      }

      if (!resPagamentos.ok) {
        setErro(jsonPagamentos.error || "Erro ao carregar pagamentos do aluno");
        return;
      }

      if (!resImpressoes.ok) {
        setErro(jsonImpressoes.error || "Erro ao carregar treinos do aluno");
        return;
      }

      setAluno(jsonAluno);
      setPagamentos(Array.isArray(jsonPagamentos) ? jsonPagamentos : []);
      setImpressoes(Array.isArray(jsonImpressoes) ? jsonImpressoes : []);

      setNome(jsonAluno.nome || "");
      setTelefone(formatarTelefoneExibicao(jsonAluno.telefone || ""));
      setCpf(jsonAluno.cpf || "");
      setEndereco(jsonAluno.endereco || "");
      setDataNascimento(jsonAluno.data_nascimento || "");
      setPlano(jsonAluno.plano || "");
      setDataMatricula(jsonAluno.data_matricula || "");
      setStatus(jsonAluno.status || "ativo");
      setFotoUrl(jsonAluno.foto_url || "");
      setObjetivo(jsonAluno.objetivo || "");
      setSexo(jsonAluno.sexo || "masculino");
      setPesoMeta(
        jsonAluno.peso_meta !== null && jsonAluno.peso_meta !== undefined
          ? String(jsonAluno.peso_meta)
          : ""
      );

      if (jsonAluno?.id) {
        await carregarHistoricoTreinos(Number(jsonAluno.id));
      } else if (id) {
        await carregarHistoricoTreinos(Number(id));
      }
    } catch {
      setErro("Erro ao carregar ficha do aluno");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [id]);

  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (!menuAvalRef.current) return;
      if (!menuAvalRef.current.contains(event.target as Node)) {
        setMenuAval(false);
      }
    };

    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);

  const abrirUltimaAvaliacao = async () => {
  try {
    if (!aluno) return;

    const res = await apiFetch(`/api/alunos/${aluno.id}/ultima-avaliacao`, {
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json?.error || "Erro ao buscar última avaliação");
      return;
    }

    setMenuAval(false);
    router.push(`/avaliacoes/${json.id}`);
  } catch {
    alert("Erro ao buscar avaliação");
  }
};

  const uploadFoto = async (file: File) => {
    try {
      if (!aluno) return;

      setEnviandoFoto(true);

      const extensao = file.name.split(".").pop() || "jpg";
      const nomeArquivo = `aluno-${aluno.id}-${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("alunos")
        .upload(nomeArquivo, file, {
          upsert: true,
        });

      if (uploadError) {
        alert(uploadError.message || "Erro ao enviar foto");
        return;
      }

      const { data } = supabase.storage.from("alunos").getPublicUrl(nomeArquivo);

      const urlFoto = data.publicUrl;
const telefoneNormalizado = telefone.trim()
  ? normalizarTelefoneBR(telefone)
  : "";

if (telefone.trim() && !telefoneBRValido(telefone)) {
  setErroTelefone("Informe um celular válido com DDD.");
  alert("Informe um telefone válido antes de salvar a foto.");
  return;
}

const res = await apiFetch(`/api/alunos/${aluno.id}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    nome,
    telefone: telefoneNormalizado || null,
    cpf,
    endereco,
    data_nascimento: dataNascimento || null,
    plano,
    sexo,
    data_matricula: dataMatricula || null,
    status,
    foto_url: urlFoto,
    objetivo,
    peso_meta: pesoMeta ? Number(pesoMeta) : null,
  }),
});

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(json.error || "Erro ao salvar foto no aluno");
        return;
      }

      setFotoUrl(urlFoto);
      await carregar();
      alert("Foto enviada com sucesso");
    } finally {
      setEnviandoFoto(false);
    }
  };

 const salvarAluno = async () => {
  try {
    if (!nome.trim()) {
      alert("Nome é obrigatório");
      return;
    }

    const telefoneNormalizado = telefone.trim()
      ? normalizarTelefoneBR(telefone)
      : "";

    if (telefone.trim() && !telefoneBRValido(telefone)) {
      setErroTelefone("Informe um celular válido com DDD.");
      alert("Informe um telefone válido.");
      return;
    }

    setErroTelefone("");
    setSalvandoAluno(true);

    const res = await apiFetch(`/api/alunos/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome: nome.trim(),
        telefone: telefoneNormalizado || null,
        cpf: cpf.trim(),
        endereco: endereco.trim(),
        data_nascimento: dataNascimento || null,
        sexo: sexo.trim(),
        plano: plano.trim(),
        data_matricula: dataMatricula || null,
        status: status.trim(),
        foto_url: fotoUrl.trim(),
        objetivo: objetivo.trim(),
        peso_meta: pesoMeta ? Number(pesoMeta) : null,
      }),
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Erro ao atualizar aluno:", json);
      alert(json.error || JSON.stringify(json) || "Erro ao atualizar aluno");
      return;
    }

    setEditando(false);
    await carregar();
    alert("Aluno atualizado com sucesso");
  } finally {
    setSalvandoAluno(false);
  }
};

  const imprimirFicha = () => {
    router.push(`/alunos/${id}/imprimir`);
  };

  const abrirComprovante = (pagamentoId: number) => {
    window.open(`/financeiro/comprovante/${pagamentoId}`, "_blank");
  };

  const totalPago = useMemo(
    () =>
      pagamentos
        .filter((p) => p.status === "pago")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [pagamentos]
  );

  const totalEmAberto = useMemo(
    () =>
      pagamentos
        .filter((p) => p.status === "pendente" || p.status === "vencido")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [pagamentos]
  );

  const totalPagamentos = pagamentos.length;

  const statusAlunoBadge = useMemo(() => {
    const st = String(aluno?.status || "").toLowerCase();
    if (st === "ativo") return <StatusBadge label="Ativo" variant="success" />;
    if (st === "inativo") return <StatusBadge label="Inativo" variant="neutral" />;
    return <StatusBadge label={aluno?.status || "Sem status"} variant="neutral" />;
  }, [aluno]);

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <SectionCard>
          <p className="text-sm text-zinc-500">Carregando aluno...</p>
        </SectionCard>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="w-full space-y-6">
        <SectionCard title="Erro">
          <p className="text-red-600">{erro}</p>
        </SectionCard>
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="w-full space-y-6">
        <SectionCard>
          <p>Aluno não encontrado.</p>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          aside,
          nav,
          button,
          .no-print {
            display: none !important;
          }
          main,
          section,
          div {
            box-shadow: none !important;
          }
          .print-card {
            border: 1px solid #ddd !important;
          }
        }
      `}</style>

      <PageContainer
        title={aluno.nome}
        subtitle="Ficha do aluno, financeiro, treinos e histórico."
        rightContent={
          <div className="flex flex-wrap items-center gap-2">
            {statusAlunoBadge}
          </div>
        }
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap no-print">
          <button
            onClick={() => router.push(`/alunos/${aluno.id}/treino-personalizado`)}
            className="rounded-xl bg-violet-600 px-4 py-3 text-white flex items-center gap-2"
          >
            <PencilRuler size={16} />
            Treino personalizado
          </button>

          <div className="relative" ref={menuAvalRef}>
            <button
              type="button"
              onClick={() => setMenuAval((v) => !v)}
              className="flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-white"
            >
              <Activity size={16} />
              Avaliação física
              <ChevronDown size={15} />
            </button>

            {menuAval && (
              <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMenuAval(false);
                    router.push(`/avaliacoes/nova?aluno_id=${aluno.id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition"
                >
                  <PlusCircle size={16} />
                  Nova avaliação
                </button>

                <button
                  type="button"
                  onClick={abrirUltimaAvaliacao}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition"
                >
                  <Activity size={16} />
                  Última avaliação
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAval(false);
                    router.push(`/avaliacoes/historico?aluno_id=${aluno.id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition"
                >
                  <History size={16} />
                  Histórico de avaliações
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMenuAval(false);
                    router.push(
                      `/alunos/${aluno.id}/evolucao?meta=${encodeURIComponent(
                        objetivo || "geral"
                      )}`
                    );
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition"
                >
                  <ChartColumnBig size={16} />
                  Dashboard corporal
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.push(`/alunos/${id}/carteirinha`)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white"
          >
            <IdCard size={16} />
            Carteirinha
          </button>

          <button
            onClick={() => setEditando((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-white"
          >
            <UserRoundPen size={16} />
            {editando ? "Cancelar edição" : "Editar aluno"}
          </button>

          <button
            onClick={imprimirFicha}
            className="flex items-center gap-2 rounded-xl bg-zinc-800 px-4 py-3 text-white"
          >
            <Printer size={16} />
            Imprimir ficha
          </button>

          <button
            onClick={() => router.push("/alunos")}
            className="flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-white"
          >
            <Undo2 size={16} />
            Voltar
          </button>
        </div>

        <SectionCard className="print-card">
          {!editando ? (
            <div className="flex flex-col gap-6 md:flex-row">
              <div>
                {aluno.foto_url ? (
                  <img
                    src={aluno.foto_url}
                    alt={aluno.nome}
                    className="h-28 w-28 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full border bg-gray-200 text-gray-500">
                    Sem foto
                  </div>
                )}
              </div>

              <div className="grid flex-1 grid-cols-1 gap-3 text-sm md:grid-cols-2">
                <p>
                  <strong>Nome:</strong> {aluno.nome}
                </p>
                <p>
                  <strong>Telefone:</strong> {formatarTelefoneExibicao(aluno.telefone)}
                </p>
                <p>
                  <strong>CPF:</strong> {aluno.cpf || "-"}
                </p>
                <p>
                  <strong>Plano:</strong> {aluno.plano || "-"}
                </p>
                <p>
                  <strong>Sexo:</strong> {aluno.sexo || "-"}
                </p>
                <p>
                  <strong>Status:</strong> {aluno.status || "-"}
                </p>
                <p>
                  <strong>Nascimento:</strong> {formatData(aluno.data_nascimento)}
                </p>
                <p>
                  <strong>Matrícula:</strong> {formatData(aluno.data_matricula)}
                </p>
                <p>
                  <strong>Endereço:</strong> {aluno.endereco || "-"}
                </p>
                <p>
                  <strong>Objetivo:</strong> {aluno.objetivo || "-"}
                </p>
                <p>
                  <strong>Peso meta:</strong>{" "}
                  {aluno.peso_meta ? `${aluno.peso_meta} kg` : "-"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 no-print">
              <h2 className="text-xl font-bold">Editar aluno</h2>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-600">
                  Upload da foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFoto(file);
                  }}
                  className="w-full rounded-xl border p-3"
                />
                {enviandoFoto ? (
                  <p className="text-sm text-gray-500">Enviando foto...</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  className="rounded-xl border p-3"
                />

                <div className="space-y-1">
  <input
    value={telefone}
    onChange={(e) => {
      const formatado = formatarTelefoneDigitacao(e.target.value);
      setTelefone(formatado);

      if (erroTelefone) {
        setErroTelefone("");
      }
    }}
    onBlur={() => {
      if (telefone.trim() && !telefoneBRValido(telefone)) {
        setErroTelefone("Informe um celular válido com DDD.");
      } else {
        setErroTelefone("");
      }
    }}
    placeholder="Telefone"
    className={`rounded-xl border p-3 w-full ${
      erroTelefone ? "border-red-500" : ""
    }`}
  />
  {erroTelefone ? (
    <p className="text-sm text-red-600">{erroTelefone}</p>
  ) : null}
</div>

                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="CPF"
                  className="rounded-xl border p-3"
                />

                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  className="rounded-xl border p-3"
                />

                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="rounded-xl border p-3"
                />

                <input
                  type="date"
                  value={dataMatricula}
                  onChange={(e) => setDataMatricula(e.target.value)}
                  className="rounded-xl border p-3"
                />
<select
  value={sexo}
  onChange={(e) => setSexo(e.target.value)}
  className="rounded-xl border p-3"
>
  <option value="masculino">Masculino</option>
  <option value="feminino">Feminino</option>
</select>
                <select
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option value="">Plano</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-xl border p-3"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                <input
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="URL da foto"
                  className="rounded-xl border p-3"
                />

                <input
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="Objetivo do aluno"
                  className="rounded-xl border p-3"
                />

                <div className="relative">
                  <Target
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={pesoMeta}
                    onChange={(e) => setPesoMeta(e.target.value)}
                    placeholder="Peso meta (kg)"
                    className="w-full rounded-xl border p-3 pl-10"
                  />
                </div>
              </div>

              <button
                onClick={salvarAluno}
                disabled={salvandoAluno}
                className="rounded-xl bg-green-600 px-5 py-3 text-white disabled:opacity-60"
              >
                {salvandoAluno ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SectionCard className="print-card">
            <p className="text-sm text-gray-500">Total pago</p>
            <p className="mt-2 text-2xl font-black text-green-600">
              {formatBRL(totalPago)}
            </p>
          </SectionCard>

          <SectionCard className="print-card">
            <p className="text-sm text-gray-500">Em aberto</p>
            <p className="mt-2 text-2xl font-black text-yellow-600">
              {formatBRL(totalEmAberto)}
            </p>
          </SectionCard>

          <SectionCard className="print-card">
            <p className="text-sm text-gray-500">Mensalidades</p>
            <p className="mt-2 text-2xl font-black text-blue-600">
              {totalPagamentos}
            </p>
          </SectionCard>
        </div>

        <SectionCard title="Histórico financeiro" className="print-card">
          {pagamentos.length === 0 ? (
            <p className="text-gray-500">Nenhuma mensalidade encontrada.</p>
          ) : (
            <div className="space-y-3">
              {pagamentos.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      Competência: {item.competencia}
                    </p>
                    <p className="text-sm text-gray-600">
                      Vencimento: {formatData(item.vencimento)}
                    </p>
                    <p className="text-sm text-gray-600">Status: {item.status}</p>

                    {item.forma_pagamento ? (
                      <p className="text-sm text-blue-600">
                        Forma de pagamento: {item.forma_pagamento}
                      </p>
                    ) : null}

                    {item.data_pagamento ? (
                      <p className="text-sm text-green-600">
                        Pago em: {formatData(item.data_pagamento)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === "pago"
                          ? "bg-green-100 text-green-700"
                          : item.status === "vencido"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {item.status}
                    </span>

                    <p className="font-bold">{formatBRL(item.valor)}</p>

                    {item.status === "pago" ? (
                      <button
                        onClick={() => abrirComprovante(item.id)}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white"
                      >
                        <Receipt size={16} />
                        Comprovante
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Treinos impressos recentes" className="print-card">
          <div className="max-h-[320px] overflow-y-auto pr-2">
            {impressoes.length === 0 ? (
              <p className="text-gray-500">Nenhum treino impresso encontrado.</p>
            ) : (
              <div className="space-y-3">
                {impressoes.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold">Treino: {item.dia || "-"}</p>
                      <p className="text-sm text-gray-600">
                        Nível: {item.nivel || "-"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Personal: {item.personal_nome || "-"}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Histórico de versões do treino"
          rightContent={
            <button
              type="button"
              onClick={() => carregarHistoricoTreinos(Number(aluno.id))}
              className="rounded-xl border px-4 py-2 text-sm no-print"
            >
              Atualizar
            </button>
          }
          className="print-card"
        >
          {carregandoHistoricoTreinos ? (
            <p className="text-gray-500">Carregando histórico...</p>
          ) : historicoTreinos.length === 0 ? (
            <p className="text-gray-500">Nenhum histórico de treino encontrado.</p>
          ) : (
            <div className="max-h-[400px] space-y-3 overflow-y-auto pr-2">
              {historicoTreinos.map((item) => {
                const totalExercicios = Array.isArray(item.exercicios)
                  ? item.exercicios.length
                  : 0;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-gray-900">
                          {item.titulo || `Treino ${item.codigo_treino || "-"}`}
                        </p>

                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                          Versão {item.versao_treino || 1}
                        </span>

                        {item.origem ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                            {item.origem}
                          </span>
                        ) : null}
                      </div>

                      <p className="text-sm text-gray-600">
                        Código: {item.codigo_treino || "-"} • Dia: {item.dia || "-"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Objetivo: {item.objetivo || "-"} • Divisão:{" "}
                        {item.divisao || "-"}
                      </p>

                      <p className="text-sm text-gray-600">
                        Nível: {item.nivel || "-"} • Frequência:{" "}
                        {item.frequencia_semana || "-"}x/semana
                      </p>

                      <p className="text-sm text-gray-600">
                        Personal: {item.personal_nome || "-"}
                      </p>

                      <p className="text-xs text-gray-500">
                        {totalExercicios} exercício(s) •{" "}
                        {formatDataHora(item.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 no-print">
                      <button
                        type="button"
                        onClick={() => {
                          alert(
                            Array.isArray(item.exercicios)
                              ? item.exercicios
                                  .map(
                                    (ex: any, idx: number) =>
                                      `${idx + 1}. ${
                                        ex.nome_exercicio_snapshot ||
                                        ex.nome ||
                                        "-"
                                      }`
                                  )
                                  .join("\n")
                              : "Nenhum exercício encontrado"
                          );
                        }}
                        className="rounded-xl bg-zinc-800 px-4 py-2 text-white"
                      >
                        Ver exercícios
                      </button>

                      {item.treino_personalizado_id ? (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/alunos/${aluno.id}/treino-personalizado`)
                          }
                          className="rounded-xl bg-blue-600 px-4 py-2 text-white"
                        >
                          Abrir treino
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </PageContainer>
    </div>
  );
}