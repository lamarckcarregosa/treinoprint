"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  ArrowLeft,
  Save,
  Upload,
  UserPlus,
  Target,
  Image as ImageIcon,
} from "lucide-react";

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

export default function NovoAlunoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [plano, setPlano] = useState("");
  const [dataMatricula, setDataMatricula] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState("ativo");
  const [fotoUrl, setFotoUrl] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [pesoMeta, setPesoMeta] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState("");

  const [sexo, setSexo] = useState("");

  const uploadFoto = async (file: File) => {
    try {
      setErro("");
      setEnviandoFoto(true);

      const academiaId = localStorage.getItem("treinoprint_academia_id");
      if (!academiaId) {
        setErro("Academia não identificada.");
        return;
      }

      const extensao = file.name.split(".").pop() || "jpg";
      const nomeArquivo = `${academiaId}/alunos/foto-${Date.now()}.${extensao}`;

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

  const salvar = async () => {
    try {
      setErro("");

      if (!nome.trim()) {
        setErro("Nome do aluno é obrigatório.");
        return;
      }

      setSalvando(true);

      const payload = {
        nome: nome.trim(),
        telefone: telefone.trim() || null,
        cpf: cpf.trim() || null,
        endereco: endereco.trim() || null,
        data_nascimento: dataNascimento || null,
        plano: plano || null,
        data_matricula: dataMatricula || null,
        status: status || "ativo",
        foto_url: fotoUrl.trim() || null,
        objetivo: objetivo.trim() || null,
        peso_meta: pesoMeta ? Number(pesoMeta) : null,
        sexo: sexo || null,
      };

      const res = await apiFetch("/api/alunos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao cadastrar aluno");
        return;
      }

      const novoId = (json as any)?.id || (json as any)?.aluno?.id;

      if (novoId) {
        router.push(`/alunos/${novoId}`);
        return;
      }

      router.push("/alunos");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-300">Cadastro de alunos</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Novo aluno
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre um novo aluno com dados pessoais, plano, objetivo e foto.
            </p>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[260px] bg-white/10 backdrop-blur rounded-3xl px-5 py-4 shrink-0">
            <p className="text-white/60 text-xs">Status do sistema</p>
            <p className="text-lg md:text-xl font-black mt-1">
              TreinoPrint Online
            </p>

            <div className="flex items-center gap-2 text-[#7CFC00] mt-3 text-sm font-semibold">
              <Activity size={16} className="shrink-0" />
              <span className="leading-none">Sistema online</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => router.push("/alunos")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        <button
          onClick={salvar}
          disabled={salvando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 transition disabled:opacity-60"
        >
          <Save size={16} />
          {salvando ? "Salvando..." : "Salvar aluno"}
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              Dados do aluno
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Preencha as informações principais do cadastro.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700">
            <UserPlus size={14} />
            Novo cadastro
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-black/5 p-4 bg-zinc-50">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Foto do aluno
              </p>

              <div className="flex justify-center">
                {fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto do aluno"
                    className="w-32 h-32 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-200 border flex items-center justify-center text-gray-500">
                    <ImageIcon size={28} />
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-600">
                  Upload da foto
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="w-full border rounded-xl p-3"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFoto(file);
                  }}
                />

                {enviandoFoto ? (
                  <p className="text-sm text-gray-500">Enviando foto...</p>
                ) : null}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    URL da foto
                  </label>
                  <input
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full border rounded-xl p-3"
                  />
                </div>

                <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
                  Você pode enviar uma foto ou colar a URL manualmente.
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div className="md:col-span-2 xl:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Nome
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome completo do aluno"
                  className="w-full border rounded-xl p-3"
                />
              </div>
<div>
  <label className="block text-sm font-semibold text-gray-600 mb-1">
    Sexo
  </label>
  <select
    value={sexo}
    onChange={(e) => setSexo(e.target.value)}
    className="w-full border rounded-xl p-3"
  >
    <option value="">Selecione</option>
    <option value="masculino">Masculino</option>
    <option value="feminino">Feminino</option>
  </select>
</div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Telefone
                </label>
                <input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(79) 99999-9999"
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  CPF
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Plano
                </label>
                <select
                  value={plano}
                  onChange={(e) => setPlano(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">Selecione</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full border rounded-xl p-3"
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
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div className="md:col-span-2 xl:col-span-3">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Endereço
                </label>
                <input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro..."
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div className="md:col-span-2 xl:col-span-2">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Objetivo
                </label>
                <input
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="Ex: emagrecimento, hipertrofia, condicionamento..."
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Peso meta
                </label>
                <div className="relative">
                  <Target
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={pesoMeta}
                    onChange={(e) => setPesoMeta(e.target.value)}
                    placeholder="Ex: 75"
                    className="w-full border rounded-xl p-3 pl-10"
                  />
                </div>
              </div>
            </div>

            {erro ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="font-semibold text-xl text-gray-900">
              Finalizar cadastro
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Revise os dados e salve para criar o novo aluno.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push("/alunos")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 hover:bg-zinc-50 transition"
            >
              <ArrowLeft size={16} />
              Cancelar
            </button>

            <button
              onClick={salvar}
              disabled={salvando}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700 transition disabled:opacity-60"
            >
              {enviandoFoto ? <Upload size={16} /> : <Save size={16} />}
              {salvando ? "Salvando..." : "Salvar aluno"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}