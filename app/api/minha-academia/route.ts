import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase-server";
import { protegerApi } from "../../../lib/protegerApi";

export async function GET(req: NextRequest) {
try {
const auth = await protegerApi(req, "sistema");
if (!auth.ok) return auth.response;

const academiaId = auth.academiaId;

if (!academiaId) {
return NextResponse.json(
{ error: "Academia não informada" },
{ status: 400 }
);
}

const { data, error } = await supabaseServer
.from("academias")
.select("id, nome, logo_url, telefone, email, endereco, cnpj, plano, limite_alunos, slug, ativa")
.eq("id", academiaId)
.single();

if (error || !data) {
return NextResponse.json(
{ error: error?.message || "Academia não encontrada" },
{ status: 404 }
);
}

return NextResponse.json(data);
} catch (error: any) {
return NextResponse.json(
{ error: error.message || "Erro ao carregar academia" },
{ status: 400 }
);
}
}

export async function PUT(req: NextRequest) {
try {
const auth = await protegerApi(req, "sistema");
if (!auth.ok) return auth.response;

const academiaId = auth.academiaId;

if (!academiaId) {
return NextResponse.json(
{ error: "Academia não informada" },
{ status: 400 }
);
}

const body = await req.json();

const payload = {
nome: String(body?.nome || "").trim(),
telefone: String(body?.telefone || "").trim(),
email: String(body?.email || "").trim(),
endereco: String(body?.endereco || "").trim(),
cnpj: String(body?.cnpj || "").trim(),
logo_url: String(body?.logo_url || "").trim(),
};

if (!payload.nome) {
return NextResponse.json(
{ error: "Nome da academia é obrigatório" },
{ status: 400 }
);
}

const { data, error } = await supabaseServer
.from("academias")
.update(payload)
.eq("id", academiaId)
.select("id, nome, logo_url, telefone, email, endereco, cnpj, plano, limite_alunos, slug, ativa")
.single();

if (error || !data) {
return NextResponse.json(
{ error: error?.message || "Erro ao atualizar academia" },
{ status: 500 }
);
}

return NextResponse.json(data);
} catch (error: any) {
return NextResponse.json(
{ error: error.message || "Erro ao salvar academia" },
{ status: 400 }
);
}
}