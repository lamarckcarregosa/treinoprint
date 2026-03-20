"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Search,
  User,
  Camera,
  Save,
  History,
  Scale,
  Ruler,
  Image as ImageIcon,
  Dumbbell,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiFetch";
import ProtegePagina from "@/components/ProtegePagina";

type Aluno = {
  id: number;
  nome: string;
  objetivo?: string;
  peso_meta?: number | string;
  sexo?: "masculino" | "feminino" | string | null;
};;

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
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-600">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-300 px-4 py-3 outline-none focus:border-black"
      />
    </div>
  );
}

function FotoUpload({
  titulo,
  onSelect,
  preview,
}: {
  titulo: string;
  onSelect: (file: File) => void;
  preview?: string;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-zinc-300 p-4">
      <div className="flex items-center gap-2">
        <Camera size={16} className="text-gray-500" />
        <p className="text-sm font-semibold text-gray-700">{titulo}</p>
      </div>

      {preview ? (
        <img
          src={preview}
          alt={titulo}
          className="h-40 w-full rounded-xl object-cover border"
        />
      ) : (
        <div className="flex h-40 w-full items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 border">
          <div className="flex flex-col items-center gap-2">
            <ImageIcon size={28} />
            <span className="text-sm">Sem imagem</span>
          </div>
        </div>
      )}

      <input
        type="file"
        accept="image/*"
        className="w-full rounded-xl border border-zinc-300 p-3"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
        }}
      />
    </div>
  );
}

export default function NovaAvaliacaoPage() {
  return (
    <ProtegePagina permissao="imprimir">
      <NovaAvaliacaoPageContent />
    </ProtegePagina>
  );
}

function NovaAvaliacaoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alunoIdUrl = searchParams.get("aluno_id") || "";
  const hoje = new Date().toISOString().slice(0, 10);

  const [alunoId, setAlunoId] = useState(alunoIdUrl);
  const [busca, setBusca] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [buscandoAlunos, setBuscandoAlunos] = useState(false);

  

  const [data, setData] = useState(hoje);
  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [gordura, setGordura] = useState("");

  const [peito, setPeito] = useState("");
  const [costas, setCostas] = useState("");
  const [cintura, setCintura] = useState("");
  const [abdomen, setAbdomen] = useState("");
  const [quadril, setQuadril] = useState("");
  const [gluteo, setGluteo] = useState("");

  const [bicepsE, setBicepsE] = useState("");
  const [bicepsD, setBicepsD] = useState("");
  const [tricepsE, setTricepsE] = useState("");
  const [tricepsD, setTricepsD] = useState("");
  const [antebracoE, setAntebracoE] = useState("");
  const [antebracoD, setAntebracoD] = useState("");
  const [pulsoE, setPulsoE] = useState("");
  const [pulsoD, setPulsoD] = useState("");

  const [coxaE, setCoxaE] = useState("");
  const [coxaD, setCoxaD] = useState("");
  const [panturrilhaE, setPanturrilhaE] = useState("");
  const [panturrilhaD, setPanturrilhaD] = useState("");

  const [fotoFrente, setFotoFrente] = useState("");
  const [fotoLado, setFotoLado] = useState("");
  const [fotoCostas, setFotoCostas] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!alunoIdUrl) return;
    carregarAlunoPorId(alunoIdUrl);
  }, [alunoIdUrl]);

  useEffect(() => {
    const t = setTimeout(() => {
      buscarAlunos(busca);
    }, 300);

    return () => clearTimeout(t);
  }, [busca]);

  async function carregarAlunoPorId(id: string) {
    try {
      const res = await apiFetch(`/api/alunos/busca?q=${id}&exact=1`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => []);
      if (res.ok && Array.isArray(json)) {
        setAlunos(json);
      }
    } catch {}
  }

  async function buscarAlunos(q: string) {
    try {
      setBuscandoAlunos(true);
      setErro("");

      const termo = q.trim();

      if (termo.length < 2) {
        setAlunos([]);
        return;
      }

      const res = await apiFetch(
        `/api/alunos/busca?q=${encodeURIComponent(termo)}`,
        { cache: "no-store" }
      );

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao buscar alunos");
        return;
      }

      setAlunos(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao buscar alunos");
    } finally {
      setBuscandoAlunos(false);
    }
  }
