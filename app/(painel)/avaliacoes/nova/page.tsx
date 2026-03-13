"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiFetch";
import ProtegePagina from "@/components/ProtegePagina";

type Aluno = {
  id: number;
  nome: string;
};

function NovaAvaliacaoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alunoIdUrl = searchParams.get("aluno_id") || "";

  const hoje = new Date().toISOString().slice(0, 10);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunoId, setAlunoId] = useState(alunoIdUrl);
  const [busca, setBusca] = useState("");

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
  const [bracoE, setBracoE] = useState("");
  const [bracoD, setBracoD] = useState("");
  const [coxaE, setCoxaE] = useState("");
  const [coxaD, setCoxaD] = useState("");
  const [panturrilhaE, setPanturrilhaE] = useState("");
  const [panturrilhaD, setPanturrilhaD] = useState("");

  const [fotoFrente, setFotoFrente] = useState("");
  const [fotoLado, setFotoLado] = useState("");
  const [fotoCostas, setFotoCostas] = useState("");

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetch("/api/alunos", { cache: "no-store" });
        const json = await res.json().catch(() => []);

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar alunos");
          return;
        }

        setAlunos(Array.isArray(json) ? json : []);
      } catch {
        setErro("Erro ao carregar alunos");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

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
        braco_esquerdo: bracoE ? Number(bracoE) : null,
        braco_direito: bracoD ? Number(bracoD) : null,
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

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-[32px] bg-gradient-to-r from-black to-zinc-800 text-white p-6 md:p-8 overflow-hidden relative">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-[#7CFC00]/10 blur-3xl rounded-full" />

        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div>
            <p className="text-sm text-zinc-300">Painel principal</p>
            <h1 className="text-3xl md:text-4xl font-black mt-2">
              Nova avaliação
            </h1>
            <p className="text-zinc-300 mt-3 max-w-2xl">
              Cadastre uma nova avaliação física do aluno.
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

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-xl">Selecionar aluno</h2>

        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aluno"
          className="border rounded-xl p-3 w-full"
        />

        <div className="border rounded-xl max-h-40 overflow-auto">
          {alunosFiltrados.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">Nenhum aluno encontrado.</p>
          ) : (
            alunosFiltrados.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAlunoId(String(a.id))}
                className={`block w-full text-left px-3 py-2 hover:bg-gray-50 ${
                  alunoId === String(a.id) ? "bg-blue-50 font-semibold" : ""
                }`}
              >
                {a.nome}
              </button>
            ))
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6 space-y-4">
        <h2 className="font-bold text-xl">Dados da avaliação</h2>

        <div className="grid md:grid-cols-4 gap-3">
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Peso" value={peso} onChange={(e) => setPeso(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Altura" value={altura} onChange={(e) => setAltura(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="% Gordura" value={gordura} onChange={(e) => setGordura(e.target.value)} className="border p-3 rounded-xl" />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input placeholder="Peito" value={peito} onChange={(e) => setPeito(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Costas" value={costas} onChange={(e) => setCostas(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Cintura" value={cintura} onChange={(e) => setCintura(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Abdômen" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} className="border p-3 rounded-xl" />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input placeholder="Quadril" value={quadril} onChange={(e) => setQuadril(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Glúteo" value={gluteo} onChange={(e) => setGluteo(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Braço esquerdo" value={bracoE} onChange={(e) => setBracoE(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Braço direito" value={bracoD} onChange={(e) => setBracoD(e.target.value)} className="border p-3 rounded-xl" />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input placeholder="Coxa esquerda" value={coxaE} onChange={(e) => setCoxaE(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Coxa direita" value={coxaD} onChange={(e) => setCoxaD(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Panturrilha esquerda" value={panturrilhaE} onChange={(e) => setPanturrilhaE(e.target.value)} className="border p-3 rounded-xl" />
          <input placeholder="Panturrilha direita" value={panturrilhaD} onChange={(e) => setPanturrilhaD(e.target.value)} className="border p-3 rounded-xl" />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Foto frente</label>
            <input
              type="file"
              accept="image/*"
              className="border p-3 rounded-xl w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file, "frente");
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Foto lado</label>
            <input
              type="file"
              accept="image/*"
              className="border p-3 rounded-xl w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file, "lado");
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Foto costas</label>
            <input
              type="file"
              accept="image/*"
              className="border p-3 rounded-xl w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file, "costas");
              }}
            />
          </div>
        </div>

        {enviandoFoto ? <p className="text-sm text-gray-500">Enviando foto...</p> : null}
        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={salvar}
            disabled={salvando}
            className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar avaliação"}
          </button>

          <button
            onClick={() =>
              router.push(
                alunoId ? `/avaliacoes/historico?aluno_id=${alunoId}` : "/avaliacoes/historico"
              )
            }
            className="border px-5 py-3 rounded-xl"
          >
            Ver histórico
          </button>
        </div>
      </section>
    </main>
  );
}

export default function NovaAvaliacaoPage() {
  return (
    <ProtegePagina permissao="imprimir">
      <NovaAvaliacaoPageContent />
    </ProtegePagina>
  );
}