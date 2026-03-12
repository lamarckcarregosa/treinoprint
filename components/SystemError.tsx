"use client";

type SystemErrorProps = {
  titulo?: string;
  mensagem?: string;
  onTentarNovamente?: () => void;
};

export default function SystemError({
  titulo = "Ops! Algo deu errado",
  mensagem = "Não foi possível carregar as informações.",
  onTentarNovamente,
}: SystemErrorProps) {
  return (
    <div className="min-h-[300px] w-full flex items-center justify-center">
      <div className="bg-white border border-red-100 rounded-3xl shadow p-8 max-w-xl w-full text-center">
        <img
          src="/logo-sistema.png"
          alt="TreinoPrint"
          className="w-28 max-w-full mx-auto object-contain opacity-90"
        />

        <h2 className="text-2xl font-black text-red-600 mt-5">{titulo}</h2>
        <p className="text-gray-600 mt-3">{mensagem}</p>

        {onTentarNovamente ? (
          <button
            onClick={onTentarNovamente}
            className="mt-6 bg-black text-white px-5 py-3 rounded-xl hover:bg-gray-800 transition"
          >
            Tentar novamente
          </button>
        ) : null}
      </div>
    </div>
  );
}