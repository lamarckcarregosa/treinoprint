"use client";

type SystemLoaderProps = {
  titulo?: string;
  subtitulo?: string;
};

export default function SystemLoader({
  titulo = "TreinoPrint",
  subtitulo = "Carregando informações...",
}: SystemLoaderProps) {
  return (
    <div className="min-h-[300px] w-full flex items-center justify-center">
      <div className="text-center px-6">
        <img
          src="/logo-sistema.png"
          alt="TreinoPrint"
          className="w-40 max-w-full mx-auto object-contain"
        />

        <h2 className="text-2xl font-black text-gray-900 mt-5">{titulo}</h2>
        <p className="text-gray-500 mt-2">{subtitulo}</p>

        <div className="mt-5 flex justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-black/10 border-t-[#7CFC00] animate-spin" />
        </div>
      </div>
    </div>
  );
}