const alunoSelecionado = alunos.find((a) => String(a.id) === String(alunoId));

  const imcPrevio = useMemo(() => {
    const p = Number(peso || 0);
    const a = Number(altura || 0);
    if (!p || !a) return null;
    return Number((p / (a * a)).toFixed(2));
  }, [peso, altura]);

  async function upload(file: File, tipo: string) {
    try {
      setEnviandoFoto(true);
      setErro("");

      const academiaId = localStorage.getItem("treinoprint_academia_id");
      const ext = file.name.split(".").pop() || "jpg";
      const nome = `${academiaId}/avaliacoes/${tipo}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("avaliacoes")
        .upload(nome, file, { upsert: true });

      if (error) {
        setErro(error.message);
        return;
      }

      const { data } = supabase.storage.from("avaliacoes").getPublicUrl(nome);

      if (tipo === "frente") setFotoFrente(data.publicUrl);
      if (tipo === "lado") setFotoLado(data.publicUrl);
      if (tipo === "costas") setFotoCostas(data.publicUrl);
    } catch (e: any) {
      setErro(e?.message || "Erro ao enviar foto");
    } finally {
      setEnviandoFoto(false);
    }
  }

  async function salvar() {
    try {
      setErro("");

      if (!alunoId) {
        setErro("Selecione o aluno");
        return;
      }

      setSalvando(true);

      const payload = {
        aluno_id: Number(alunoId),
        data_avaliacao: data,
        peso: peso ? Number(peso) : null,
        altura: altura ? Number(altura) : null,
        percentual_gordura: gordura ? Number(gordura) : null,

        peito: peito ? Number(peito) : null,
        costas: costas ? Number(costas) : null,
        cintura: cintura ? Number(cintura) : null,
        abdomen: abdomen ? Number(abdomen) : null,
        quadril: quadril ? Number(quadril) : null,
        gluteo: gluteo ? Number(gluteo) : null,

        biceps_esquerdo: bicepsE ? Number(bicepsE) : null,
        biceps_direito: bicepsD ? Number(bicepsD) : null,
        triceps_esquerdo: tricepsE ? Number(tricepsE) : null,
        triceps_direito: tricepsD ? Number(tricepsD) : null,
        antebraco_esquerdo: antebracoE ? Number(antebracoE) : null,
        antebraco_direito: antebracoD ? Number(antebracoD) : null,
        pulso_esquerdo: pulsoE ? Number(pulsoE) : null,
        pulso_direito: pulsoD ? Number(pulsoD) : null,

        coxa_esquerda: coxaE ? Number(coxaE) : null,
        coxa_direita: coxaD ? Number(coxaD) : null,
        panturrilha_esquerda: panturrilhaE ? Number(panturrilhaE) : null,
        panturrilha_direita: panturrilhaD ? Number(panturrilhaD) : null,

        foto_frente: fotoFrente || null,
        foto_lado: fotoLado || null,
        foto_costas: fotoCostas || null,
      };

      const res = await apiFetch("/api/avaliacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao salvar avaliação");
        return;
      }

      router.push(`/avaliacoes/${json.id}`);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-black to-zinc-800 p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-[#7CFC00]/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-zinc-300">Avaliações físicas</p>
            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              Nova avaliação física
            </h1>
            <p className="mt-3 max-w-2xl text-zinc-300">
              Cadastre uma nova avaliação com composição corporal, medidas por região e fotos.
            </p>
          </div>

          <div className="min-w-[260px] rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
            <p className="text-xs text-white/60">Aluno selecionado</p>
            <p className="mt-1 text-xl font-black">
              {alunoSelecionado?.nome || "Nenhum aluno"}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#7CFC00]">
              <Activity size={16} />
              Sistema online
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card
          title="Selecionar aluno"
          subtitle="Busca rápida por nome. Muito mais leve que carregar todos."
        >
          <div className="relative">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite pelo menos 2 letras"
              className="w-full rounded-xl border border-zinc-300 py-3 pl-11 pr-4 outline-none focus:border-black"
            />
          </div>

          <div className="max-h-72 overflow-auto rounded-xl border">
            {buscandoAlunos ? (
              <p className="p-4 text-sm text-gray-500">Buscando alunos...</p>
            ) : alunos.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                Digite para buscar alunos.
              </p>
            ) : (
              alunos.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAlunoId(String(a.id))}
                  className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left last:border-b-0 hover:bg-gray-50 ${
                    alunoId === String(a.id) ? "bg-blue-50 font-semibold" : ""
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100">
                    <User size={16} className="text-zinc-600" />
                  </div>
                  <span>{a.nome}</span>
                </button>
              ))
            )}
          </div>
        </Card>

        <Card
          title="Resumo rápido"
          subtitle="Conferência antes de salvar."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Data</p>
              <p className="mt-2 text-2xl font-black">{data || "-"}</p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Peso</p>
              <p className="mt-2 text-2xl font-black">
                {peso ? `${peso} kg` : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">Altura</p>
              <p className="mt-2 text-2xl font-black">
                {altura ? `${altura} m` : "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-black/5 p-4">
              <p className="text-sm text-gray-500">IMC prévio</p>
              <p className="mt-2 text-2xl font-black">
                {imcPrevio ? imcPrevio : "-"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card
        title="Dados principais"
        subtitle="Base da avaliação corporal."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input label="Data da avaliação" type="date" value={data} onChange={setData} />
          <Input label="Peso (kg)" value={peso} onChange={setPeso} placeholder="Ex: 82.5" />
          <Input label="Altura (m)" value={altura} onChange={setAltura} placeholder="Ex: 1.75" />
          <Input label="% Gordura" value={gordura} onChange={setGordura} placeholder="Ex: 18" />
        </div>
      </Card>

      <Card
        title="Tronco"
        subtitle="Medidas centrais do corpo."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input label="Peito" value={peito} onChange={setPeito} />
          <Input label="Costas" value={costas} onChange={setCostas} />
          <Input label="Cintura" value={cintura} onChange={setCintura} />
          <Input label="Abdômen" value={abdomen} onChange={setAbdomen} />
          <Input label="Quadril" value={quadril} onChange={setQuadril} />
          <Input label="Glúteo" value={gluteo} onChange={setGluteo} />
        </div>
      </Card>

      <Card
        title="Membros superiores"
        subtitle="Divisão muscular mais profissional."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input label="Bíceps esquerdo" value={bicepsE} onChange={setBicepsE} />
          <Input label="Bíceps direito" value={bicepsD} onChange={setBicepsD} />
          <Input label="Tríceps esquerdo" value={tricepsE} onChange={setTricepsE} />
          <Input label="Tríceps direito" value={tricepsD} onChange={setTricepsD} />
          <Input label="Antebraço esquerdo" value={antebracoE} onChange={setAntebracoE} />
          <Input label="Antebraço direito" value={antebracoD} onChange={setAntebracoD} />
          <Input label="Pulso esquerdo" value={pulsoE} onChange={setPulsoE} />
          <Input label="Pulso direito" value={pulsoD} onChange={setPulsoD} />
        </div>
      </Card>

      <Card
        title="Membros inferiores"
        subtitle="Medidas de pernas."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Input label="Coxa esquerda" value={coxaE} onChange={setCoxaE} />
          <Input label="Coxa direita" value={coxaD} onChange={setCoxaD} />
          <Input label="Panturrilha esquerda" value={panturrilhaE} onChange={setPanturrilhaE} />
          <Input label="Panturrilha direita" value={panturrilhaD} onChange={setPanturrilhaD} />
        </div>
      </Card>

      <Card
        title="Registro fotográfico"
        subtitle="Evolução visual do aluno."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FotoUpload
            titulo="Foto frente"
            preview={fotoFrente}
            onSelect={(file) => upload(file, "frente")}
          />

          <FotoUpload
            titulo="Foto lado"
            preview={fotoLado}
            onSelect={(file) => upload(file, "lado")}
          />

          <FotoUpload
            titulo="Foto costas"
            preview={fotoCostas}
            onSelect={(file) => upload(file, "costas")}
          />
        </div>

        {enviandoFoto ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Enviando foto...
          </div>
        ) : null}
      </Card>

      <Card
        title="Confirmação"
        subtitle="Revise antes de finalizar."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Aluno</p>
            <p className="mt-2 text-lg font-bold">
              {alunoSelecionado?.nome || "-"}
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Fotos enviadas</p>
            <p className="mt-2 text-lg font-bold">
              {[fotoFrente, fotoLado, fotoCostas].filter(Boolean).length}/3
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Campos principais</p>
            <p className="mt-2 text-lg font-bold">
              {[peso, altura, gordura].filter(Boolean).length}/3
            </p>
          </div>

          <div className="rounded-2xl border border-black/5 p-4">
            <p className="text-sm text-gray-500">Divisão muscular</p>
            <p className="mt-2 text-lg font-bold flex items-center gap-2">
              <Dumbbell size={16} />
              Ativa
            </p>
          </div>
        </div>

        {erro ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {erro}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white disabled:opacity-60"
          >
            <Save size={16} />
            {salvando ? "Salvando..." : "Salvar avaliação"}
          </button>

          <button
            onClick={() =>
              router.push(
                alunoId
                  ? `/avaliacoes/historico?aluno_id=${alunoId}`
                  : "/avaliacoes/historico"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl border px-5 py-3"
          >
            <History size={16} />
            Ver histórico
          </button>
        </div>
      </Card>
    </main>
  );
}