"use client";

import SystemError from "@/components/SystemError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-gray-100">
        <div className="min-h-screen p-6 flex items-center justify-center">
          <SystemError
            titulo="Erro inesperado"
            mensagem={error?.message || "Ocorreu um erro no sistema."}
            onTentarNovamente={reset}
          />
        </div>
      </body>
    </html>
  );
}