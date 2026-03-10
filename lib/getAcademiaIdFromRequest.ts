import { NextRequest } from "next/server";

export function getAcademiaIdFromRequest(req: NextRequest) {
  const academiaId = req.headers.get("x-academia-id");

  if (!academiaId) {
    return null;
  }

  return academiaId;
}