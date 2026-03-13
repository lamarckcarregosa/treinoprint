"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetchAluno } from "@/lib/apiFetchAluno";

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

function formatData(data?: string | null) {
  if (!data) return "-";
  const dt = new Date(`${data}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return data;
  return dt.toLocaleDateString("pt-BR");
}

function calcularIMC(peso?: number, altura?: number) {
  if (!peso || !altura) return 0;
  return Number((peso / (altura * altura)).toFixed(2));
}

function CardInfo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow p-4">
      <p className="text-xs text-gray-500">{titulo}</p>
      <p className="text-xl font-black text-gray-900 mt-1">{valor}</p>
    </div>
  );
}

function LinhaMedida({
  nome,
  valor,
}: {
  nome: string;
  valor?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border px-4 py-3 bg-white">
      <span className="text-sm text-gray-600">{nome}</span>
      <span className="font-semibold text-gray-900">{valor || 0}</span>
    </div>
  );
}

export default function AppAlunoAvaliacaoDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);

  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const carregar = async () => {
      try {
        setErro("");

        const res = await apiFetchAluno(`/api/app-aluno/avaliacoes/${id}`, {
          cache: "no-store",
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          setErro((json as any).error || "Erro ao carregar avaliação");
          return;
        }

        setAvaliacao(json as Avaliacao);
      } catch {
        setErro("Erro ao carregar avaliação");
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [id]);

  const imc = useMemo(
    () => calcularIMC(avaliacao?.peso, avaliacao?.altura),
    [avaliacao]
  );

  if (loading) return <p className="p-4">Carregando...</p>;

  if (erro || !avaliacao) {
    return (
      <div className="bg-white rounded-2xl shadow p-5">
        <p className="text-red-600">{erro || "Avaliação não encontrada"}</p>
        <button
          onClick={() => router.push("/app-aluno/avaliacoes")}
          className="mt-4 border rounded-xl px-4 py-3"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.push("/app-aluno/avaliacoes")}
        className="border rounded-xl px-4 py-3"
      >
        Voltar
      </button>

      <section className="bg-white rounded-2xl shadow p-5">
        <h1 className="text-xl font-black text-gray-900">Detalhe da avaliação</h1>
        <p className="text-sm text-gray-500 mt-1">
          Data: {formatData(avaliacao.data_avaliacao)}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <CardInfo titulo="Peso" valor={`${avaliacao.peso || 0} kg`} />
        <CardInfo titulo="Altura" valor={`${avaliacao.altura || 0} m`} />
        <CardInfo titulo="IMC" valor={imc} />
        <CardInfo
          titulo="% Gordura"
          valor={`${avaliacao.percentual_gordura || 0}%`}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-gray-900">Medidas corporais</h2>

        <div className="grid grid-cols-1 gap-3">
          <LinhaMedida nome="Peito" valor={avaliacao.peito} />
          <LinhaMedida nome="Costas" valor={avaliacao.costas} />
          <LinhaMedida nome="Cintura" valor={avaliacao.cintura} />
          <LinhaMedida nome="Abdômen" valor={avaliacao.abdomen} />
          <LinhaMedida nome="Quadril" valor={avaliacao.quadril} />
          <LinhaMedida nome="Glúteo" valor={avaliacao.gluteo} />
          <LinhaMedida nome="Braço esquerdo" valor={avaliacao.braco_esquerdo} />
          <LinhaMedida nome="Braço direito" valor={avaliacao.braco_direito} />
          <LinhaMedida nome="Coxa esquerda" valor={avaliacao.coxa_esquerda} />
          <LinhaMedida nome="Coxa direita" valor={avaliacao.coxa_direita} />
          <LinhaMedida
            nome="Panturrilha esquerda"
            valor={avaliacao.panturrilha_esquerda}
          />
          <LinhaMedida
            nome="Panturrilha direita"
            valor={avaliacao.panturrilha_direita}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-bold text-gray-900">Fotos</h2>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-3">Frente</p>
            {avaliacao.foto_frente ? (
              <img
                src={avaliacao.foto_frente}
                alt="Foto frente"
                className="w-full h-72 object-cover rounded-2xl border"
              />
            ) : (
              <div className="w-full h-72 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                Sem foto
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-3">Lado</p>
            {avaliacao.foto_lado ? (
              <img
                src={avaliacao.foto_lado}
                alt="Foto lado"
                className="w-full h-72 object-cover rounded-2xl border"
              />
            ) : (
              <div className="w-full h-72 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                Sem foto
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <p className="text-sm text-gray-500 mb-3">Costas</p>
            {avaliacao.foto_costas ? (
              <img
                src={avaliacao.foto_costas}
                alt="Foto costas"
                className="w-full h-72 object-cover rounded-2xl border"
              />
            ) : (
              <div className="w-full h-72 rounded-2xl border bg-gray-50 flex items-center justify-center text-sm text-gray-400">
                Sem foto
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}