"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";

type RetornoValidacao = {
  liberado?: boolean;
  aluno_id?: number | null;
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

type TreinoOpcao = {
  id: number;
  semana?: string;
  dia?: string;
  nivel?: string;
  tipo?: string;
};

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
  const [mostrarEscolhaTreino, setMostrarEscolhaTreino] = useState(false);
  const [carregandoTreinos, setCarregandoTreinos] = useState(false);
  const [treinos, setTreinos] = useState<TreinoOpcao[]>([]);

  const [diaSelecionado, setDiaSelecionado] = useState("");
  const [nivelSelecionado, setNivelSelecionado] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("");

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
      inputRef.current?.focus();
    };

    window.addEventListener("click", manterFoco);

    return () => {
      window.removeEventListener("click", manterFoco);
      clearInterval(timerRelogio);

      if (timeoutLeituraRef.current) clearTimeout(timeoutLeituraRef.current);
      if (resetTelaRef.current) clearTimeout(resetTelaRef.current);
      if (intervalResetRef.current) clearInterval(intervalResetRef.current);
    };
  }, []);

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

      if (!res.ok) return;
      setHistorico(Array.isArray(json) ? json : []);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const cancelarAutoReset = () => {
    if (resetTelaRef.current) clearTimeout(resetTelaRef.current);
    if (intervalResetRef.current) clearInterval(intervalResetRef.current);
    setSegundosReset(0);
  };

  const limparTelaDepois = () => {
    cancelarAutoReset();

    setSegundosReset(12);

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
      setResultado(null);
      setMostrarPerguntaImpressao(false);
      setMostrarEscolhaTreino(false);
      setTreinos([]);
      setDiaSelecionado("");
      setNivelSelecionado("");
      setTipoSelecionado("");
      setSegundosReset(0);
      inputRef.current?.focus();
    }, 12000);
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

  const carregarTreinos = async () => {
    try {
      setCarregandoTreinos(true);

      const res = await apiFetch("/api/treinos", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => []);

      if (!res.ok) {
        alert((json as any).error || "Erro ao carregar treinos");
        return;
      }

      const lista = Array.isArray(json) ? json : [];
      setTreinos(lista);
      setDiaSelecionado("");
      setNivelSelecionado("");
      setTipoSelecionado("");
      setMostrarEscolhaTreino(true);
    } finally {
      setCarregandoTreinos(false);
    }
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
          aluno_id: null,
          aluno: null,
          foto: null,
          motivo: (json as any).error || "Erro ao validar acesso",
        };

        setResultado(retornoErro);
        setMostrarPerguntaImpressao(false);
        setMostrarEscolhaTreino(false);
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

      if (retorno.liberado && retorno.aluno_id) {
        cancelarAutoReset();
        setMostrarPerguntaImpressao(true);
        setMostrarEscolhaTreino(false);
      } else {
        setMostrarPerguntaImpressao(false);
        setMostrarEscolhaTreino(false);
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

  const diasDisponiveis = useMemo(() => {
    return Array.from(
      new Set(
        treinos
          .map((item) => String(item.dia || "").trim())
          .filter(Boolean)
      )
    ).sort();
  }, [treinos]);

  const niveisDisponiveis = useMemo(() => {
    if (!diaSelecionado) return [];

    return Array.from(
      new Set(
        treinos
          .filter((item) => String(item.dia || "").trim() === diaSelecionado)
          .map((item) => String(item.nivel || "").trim())
          .filter(Boolean)
      )
    ).sort();
  }, [treinos, diaSelecionado]);

  const tiposDisponiveis = useMemo(() => {
    if (!diaSelecionado || !nivelSelecionado) return [];

    return Array.from(
      new Set(
        treinos
          .filter(
            (item) =>
              String(item.dia || "").trim() === diaSelecionado &&
              String(item.nivel || "").trim() === nivelSelecionado
          )
          .map((item) => String(item.tipo || "").trim())
          .filter(Boolean)
      )
    ).sort();
  }, [treinos, diaSelecionado, nivelSelecionado]);

  useEffect(() => {
    if (mostrarEscolhaTreino && diasDisponiveis.length === 1 && !diaSelecionado) {
      setDiaSelecionado(diasDisponiveis[0]);
    }
  }, [mostrarEscolhaTreino, diasDisponiveis, diaSelecionado]);

  useEffect(() => {
    if (niveisDisponiveis.length === 1 && diaSelecionado && !nivelSelecionado) {
      setNivelSelecionado(niveisDisponiveis[0]);
    }
  }, [niveisDisponiveis, diaSelecionado, nivelSelecionado]);

  useEffect(() => {
    if (tiposDisponiveis.length === 1 && diaSelecionado && nivelSelecionado && !tipoSelecionado) {
      setTipoSelecionado(tiposDisponiveis[0]);
    }
  }, [tiposDisponiveis, diaSelecionado, nivelSelecionado, tipoSelecionado]);

  const treinoSelecionado = useMemo(() => {
    if (!diaSelecionado || !nivelSelecionado || !tipoSelecionado) return null;

    return (
      treinos.find(
        (item) =>
          String(item.dia || "").trim() === diaSelecionado &&
          String(item.nivel || "").trim() === nivelSelecionado &&
          String(item.tipo || "").trim() === tipoSelecionado
      ) || null
    );
  }, [treinos, diaSelecionado, nivelSelecionado, tipoSelecionado]);

  const abrirImpressaoCupom = () => {
    if (!resultado?.aluno_id || !treinoSelecionado?.id) return;

    window.open(
      `/imprimir/rapido?aluno_id=${resultado.aluno_id}&treino_id=${treinoSelecionado.id}`,
      "_blank"
    );

    setMostrarPerguntaImpressao(false);
    setMostrarEscolhaTreino(false);
    limparTelaDepois();
  };

  return (
    <main className="min-h-screen bg-gray-100">
      <section className="bg-black text-white shadow-md">
        <div className="max-w-6xl mx-auto px-8 py-6 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center p-0 shadow">
              <img
                src="/logo-sistemas.png"
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
              if (e.key === "Enter") validar();
            }}
            placeholder="Leia o QR ou digite o código"
            className="w-full border-2 border-black/70 rounded-xl p-4 text-2xl text-center"
            autoFocus
          />

          <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <p className="text-xs text-gray-500 text-center md:text-left">
              Com leitura automática ativada, o sistema valida sozinho logo após a leitura.
            </p>

            {resultado && segundosReset > 0 ? (
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

      {mostrarPerguntaImpressao && resultado?.liberado && resultado?.aluno_id ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-black text-gray-900">
              Deseja imprimir treino atual?
            </h2>

            <p className="text-gray-500">
              {resultado.aluno ? `Aluno: ${resultado.aluno}` : ""}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={async () => {
                  setMostrarPerguntaImpressao(false);
                  await carregarTreinos();
                }}
                className="bg-black text-white rounded-xl py-3 font-semibold"
              >
                Sim
              </button>

              <button
                onClick={() => {
                  setMostrarPerguntaImpressao(false);
                  limparTelaDepois();
                }}
                className="border rounded-xl py-3 font-semibold"
              >
                Não
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {mostrarEscolhaTreino ? (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-gray-900">
                Escolher treino para imprimir
              </h2>

              <button
                onClick={() => {
                  setMostrarEscolhaTreino(false);
                  limparTelaDepois();
                }}
                className="border rounded-xl px-4 py-2"
              >
                Fechar
              </button>
            </div>

            {carregandoTreinos ? (
              <p className="text-gray-500">Carregando treinos...</p>
            ) : (
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Dia</label>
                    <select
                      value={diaSelecionado}
                      onChange={(e) => {
                        setDiaSelecionado(e.target.value);
                        setNivelSelecionado("");
                        setTipoSelecionado("");
                      }}
                      className="w-full border rounded-xl p-3"
                    >
                      <option value="">Selecione</option>
                      {diasDisponiveis.map((dia) => (
                        <option key={dia} value={dia}>
                          {dia}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Nível</label>
                    <select
                      value={nivelSelecionado}
                      onChange={(e) => {
                        setNivelSelecionado(e.target.value);
                        setTipoSelecionado("");
                      }}
                      className="w-full border rounded-xl p-3"
                      disabled={!diaSelecionado}
                    >
                      <option value="">Selecione</option>
                      {niveisDisponiveis.map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Tipo</label>
                    <select
                      value={tipoSelecionado}
                      onChange={(e) => setTipoSelecionado(e.target.value)}
                      className="w-full border rounded-xl p-3"
                      disabled={!diaSelecionado || !nivelSelecionado}
                    >
                      <option value="">Selecione</option>
                      {tiposDisponiveis.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {treinoSelecionado ? (
                  <div className="rounded-2xl border p-4 bg-gray-50">
                    <p className="font-semibold text-gray-900">
                      Treino: {treinoSelecionado.dia || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Nível: {treinoSelecionado.nivel || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tipo: {treinoSelecionado.tipo || "-"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Semana: {treinoSelecionado.semana || "-"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Selecione dia, nível e tipo para localizar o treino.
                  </p>
                )}

                <button
                  onClick={abrirImpressaoCupom}
                  disabled={!treinoSelecionado}
                  className="bg-black text-white rounded-xl px-5 py-3 font-semibold disabled:opacity-50"
                >
                  Imprimir cupom
                </button>
              </div>
            )}
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