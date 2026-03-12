"use client";

type SplashScreenProps = {
  texto?: string;
};

export default function SplashScreen({
  texto = "Carregando sistema...",
}: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-[#05070b] flex items-center justify-center overflow-hidden">
      <div className="absolute -top-32 -left-20 w-[380px] h-[380px] rounded-full bg-[#7CFC00]/10 blur-3xl" />
      <div className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-[#7CFC00]/10 blur-3xl" />

      <div className="relative text-center px-6">
        <img
          src="/logo-sistema.png"
          alt="TreinoPrint"
          className="w-72 max-w-full mx-auto object-contain drop-shadow-2xl"
        />

        <p className="text-white/80 mt-6 text-sm tracking-wide">{texto}</p>

        <div className="mt-5 flex justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/15 border-t-[#7CFC00] animate-spin" />
        </div>
      </div>
    </div>
  );
}