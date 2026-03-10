"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Permissao,
  PermissoesObjeto,
  temPermissao,
} from "@/lib/permissoes";

function lerPermissoesStorage(): Partial<PermissoesObjeto> | null {
  try {
    const raw = localStorage.getItem("treinoprint_permissoes");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function usePermissao(permissao: Permissao) {
  const [tipo, setTipo] = useState<string | null>(null);
  const [permissoesCustom, setPermissoesCustom] =
    useState<Partial<PermissoesObjeto> | null>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    const carregar = () => {
      const tipoStorage = localStorage.getItem("treinoprint_user_tipo");
      const permissoesStorage = lerPermissoesStorage();

      setTipo(tipoStorage);
      setPermissoesCustom(permissoesStorage);
      setCarregado(true);
    };

    carregar();

    window.addEventListener("storage", carregar);
    window.addEventListener("treinoprint-permissoes-updated", carregar);

    return () => {
      window.removeEventListener("storage", carregar);
      window.removeEventListener("treinoprint-permissoes-updated", carregar);
    };
  }, []);

  const permitido = useMemo(() => {
    if (!carregado) return false;
    return temPermissao(tipo, permissao, permissoesCustom);
  }, [tipo, permissao, permissoesCustom, carregado]);

  return {
    permitido,
    carregado,
    tipo,
    permissoesCustom,
  };
}