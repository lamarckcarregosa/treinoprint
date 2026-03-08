import { NextRequest } from "next/server";

export function getAcademiaIdFromRequest(req: NextRequest) {
  const academiaId = req.headers.get("x-academia-id");

  if (!academiaId) {
    throw new Error("Academia não informada no header");
  }

  return academiaId;
}