"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Aluno = {
  id: number;
  nome: string;
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  cpf?: string;
  plano?: string;
  data_matricula?: string;
  status?: string;
  foto_url?: string;
};

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, { ...init, headers });
}

export default function AlunosPage() {
  const router = useRouter();

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [plano, setPlano] = useState("");
  const [dataMatricula, setDataMatricula] = useState("");
  const [status, setStatus] = useState("ativo");
  const [fotoUrl, setFotoUrl] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregarAlunos = async () => {
    try {
      setErro("");

      const res = await apiFetch("/api/alunos", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro(json.error || "Erro ao carregar alunos");
        return;
      }

      setAlunos(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar alunos");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregarAlunos();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const limpar = () => {
    setNome("");
    setTelefone("");
    setCpf("");
    setEndereco("");
    setDataNascimento("");
    setPlano("");
    setDataMatricula("");
    setStatus("ativo");
    setFotoUrl("");
    setEditandoId(null);
  };

  const salvar = async () => {
    try {
      setErro("");

      if (!nome) {
        setErro("Nome é obrigatório");
        return;
      }

      setSalvando(true);

      const payload = {
        nome,
        telefone,
        cpf,
        endereco,
        data_nascimento: dataNascimento,
        plano,
        data_matricula: dataMatricula,
        status,
        foto_url: fotoUrl,
      };

      const res = await apiFetch(
        editandoId ? `/api/alunos/${editandoId}` : "/api/alunos",
        {
          method: editandoId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao salvar aluno");
        return;
      }

      limpar();
      await carregarAlunos();
    } finally {
      setSalvando(false);
    }
  };

  const editar = (aluno: Aluno) => {
    setEditandoId(aluno.id);
    setNome(aluno.nome || "");
    setTelefone(aluno.telefone || "");
    setCpf(aluno.cpf || "");
    setEndereco(aluno.endereco || "");
    setDataNascimento(aluno.data_nascimento || "");
    setPlano(aluno.plano || "");
    setDataMatricula(aluno.data_matricula || "");
    setStatus(aluno.status || "ativo");
    setFotoUrl(aluno.foto_url || "");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const excluir = async (id: number) => {
    const confirmar = confirm("Excluir aluno?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/alunos/${id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(json.error || "Erro ao excluir aluno");
      return;
    }

    await carregarAlunos();
  };

  if (loading) {
    return <p className="p-6">Carregando alunos...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black">Alunos</h1>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-semibold">
          {editandoId ? "Editar aluno" : "Novo aluno"}
        </h2>

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

        {erro && <p className="text-red-600 text-sm">{erro}</p>}

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-blue-600 text-white rounded-xl px-5 py-3"
        >
          {editandoId ? "Atualizar" : "Cadastrar"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-semibold mb-4">Lista de alunos</h2>

        <div className="space-y-3">
          {alunos.map((aluno) => (
            <div
              key={aluno.id}
              className="border rounded-2xl p-4 flex justify-between items-center"
            >
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => router.push(`/alunos/${aluno.id}`)}
              >
                {aluno.foto_url && (
                  <img
                    src={aluno.foto_url}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                )}

                <div>
                  <p className="font-bold">{aluno.nome}</p>

                  <p className="text-sm text-gray-600">
                    Plano: {aluno.plano || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Telefone: {aluno.telefone || "-"}
                  </p>

                  <p className="text-sm text-gray-600">
                    Status: {aluno.status}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/alunos/${aluno.id}`)}
                  className="text-sm text-black"
                >
                  Ver ficha
                </button>

                <button
                  onClick={() => editar(aluno)}
                  className="text-sm text-blue-600"
                >
                  Editar
                </button>

                <button
                  onClick={() => excluir(aluno.id)}
                  className="text-sm text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}