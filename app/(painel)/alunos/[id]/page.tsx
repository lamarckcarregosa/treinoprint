"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

export default function AlunoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

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
      setTelefone(jsonAluno.telefone || "");
      setCpf(jsonAluno.cpf || "");
      setEndereco(jsonAluno.endereco || "");
      setDataNascimento(jsonAluno.data_nascimento || "");
      setPlano(jsonAluno.plano || "");
      setDataMatricula(jsonAluno.data_matricula || "");
      setStatus(jsonAluno.status || "ativo");
      setFotoUrl(jsonAluno.foto_url || "");
      setObjetivo(jsonAluno.objetivo || "");
      setPesoMeta(
        jsonAluno.peso_meta !== null && jsonAluno.peso_meta !== undefined
          ? String(jsonAluno.peso_meta)
          : ""
      );
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

      const res = await apiFetch(`/api/avaliacoes?aluno_id=${aluno.id}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        alert((json as any).error || "Erro ao buscar avaliações");
        return;
      }

      const lista = Array.isArray(json) ? json : [];

      if (lista.length === 0) {
        alert("Este aluno ainda não possui avaliação cadastrada.");
        return;
      }

      const ultima = [...lista].sort((a: any, b: any) =>
        String(b.data_avaliacao || "").localeCompare(
          String(a.data_avaliacao || "")
        )
      )[0];

      setMenuAval(false);
      router.push(`/avaliacoes/${ultima.id}`);
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

      const res = await apiFetch(`/api/alunos/${aluno.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          telefone,
          cpf,
          endereco,
          data_nascimento: dataNascimento || null,
          plano,
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

      setSalvandoAluno(true);

      const res = await apiFetch(`/api/alunos/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          cpf: cpf.trim(),
          endereco: endereco.trim(),
          data_nascimento: dataNascimento || null,
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
        .filter((p) => p.status === "pendente")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0),
    [pagamentos]
  );

  const totalPagamentos = pagamentos.length;

  if (loading) return <p className="p-6">Carregando aluno...</p>;
  if (erro) return <p className="p-6 text-red-600">{erro}</p>;
  if (!aluno) return <p className="p-6">Aluno não encontrado.</p>;

  return (
    <div className="space-y-6 print:space-y-4">
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div>
          <h1 className="text-3xl font-black">Ficha do aluno</h1>
          <p className="text-gray-500 mt-2">
            Dados cadastrais, financeiro e treinos
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative" ref={menuAvalRef}>
            <button
              type="button"
              onClick={() => setMenuAval((v) => !v)}
              className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-3"
            >
              <Activity size={16} />
              Avaliação física
              <ChevronDown size={15} />
            </button>

            {menuAval && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden z-50">
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
            className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-4 py-3"
          >
            <IdCard size={16} />
            Carteirinha
          </button>

          <button
            onClick={() => setEditando((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-3"
          >
            <UserRoundPen size={16} />
            {editando ? "Cancelar edição" : "Editar aluno"}
          </button>

          <button
            onClick={imprimirFicha}
            className="flex items-center gap-2 bg-zinc-800 text-white rounded-xl px-4 py-3"
          >
            <Printer size={16} />
            Imprimir ficha
          </button>

          <button
            onClick={() => router.push("/alunos")}
            className="flex items-center gap-2 bg-black text-white rounded-xl px-2 py-3"
          >
            <Undo2 size={16} />
            Voltar
          </button>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow print-card">
        {!editando ? (
          <div className="flex flex-col md:flex-row gap-6">
            <div>
              {aluno.foto_url ? (
                <img
                  src={aluno.foto_url}
                  alt={aluno.nome}
                  className="w-28 h-28 rounded-full object-cover border"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border">
                  Sem foto
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 text-sm">
              <p>
                <strong>Nome:</strong> {aluno.nome}
              </p>
              <p>
                <strong>Telefone:</strong> {aluno.telefone || "-"}
              </p>
              <p>
                <strong>CPF:</strong> {aluno.cpf || "-"}
              </p>
              <p>
                <strong>Plano:</strong> {aluno.plano || "-"}
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
                className="border rounded-xl p-3 w-full"
              />
              {enviandoFoto ? (
                <p className="text-sm text-gray-500">Enviando foto...</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome"
                className="border rounded-xl p-3"
              />

              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Telefone"
                className="border rounded-xl p-3"
              />

              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="CPF"
                className="border rounded-xl p-3"
              />

              <input
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Endereço"
                className="border rounded-xl p-3"
              />

              <input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                className="border rounded-xl p-3"
              />

              <input
                type="date"
                value={dataMatricula}
                onChange={(e) => setDataMatricula(e.target.value)}
                className="border rounded-xl p-3"
              />

              <select
                value={plano}
                onChange={(e) => setPlano(e.target.value)}
                className="border rounded-xl p-3"
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
                className="border rounded-xl p-3"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>

              <input
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="URL da foto"
                className="border rounded-xl p-3"
              />

              <input
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Objetivo do aluno"
                className="border rounded-xl p-3"
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
                  className="border rounded-xl p-3 pl-10 w-full"
                />
              </div>
            </div>

            <button
              onClick={salvarAluno}
              disabled={salvandoAluno}
              className="bg-green-600 text-white px-5 py-3 rounded-xl disabled:opacity-60"
            >
              {salvandoAluno ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow p-5 border border-black/5 print-card">
          <p className="text-sm text-gray-500">Total pago</p>
          <p className="text-2xl font-black mt-2 text-green-600">
            {formatBRL(totalPago)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5 print-card">
          <p className="text-sm text-gray-500">Em aberto</p>
          <p className="text-2xl font-black mt-2 text-yellow-600">
            {formatBRL(totalEmAberto)}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 border border-black/5 print-card">
          <p className="text-sm text-gray-500">Mensalidades</p>
          <p className="text-2xl font-black mt-2 text-blue-600">
            {totalPagamentos}
          </p>
        </div>
      </div>

      <section className="bg-white p-6 rounded-2xl shadow print-card">
        <h2 className="font-semibold mb-4">Histórico financeiro</h2>

        {pagamentos.length === 0 ? (
          <p className="text-gray-500">Nenhuma mensalidade encontrada.</p>
        ) : (
          <div className="space-y-3">
            {pagamentos.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      item.status === "pago"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {item.status}
                  </span>

                  <p className="font-bold">{formatBRL(item.valor)}</p>

                  {item.status === "pago" ? (
                    <button
                      onClick={() => abrirComprovante(item.id)}
                      className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-2 py-3"
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
      </section>

      <section className="bg-white p-6 rounded-2xl shadow print-card">
        <h2 className="font-semibold mb-4">Treinos impressos recentes</h2>

        {impressoes.length === 0 ? (
          <p className="text-gray-500">Nenhum treino impresso encontrado.</p>
        ) : (
          <div className="space-y-3">
            {impressoes.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
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
      </section>
    </div>
  );
}