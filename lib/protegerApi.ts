import { NextRequest, NextResponse } from "next/server";
import { Permissao } from "./permissoes";
import { getAcademiaIdFromRequest } from "./getAcademiaIdFromRequest";
import { getProfileIdFromRequest } from "./getProfileIdFromRequest";
import { verificarPermissaoApi } from "./verificarPermissaoApi";

export async function protegerApi(req: NextRequest, permissao: Permissao) {
  const academiaId = getAcademiaIdFromRequest(req);
  const profileId = await getProfileIdFromRequest(req);

  if (!profileId) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Não autenticado" }, { status: 401 }),
      academiaId,
      profileId: null,
    };
  }

  const acesso = await verificarPermissaoApi(profileId, permissao, academiaId);

  if (!acesso.permitido) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
      academiaId,
      profileId,
    };
  }

  return {
    ok: true as const,
    response: null,
    academiaId,
    profileId,
  };
}