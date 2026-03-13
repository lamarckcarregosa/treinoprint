"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Pencil, Trash2, XCircle } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/apiFetch";

type Aluno = {
  id: number;
  nome: string;
};

type Avaliacao = {
  id: number;
  aluno_id: number;
  data_avaliacao: string;
  peso?: number;
  altura?: number;
  percentual_gordura?: number;
  peito?: number;
  costas?: number;
  cintura?: number;
  abdomen?: number;
  quadril?: number;
  gluteo?: number;
  braco_esquerdo?: number;
  braco_direito?: number;
  coxa_esquerda?: number;
  coxa_direita?: number;
  panturrilha_esquerda?: number;
  panturrilha_direita?: number;
  foto_frente?: string;
  foto_lado?: string;
  foto_costas?: string;
};

function imc(peso?: number, altura?: number) {
  if (!peso || !altura) return 0;
  return Number((peso / (altura * altura)).toFixed(2));
}

function formatData(d: string) {
  return new Date(`${d}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function AvaliacoesPage() {
  const hoje = new Date().toISOString().slice(0, 10);

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const [alunoId, setAlunoId] = useState("");
  const [busca, setBusca] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [gordura, setGordura] = useState("");
  const [data, setData] = useState(hoje);

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

  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  async function carregar() {
    try {
      setErro("");

      const [resAlunos, resAval] = await Promise.all([
        apiFetch("/api/alunos", { cache: "no-store" }),
        apiFetch("/api/avaliacoes", { cache: "no-store" }),
      ]);

      const jsonAlunos = await resAlunos.json().catch(() => []);
      const jsonAval = await resAval.json().catch(() => []);

      if (!resAlunos.ok) {
        setErro((jsonAlunos as any).error || "Erro ao carregar alunos");
        return;
      }

      if (!resAval.ok) {
        setErro((jsonAval as any).error || "Erro ao carregar avaliações");
        return;
      }

      setAlunos(Array.isArray(jsonAlunos) ? jsonAlunos : []);
      setAvaliacoes(Array.isArray(jsonAval) ? jsonAval : []);
    } catch {
      setErro("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const alunosFiltrados = alunos.filter((a) =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  const avalAluno = avaliacoes
    .filter((a) => String(a.aluno_id) === alunoId)
    .sort((a, b) => a.data_avaliacao.localeCompare(b.data_avaliacao));

  const ultima = avalAluno[avalAluno.length - 1];
  const anterior = avalAluno[avalAluno.length - 2];

  const grafico = avalAluno.map((a) => ({
    data: formatData(a.data_avaliacao),
    peso: Number(a.peso || 0),
    gordura: Number(a.percentual_gordura || 0),
    imc: imc(a.peso, a.altura),
  }));

  const radar = ultima
    ? [
        { medida: "Peito", atual: ultima.peito || 0, anterior: anterior?.peito || 0 },
        { medida: "Costas", atual: ultima.costas || 0, anterior: anterior?.costas || 0 },
        { medida: "Cintura", atual: ultima.cintura || 0, anterior: anterior?.cintura || 0 },
        { medida: "Abdômen", atual: ultima.abdomen || 0, anterior: anterior?.abdomen || 0 },
        { medida: "Quadril", atual: ultima.quadril || 0, anterior: anterior?.quadril || 0 },
        { medida: "Glúteo", atual: ultima.gluteo || 0, anterior: anterior?.gluteo || 0 },
        {
          medida: "Braço E",
          atual: ultima.braco_esquerdo || 0,
          anterior: anterior?.braco_esquerdo || 0,
        },
        {
          medida: "Braço D",
          atual: ultima.braco_direito || 0,
          anterior: anterior?.braco_direito || 0,
        },
        {
          medida: "Coxa E",
          atual: ultima.coxa_esquerda || 0,
          anterior: anterior?.coxa_esquerda || 0,
        },
        {
          medida: "Coxa D",
          atual: ultima.coxa_direita || 0,
          anterior: anterior?.coxa_direita || 0,
        },
        {
          medida: "Pant. E",
          atual: ultima.panturrilha_esquerda || 0,
          anterior: anterior?.panturrilha_esquerda || 0,
        },
        {
          medida: "Pant. D",
          atual: ultima.panturrilha_direita || 0,
          anterior: anterior?.panturrilha_direita || 0,
        },
      ]
    : [];

  function limparFormulario() {
    setEditandoId(null);
    setData(hoje);
    setPeso("");
    setAltura("");
    setGordura("");
    setPeito("");
    setCostas("");
    setCintura("");
    setAbdomen("");
    setQuadril("");
    setGluteo("");
    setBracoE("");
    setBracoD("");
    setCoxaE("");
    setCoxaD("");
    setPanturrilhaE("");
    setPanturrilhaD("");
    setFotoFrente("");
    setFotoLado("");
    setFotoCostas("");
    setErro("");
  }

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

      const url = editandoId ? `/api/avaliacoes/${editandoId}` : "/api/avaliacoes";
      const method = editandoId ? "PUT" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro((json as any).error || "Erro ao salvar avaliação");
        return;
      }

      limparFormulario();
      await carregar();
    } finally {
      setSalvando(false);
    }
  }

  function editar(item: Avaliacao) {
    setEditandoId(item.id);
    setAlunoId(String(item.aluno_id));
    setData(item.data_avaliacao || hoje);
    setPeso(String(item.peso || ""));
    setAltura(String(item.altura || ""));
    setGordura(String(item.percentual_gordura || ""));
    setPeito(String(item.peito || ""));
    setCostas(String(item.costas || ""));
    setCintura(String(item.cintura || ""));
    setAbdomen(String(item.abdomen || ""));
    setQuadril(String(item.quadril || ""));
    setGluteo(String(item.gluteo || ""));
    setBracoE(String(item.braco_esquerdo || ""));
    setBracoD(String(item.braco_direito || ""));
    setCoxaE(String(item.coxa_esquerda || ""));
    setCoxaD(String(item.coxa_direita || ""));
    setPanturrilhaE(String(item.panturrilha_esquerda || ""));
    setPanturrilhaD(String(item.panturrilha_direita || ""));
    setFotoFrente(item.foto_frente || "");
    setFotoLado(item.foto_lado || "");
    setFotoCostas(item.foto_costas || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function excluir(id: number) {
    const confirmar = confirm("Deseja excluir esta avaliação?");
    if (!confirmar) return;

    const res = await apiFetch(`/api/avaliacoes/${id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert((json as any).error || "Erro ao excluir avaliação");
      return;
    }

    if (editandoId === id) {
      limparFormulario();
    }

    await carregar();
  }

  if (loading) {
    return <p className="p-6">Carregando...</p>;
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-black to-zinc-800 text-white p-8">
        <div className="flex items-center gap-3">
          <Activity size={28} />
          <div>
            <h1 className="text-4xl font-black">Avaliação Física</h1>
            <p className="text-zinc-300 mt-2">Evolução corporal dos alunos</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar aluno"
          className="border rounded-xl p-3 w-full"
        />

        <div className="border rounded-xl mt-3 max-h-40 overflow-auto">
          {alunosFiltrados.length === 0 ? (
            <p className="p-3 text-sm text-gray-500">Nenhum aluno encontrado.</p>
          ) : (
            alunosFiltrados.map((a) => (
              <button
                key={a.id}
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="font-bold text-xl">
            {editandoId ? "Editar avaliação" : "Nova avaliação"}
          </h2>

          {editandoId ? (
            <button
              type="button"
              onClick={limparFormulario}
              className="inline-flex items-center gap-2 border rounded-xl px-4 py-2"
            >
              <XCircle size={16} />
              Cancelar edição
            </button>
          ) : null}
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Peso"
            value={peso}
            onChange={(e) => setPeso(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Altura"
            value={altura}
            onChange={(e) => setAltura(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="% Gordura"
            value={gordura}
            onChange={(e) => setGordura(e.target.value)}
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            placeholder="Peito"
            value={peito}
            onChange={(e) => setPeito(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Costas"
            value={costas}
            onChange={(e) => setCostas(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Cintura"
            value={cintura}
            onChange={(e) => setCintura(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Abdômen"
            value={abdomen}
            onChange={(e) => setAbdomen(e.target.value)}
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            placeholder="Quadril"
            value={quadril}
            onChange={(e) => setQuadril(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Glúteo"
            value={gluteo}
            onChange={(e) => setGluteo(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Braço esquerdo"
            value={bracoE}
            onChange={(e) => setBracoE(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Braço direito"
            value={bracoD}
            onChange={(e) => setBracoD(e.target.value)}
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <input
            placeholder="Coxa esquerda"
            value={coxaE}
            onChange={(e) => setCoxaE(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Coxa direita"
            value={coxaD}
            onChange={(e) => setCoxaD(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Panturrilha esquerda"
            value={panturrilhaE}
            onChange={(e) => setPanturrilhaE(e.target.value)}
            className="border p-3 rounded-xl"
          />
          <input
            placeholder="Panturrilha direita"
            value={panturrilhaD}
            onChange={(e) => setPanturrilhaD(e.target.value)}
            className="border p-3 rounded-xl"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Foto frente
            </label>
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
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Foto lado
            </label>
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
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Foto costas
            </label>
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

        {enviandoFoto ? (
          <p className="text-sm text-gray-500">Enviando foto...</p>
        ) : null}

        {erro ? <p className="text-red-600 text-sm">{erro}</p> : null}

        <button
          onClick={salvar}
          disabled={salvando}
          className="bg-black text-white px-5 py-3 rounded-xl disabled:opacity-60"
        >
          {salvando
            ? "Salvando..."
            : editandoId
            ? "Atualizar avaliação"
            : "Salvar avaliação"}
        </button>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold mb-4">Gráfico evolução</h2>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={grafico}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="data" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line dataKey="peso" stroke="#2563eb" strokeWidth={3} />
              <Line dataKey="gordura" stroke="#dc2626" strokeWidth={3} />
              <Line dataKey="imc" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <h2 className="font-bold mb-4">Radar corporal</h2>

        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar}>
              <PolarGrid />
              <PolarAngleAxis dataKey="medida" />
              <PolarRadiusAxis />
              <Radar
                dataKey="anterior"
                stroke="#9ca3af"
                fill="#9ca3af"
                fillOpacity={0.25}
              />
              <Radar
                dataKey="atual"
                stroke="#111827"
                fill="#111827"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-bold text-lg">Histórico de avaliações</h2>
          <span className="text-sm text-gray-500">
            {avalAluno.length} avaliação(ões)
          </span>
        </div>

        {avalAluno.length === 0 ? (
          <p className="text-gray-500">Nenhuma avaliação cadastrada para este aluno.</p>
        ) : (
          <div className="space-y-3">
            {[...avalAluno].reverse().map((item) => (
              <div key={item.id} className="border rounded-2xl p-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      Avaliação em {formatData(item.data_avaliacao)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Peso: {item.peso || 0} kg
                    </p>
                    <p className="text-sm text-gray-600">
                      Gordura: {item.percentual_gordura || 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                      IMC: {imc(item.peso, item.altura)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => editar(item)}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-4 py-2"
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => excluir(item.id)}
                      className="inline-flex items-center gap-2 bg-red-600 text-white rounded-xl px-4 py-2"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </div>

                {(item.foto_frente || item.foto_lado || item.foto_costas) ? (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {item.foto_frente ? (
                      <img
                        src={item.foto_frente}
                        alt="Frente"
                        className="w-24 h-24 object-cover rounded-xl border"
                      />
                    ) : null}
                    {item.foto_lado ? (
                      <img
                        src={item.foto_lado}
                        alt="Lado"
                        className="w-24 h-24 object-cover rounded-xl border"
                      />
                    ) : null}
                    {item.foto_costas ? (
                      <img
                        src={item.foto_costas}
                        alt="Costas"
                        className="w-24 h-24 object-cover rounded-xl border"
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {ultima ? (
        <section className="bg-white rounded-2xl shadow p-6">
          <h2 className="font-bold mb-4">Última avaliação</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-2xl border p-4">
              <p className="text-sm text-gray-500">Peso</p>
              <p className="text-2xl font-black">{ultima.peso || 0} kg</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-gray-500">Gordura</p>
              <p className="text-2xl font-black">
                {ultima.percentual_gordura || 0}%
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-gray-500">IMC</p>
              <p className="text-2xl font-black">
                {imc(ultima.peso, ultima.altura)}
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}