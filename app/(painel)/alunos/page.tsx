"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Activity } from "lucide-react";
import SystemLoader from "@/components/SystemLoader";
import SystemError from "@/components/SystemError";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string | null;
  endereco?: string | null;
  data_nascimento?: string | null;
  cpf?: string | null;
  plano?: string | null;
  data_matricula?: string | null;
  status?: string | null;
  foto_url?: string | null;
  created_at?: string | null;
};

type ResumoAlunos = {
  plano?: string;
  limite_alunos?: number | null;
  total_alunos?: number;
  ativa?: boolean;
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

function formatData(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(data);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("pt-BR");
}

export default function AlunosPage() {
  const router = useRouter();
  const hoje = new Date().toISOString().slice(0, 10);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [resumo, setResumo] = useState<ResumoAlunos | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [plano, setPlano] = useState("mensal");
  const [dataMatricula, setDataMatricula] = useState(hoje);
  const [status, setStatus] = useState("ativo");
  const [fotoUrl, setFotoUrl] = useState("");

  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [ordenacao, setOrdenacao] = useState("nome_asc");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [abrirNovoAluno, setAbrirNovoAluno] = useState(false);

  const carregarTudo = async () => {
    try {
      setErro("");

      const [resAlunos, resResumo] = await Promise.all([
        apiFetch("/api/alunos", { cache: "no-store" }),
        apiFetch("/api/alunos/resumo", { cache: "no-store" }),
      ]);

      const jsonAlunos = await resAlunos.json().catch(() => []);
      const jsonResumo = await resResumo.json().catch(() => ({}));

      if (!resAlunos.ok) {
        setErro((jsonAlunos as any).error || "Erro ao carregar alunos");
        return;
      }

      if (!resResumo.ok) {
        setErro((jsonResumo as any).error || "Erro ao carregar resumo");
        return;
      }

      setAlunos(Array.isArray(jsonAlunos) ? jsonAlunos : []);
      setResumo(jsonResumo);
    } catch {
      setErro("Erro ao carregar alunos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const limparFormulario = () => {
    setNome("");
    setTelefone("");
    setEndereco("");
    setDataNascimento("");
    setCpf("");
    setPlano("mensal");
    setDataMatricula(new Date().toISOString().slice(0, 10));
    setStatus("ativo");
    setFotoUrl("");
  };

  const uploadFotoAluno = async (file: File) => {
    try {
      setEnviandoFoto(true);
      setErro("");

      const academiaId = localStorage.getItem("treinoprint_academia_id");
      if (!academiaId) {
        setErro("Academia não encontrada para upload");
        return;
      }

      const extensao = file.name.split(".").pop() || "jpg";
      const nomeArquivo = `${academiaId}/aluno-${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("alunos")
        .upload(nomeArquivo, file, {
          upsert: true,
        });

      if (uploadError) {
        setErro(uploadError.message || "Erro ao enviar foto");
        return;
      }

      const { data } = supabase.storage.from("alunos").getPublicUrl(nomeArquivo);

      setFotoUrl(data.publicUrl);
    } catch (error: any) {
      setErro(error?.message || "Erro ao enviar foto");
    } finally {
      setEnviandoFoto(false);
    }
  };

  const cadastrarAluno = async () => {
    try {
      setErro("");

      if (!nome.trim()) {
        setErro("Informe o nome do aluno");
        return;
      }

      setSalvando(true);

      const res = await apiFetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
          data_nascimento: dataNascimento ? dataNascimento : null,
          cpf: cpf.trim(),
          plano: plano.trim(),
          data_matricula: dataMatricula ? dataMatricula : null,
          status: status.trim(),
          foto_url: fotoUrl.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao cadastrar aluno");
        return;
      }

      limparFormulario();
      await carregarTudo();
    } finally {
      setSalvando(false);
    }
  };

  const excluirAluno = async (id: number) => {
    const confirmar = confirm("Deseja excluir este aluno?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/alunos/${id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao excluir aluno");
      return;
    }

    await carregarTudo();
  };

  const exportarExcel = () => {
    const academiaId = localStorage.getItem("treinoprint_academia_id");

    const params = new URLSearchParams();
    if (busca.trim()) params.set("busca", busca.trim());
    if (filtroStatus !== "todos") params.set("status", filtroStatus);
    if (academiaId) params.set("academia_id", academiaId);

    const url = `/api/alunos/exportar-excel?${params.toString()}`;
    window.open(url, "_blank");
  };

  const exportarPDF = () => {
    const academiaId = localStorage.getItem("treinoprint_academia_id");

    const params = new URLSearchParams();
    if (busca.trim()) params.set("busca", busca.trim());
    if (filtroStatus !== "todos") params.set("status", filtroStatus);
    if (academiaId) params.set("academia_id", academiaId);

    const url = `/api/alunos/exportar-pdf?${params.toString()}`;
    window.open(url, "_blank");
  };

  const alunosFiltrados = useMemo(() => {
    let lista = [...alunos];

    const termo = busca.trim().toLowerCase();
    if (termo) {
      lista = lista.filter((item) => {
        const nome = (item.nome || "").toLowerCase();
        const telefone = (item.telefone || "").toLowerCase();
        const cpf = (item.cpf || "").toLowerCase();
        const plano = (item.plano || "").toLowerCase();
        return (
          nome.includes(termo) ||
          telefone.includes(termo) ||
          cpf.includes(termo) ||
          plano.includes(termo)
        );
      });
    }

    if (filtroStatus !== "todos") {
      lista = lista.filter(
        (item) => (item.status || "").toLowerCase() === filtroStatus.toLowerCase()
      );
    }

    lista.sort((a, b) => {
      if (ordenacao === "nome_asc") {
        return (a.nome || "").localeCompare(b.nome || "");
      }

      if (ordenacao === "nome_desc") {
        return (b.nome || "").localeCompare(a.nome || "");
      }

      if (ordenacao === "novos") {
        return Number(b.id) - Number(a.id);
      }

      if (ordenacao === "antigos") {
        return Number(a.id) - Number(b.id);
      }

      return 0;
    });

    return lista;
  }, [alunos, busca, filtroStatus, ordenacao]);

  const totalAlunos = resumo?.total_alunos || 0;
  const limiteAlunos = resumo?.limite_alunos ?? null;
  const percentualUso =
    limiteAlunos && limiteAlunos > 0
      ? Math.min((totalAlunos / limiteAlunos) * 100, 100)
      : 0;

  const corBarra =
    percentualUso >= 100
      ? "bg-red-500"
      : percentualUso >= 80
      ? "bg-yellow-500"
      : "bg-green-500";

  if (loading) {
    return (
      <SystemLoader
        titulo="TreinoPrint"
        subtitulo="Carregando alunos..."
      />
    );
  }

  if (erro && alunos.length === 0) {
    return (
      <SystemError
        titulo="Erro ao carregar alunos"
        mensagem={erro || "Não foi possível carregar a página."}
        onTentarNovamente={() => window.location.reload()}
      />
    );
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Bem-vindo ao Alunos
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre e gerencie os alunos da academia.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-3xl px-5 py-4 min-w-[240px]">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-xl font-black mt-1">TreinoPrint Online</p>
            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} />
              Operação ativa
            </div>
          </div>
        </div>
      </section>

      {resumo ? (
        <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Plano atual</p>
              <p className="text-xl font-black text-gray-900">
                {resumo.plano || "-"}
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">Uso de alunos</p>
              <p className="text-xl font-black text-gray-900">
                {limiteAlunos == null ? `${totalAlunos}` : `${totalAlunos}/${limiteAlunos}`}
              </p>
            </div>
          </div>

          {limiteAlunos != null ? (
            <div>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full ${corBarra}`}
                  style={{ width: `${percentualUso}%` }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-2">
                {percentualUso >= 100
                  ? "Limite de alunos atingido."
                  : `${Math.max(limiteAlunos - totalAlunos, 0)} vaga(s) restante(s).`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              Plano sem limite de alunos configurado.
            </p>
          )}

          {resumo.ativa === false ? (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-red-600 text-sm">
                Esta academia está inativa. O cadastro de alunos está bloqueado.
              </p>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Novo aluno</h2>
            <p className="text-sm text-gray-500 mt-1">
              Abra o formulário para cadastrar um novo aluno.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setAbrirNovoAluno((v) => !v)}
            className="bg-black text-white px-5 py-3 rounded-xl"
          >
            {abrirNovoAluno ? "Fechar cadastro" : "Novo aluno"}
          </button>
        </div>

        {abrirNovoAluno ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do aluno"
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

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Data de matrícula
                </label>
                <input
                  type="date"
                  value={dataMatricula}
                  onChange={(e) => setDataMatricula(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Plano
                </label>
                <select
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="mensal">Mensal</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
              

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="border rounded-xl p-3 w-full"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Foto do aluno
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="border rounded-xl p-3 w-full"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFotoAluno(file);
                  }}
                />

                {enviandoFoto ? (
                  <p className="text-sm text-gray-500 mt-2">Enviando foto...</p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  URL da foto
                </label>
                <input
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="URL da foto"
                  className="border rounded-xl p-3 w-full"
                />
              </div>

              {fotoUrl ? (
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-600 mb-2">
                    Pré-visualização
                  </p>
                  <img
                    src={fotoUrl}
                    alt="Pré-visualização"
                    className="w-24 h-24 rounded-2xl object-cover border"
                  />
                </div>
              ) : null}
            </div>

            {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

            <button
              onClick={cadastrarAluno}
              disabled={salvando || resumo?.ativa === false}
              className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Cadastrar aluno"}
            </button>
          </>
        ) : null}
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">Lista de alunos</h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 w-full xl:w-auto">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar aluno"
              className="border rounded-xl p-3"
            />

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="todos">Todos status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>

            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="border rounded-xl p-3"
            >
              <option value="nome_asc">Nome A-Z</option>
              <option value="nome_desc">Nome Z-A</option>
              <option value="novos">Mais novos</option>
              <option value="antigos">Mais antigos</option>
            </select>

            <button
              onClick={exportarExcel}
              className="bg-emerald-600 text-white px-4 py-3 rounded-xl"
            >
              Exportar Excel
            </button>

            <button
              onClick={exportarPDF}
              className="bg-red-600 text-white px-4 py-3 rounded-xl"
            >
              Exportar PDF
            </button>
          </div>
        </div>

        {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

        {alunosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum aluno encontrado.</p>
        ) : (
          <div className="space-y-3">
            {alunosFiltrados.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl p-4 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {item.foto_url ? (
                    <img
                      src={item.foto_url}
                      alt={item.nome}
                      className="w-16 h-16 rounded-2xl object-cover border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border flex items-center justify-center text-xs text-gray-500">
                      Sem foto
                    </div>
                  )}

                  <div>
                    <p className="font-bold text-gray-900">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      Telefone: {item.telefone || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      CPF: {item.cpf || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Plano: {item.plano || "-"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Matrícula: {formatData(item.data_matricula)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Status: {item.status || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => router.push(`/alunos/${item.id}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
                  >
                    Ver ficha
                  </button>

                  <button
                    onClick={() => excluirAluno(item.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}