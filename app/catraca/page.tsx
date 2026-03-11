"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";

type RetornoValidacao = {
  liberado?: boolean;
  aluno?: string | null;
  foto?: string | null;
  motivo?: string;
  error?: string;
};

type AcessoHistorico = {
  id: number;
  aluno_id?: number | null;
  aluno_nome?: string | null;
  codigo_lido?: string | null;
  status: string;
  motivo?: string | null;
  origem?: string | null;
  created_at: string;
};

const diasSemana = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const niveis = ["Iniciante", "Intermediário", "Avançado"];
const tipos = ["Masculino", "Feminino"];

function formatarDataHora(data: string) {
  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function formatarRelogio() {
  return new Date().toLocaleTimeString("pt-BR");
}

function getDiaAtual() {
  return diasSemana[new Date().getDay()];
}

function CatracaPageContent() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<RetornoValidacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [historico, setHistorico] = useState<AcessoHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [leituraAutomatica, setLeituraAutomatica] = useState(true);
  const [relogio, setRelogio] = useState(formatarRelogio());
  const [nomeAcademia, setNomeAcademia] = useState("");
  const [segundosReset, setSegundosReset] = useState(0);

  const [mostrarPerguntaImpressao, setMostrarPerguntaImpressao] = useState(false);
  const [mostrarModalImpressao, setMostrarModalImpressao] = useState(false);
  const [alunoLiberado, setAlunoLiberado] = useState("");
  const [diaTreino, setDiaTreino] = useState(getDiaAtual());
  const [tipoTreino, setTipoTreino] = useState(tipos[0]);
  const [nivelTreino, setNivelTreino] = useState(niveis[0]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const timeoutLeituraRef = useRef<NodeJS.Timeout | null>(null);
  const resetTelaRef = useRef<NodeJS.Timeout | null>(null);
  const intervalResetRef = useRef<NodeJS.Timeout | null>(null);
  const somLiberado = useRef<HTMLAudioElement | null>(null);
  const somBloqueado = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();

    somLiberado.current = new Audio("/sounds/liberado.mp3");
    somBloqueado.current = new Audio("/sounds/bloqueado.mp3");

    if (somLiberado.current) somLiberado.current.volume = 1;
    if (somBloqueado.current) somBloqueado.current.volume = 1;

    carregarHistorico();
    carregarAcademia();

    const timerRelogio = setInterval(() => {
      setRelogio(formatarRelogio());
    }, 1000);

    const manterFoco = () => {
      if (!mostrarPerguntaImpressao && !mostrarModalImpressao) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener("click", manterFoco);

    return () => {
      window.removeEventListener("click", manterFoco);
      clearInterval(timerRelogio);

      if (timeoutLeituraRef.current) clearTimeout(timeoutLeituraRef.current);
      if (resetTelaRef.current) clearTimeout(resetTelaRef.current);
      if (intervalResetRef.current) clearInterval(intervalResetRef.current);
    };
  }, [mostrarPerguntaImpressao, mostrarModalImpressao]);

  const carregarAcademia = async () => {
    try {
      const res = await apiFetch("/api/minha-academia", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) return;
      setNomeAcademia((json as any).nome || "");
    } catch {}
  };

  const carregarHistorico = async () => {
    try {
      setCarregandoHistorico(true);

      const res = await apiFetch("/api/catraca/historico", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        console.error((json as any).error || "Erro ao carregar histórico");
        return;
      }

      setHistorico(Array.isArray(json) ? json : []);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const tocarSom = (liberado?: boolean) => {
    try {
      if (liberado) {
        if (somLiberado.current) {
          somLiberado.current.currentTime = 0;
          somLiberado.current.play().catch(() => {});
        }
      } else {
        if (somBloqueado.current) {
          somBloqueado.current.currentTime = 0;
          somBloqueado.current.play().catch(() => {});
        }
      }
    } catch {}
  };

  const limparTelaDepois = () => {
    if (resetTelaRef.current) clearTimeout(resetTelaRef.current);
    if (intervalResetRef.current) clearInterval(intervalResetRef.current);

    setSegundosReset(3);

    intervalResetRef.current = setInterval(() => {
      setSegundosReset((prev) => {
        if (prev <= 1) {
          if (intervalResetRef.current) clearInterval(intervalResetRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    resetTelaRef.current = setTimeout(() => {
      if (!mostrarPerguntaImpressao && !mostrarModalImpressao) {
        setResultado(null);
      }
      setSegundosReset(0);
      inputRef.current?.focus();
    }, 3000);
  };

  const validar = async (codigoParaValidar?: string) => {
    try {
      const codigoFinal = String(codigoParaValidar || codigo).trim();
      if (!codigoFinal || loading) return;

      setLoading(true);

      const res = await apiFetch("/api/catraca/validar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo: codigoFinal,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const retornoErro = {
          liberado: false,
          aluno: null,
          foto: null,
          motivo: (json as any).error || "Erro ao validar acesso",
        };

        setResultado(retornoErro);
        tocarSom(false);
        setCodigo("");
        limparTelaDepois();
        return;
      }

      const retorno = json as RetornoValidacao;
      setResultado(retorno);
      tocarSom(retorno.liberado);
      setCodigo("");

      await carregarHistorico();

      if (retorno.liberado && retorno.aluno) {
        setAlunoLiberado(retorno.aluno);
        setDiaTreino(getDiaAtual());
        setTipoTreino(tipos[0]);
        setNivelTreino(niveis[0]);
        setMostrarPerguntaImpressao(true);
      } else {
        limparTelaDepois();
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } finally {
      setLoading(false);
    }
  };

  const handleCodigoChange = (valor: string) => {
    setCodigo(valor);

    if (!leituraAutomatica) return;

    if (timeoutLeituraRef.current) {
      clearTimeout(timeoutLeituraRef.current);
    }

    timeoutLeituraRef.current = setTimeout(() => {
      const codigoLido = valor.trim();
      if (codigoLido.length >= 1) {
        validar(codigoLido);
      }
    }, 180);
  };

  const entrarTelaCheia = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      }
    } catch {}
  };

  const abrirImpressaoRapida = () => {
    if (!alunoLiberado) return;

    const params = new URLSearchParams({
      aluno: alunoLiberado,
      dia: diaTreino,
      tipo: tipoTreino,
      nivel: nivelTreino,
    });

    window.open(`/imprimir/rapido?${params.toString()}`, "_blank");

    setMostrarModalImpressao(false);
    setMostrarPerguntaImpressao(false);
    setResultado(null);
    setSegundosReset(0);
    inputRef.current?.focus();
  };

  const cancelarPergunta = () => {
    setMostrarPerguntaImpressao(false);
    setMostrarModalImpressao(false);
    limparTelaDepois();
    inputRef.current?.focus();
  };

  const cardResultadoClass = resultado
    ? resultado.liberado
      ? "border-green-300 bg-green-50"
      : "border-red-300 bg-red-50"
    : "border-black/5 bg-white";

  const textoResultadoClass = resultado
    ? resultado.liberado
      ? "text-green-700"
      : "text-red-700"
    : "text-gray-900";

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="bg-black text-white shadow-md">
        <div className="max-w-6xl mx-auto px-8 py-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow">
              <img
                src="/logo-sistema.png"
                alt="Logo do sistema"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div>
              <h1 className="text-4xl font-black leading-tight">
                Controle de Acesso
              </h1>
              <p className="text-white/70 mt-1">
                {nomeAcademia || "TreinoPrint"} • Recepção / Catraca
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
            <div className="bg-white/10 rounded-2xl px-5 py-3 text-center min-w-[150px]">
              <p className="text-xs text-white/60">Horário</p>
              <p className="text-2xl font-black tracking-wider">{relogio}</p>
            </div>

            <label className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-xl text-sm">
              <input
                type="checkbox"
                checked={leituraAutomatica}
                onChange={(e) => setLeituraAutomatica(e.target.checked)}
              />
              Leitura automática
            </label>

            <button
              onClick={entrarTelaCheia}
              className="bg-white text-black px-4 py-2 rounded-xl font-medium"
            >
              Tela cheia
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-8 space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow border border-black/5">
          <input
            ref={inputRef}
            value={codigo}
            onChange={(e) => handleCodigoChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                validar();
              }
            }}
            placeholder="Leia o QR ou digite o código"
            className="w-full border-2 border-black/70 rounded-xl p-4 text-2xl text-center"
            autoFocus
          />

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-xs text-gray-500 text-center md:text-left">
              Com leitura automática ativada, o sistema valida sozinho logo após a leitura.
            </p>

            {resultado && segundosReset > 0 && !mostrarPerguntaImpressao && !mostrarModalImpressao ? (
              <p className="text-xs text-gray-500 text-center md:text-right">
                Limpando tela em {segundosReset}s
              </p>
            ) : null}
          </div>
        </section>

        <section
          className={`rounded-2xl shadow p-10 min-h-[340px] flex items-center justify-center border transition-all duration-300 ${cardResultadoClass}`}
        >
          {!resultado ? (
            <p className="text-gray-500 text-2xl">Aguardando leitura...</p>
          ) : (
            <div className="space-y-4 w-full text-center">
              {resultado.foto ? (
                <img
                  src={resultado.foto}
                  alt={resultado.aluno || "Aluno"}
                  className="w-36 h-36 object-cover rounded-full mx-auto border-4 border-white shadow"
                />
              ) : (
                <div className="w-36 h-36 rounded-full bg-gray-100 border mx-auto flex items-center justify-center text-gray-400">
                  Sem foto
                </div>
              )}

              <p className={`text-5xl font-black ${textoResultadoClass}`}>
                {resultado.liberado ? "ACESSO LIBERADO" : "ACESSO BLOQUEADO"}
              </p>

              {resultado.aluno ? (
                <p className="text-3xl font-semibold text-gray-900">
                  {resultado.aluno}
                </p>
              ) : null}

              <p className={`text-xl font-medium ${textoResultadoClass}`}>
                {resultado.motivo || "-"}
              </p>
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-semibold text-lg">Últimos acessos</h2>

            <button
              onClick={carregarHistorico}
              className="border px-4 py-2 rounded-xl"
            >
              Atualizar
            </button>
          </div>

          {carregandoHistorico ? (
            <p className="text-gray-500">Carregando histórico...</p>
          ) : historico.length === 0 ? (
            <p className="text-gray-500">Nenhum acesso registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              {historico.map((item) => {
                const liberado = item.status === "liberado";

                return (
                  <div
                    key={item.id}
                    className="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {item.aluno_nome || "Aluno não identificado"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatarDataHora(item.created_at)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Motivo: {item.motivo || "-"}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          liberado
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {liberado ? "Liberado" : "Bloqueado"}
                      </span>

                      {item.codigo_lido ? (
                        <span className="text-xs text-gray-400">
                          Código: {item.codigo_lido}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {mostrarPerguntaImpressao ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-2xl font-black text-gray-900 text-center">
              Imprimir treino do dia?
            </h2>

            <p className="text-center text-gray-600">
              Aluno: <strong>{alunoLiberado}</strong>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarPerguntaImpressao(false);
                  setMostrarModalImpressao(true);
                }}
                className="flex-1 bg-black text-white rounded-xl py-3"
              >
                Sim
              </button>

              <button
                onClick={cancelarPergunta}
                className="flex-1 border rounded-xl py-3"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mostrarModalImpressao ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
            <h2 className="text-2xl font-black text-gray-900 text-center">
              Impressão rápida
            </h2>

            <p className="text-center text-gray-600">
              Aluno: <strong>{alunoLiberado}</strong>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Dia
                </label>
                <select
                  value={diaTreino}
                  onChange={(e) => setDiaTreino(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  {diasSemana.slice(1).map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Tipo
                </label>
                <select
                  value={tipoTreino}
                  onChange={(e) => setTipoTreino(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  {tipos.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Nível
                </label>
                <select
                  value={nivelTreino}
                  onChange={(e) => setNivelTreino(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  {niveis.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={abrirImpressaoRapida}
                className="flex-1 bg-green-600 text-white rounded-xl py-3"
              >
                Imprimir agora
              </button>

              <button
                onClick={cancelarPergunta}
                className="flex-1 border rounded-xl py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default function CatracaPage() {
  return (
    <ProtegePagina permissao="imprimir">
      <CatracaPageContent />
    </ProtegePagina>
  );
}