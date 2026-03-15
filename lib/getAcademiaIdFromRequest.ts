import { NextRequest } from "next/server";

export function getAcademiaIdFromRequest(req: NextRequest) {
  const headerId = req.headers.get("x-academia-id");
  if (headerId && String(headerId).trim() !== "") {
    return String(headerId).trim();
  }

  const url = new URL(req.url);
  const queryId = url.searchParams.get("academia_id");
  if (queryId && String(queryId).trim() !== "") {
    return String(queryId).trim();
  }

  throw new Error("academia_id não informado");
}