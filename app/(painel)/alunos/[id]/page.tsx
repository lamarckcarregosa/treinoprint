"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const dt = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

export default function AlunoPage() {
  const params = useParams();
  const router = useRouter();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [impressoes, setImpressoes] = useState<Impressao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

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
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");

      const id = String(params.id);

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
    } catch {
      setErro("Erro ao carregar ficha do aluno");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const uploadFoto = async (file: File) => {
  try {
    if (!aluno) return;

    setEnviandoFoto(true);

    const extensao = file.name.split(".").pop();
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

      const res = await apiFetch(`/api/alunos/${String(params.id)}`, {
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
  router.push(`/alunos/${String(params.id)}/imprimir`);
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
          <button
            onClick={() => setEditando((v) => !v)}
            className="bg-blue-600 text-white px-5 py-3 rounded-xl"
          >
            {editando ? "Cancelar edição" : "Editar aluno"}
          </button>

          <button
            onClick={imprimirFicha}
            className="bg-zinc-800 text-white px-5 py-3 rounded-xl"
          >
            Imprimir ficha
          </button>

          <button
            onClick={() => router.push("/alunos")}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
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
              <p><strong>Nome:</strong> {aluno.nome}</p>
              <p><strong>Telefone:</strong> {aluno.telefone || "-"}</p>
              <p><strong>CPF:</strong> {aluno.cpf || "-"}</p>
              <p><strong>Plano:</strong> {aluno.plano || "-"}</p>
              <p><strong>Status:</strong> {aluno.status || "-"}</p>
              <p><strong>Nascimento:</strong> {formatData(aluno.data_nascimento)}</p>
              <p><strong>Matrícula:</strong> {formatData(aluno.data_matricula)}</p>
              <p><strong>Endereço:</strong> {aluno.endereco || "-"}</p>
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
                  <p className="font-semibold">Competência: {item.competencia}</p>
                  <p className="text-sm text-gray-600">
                    Vencimento: {formatData(item.vencimento)}
                  </p>
                  <p className="text-sm text-gray-600">Status: {item.status}</p>
                  {item.forma_pagamento ? (
                    <p className="text-sm text-blue-600">
                      Forma de pagamento: {item.forma_pagamento}
                    </p>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="font-bold">{formatBRL(item.valor)}</p>
                  {item.data_pagamento ? (
                    <p className="text-sm text-green-600">
                      Pago em: {formatData(item.data_pagamento)}
                    </p>
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
                  <p className="text-sm text-gray-600">Nível: {item.nivel || "-"}</p>
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
