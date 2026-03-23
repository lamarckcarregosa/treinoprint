import { supabaseAdmin } from "@/lib/supabase-admin";

export type AlunoDB = {
  id: number;
  nome: string;
  academia_id: string;
  telefone: string | null;
  ativo: boolean | null;
  status?: string | null;
};

function limparNumero(numero: string) {
  return String(numero || "").replace(/\D/g, "");
}

/**
 * Gera todas as variações possíveis de telefone
 * para garantir que encontre no banco independente do formato
 */
function gerarVariacoesTelefone(numero: string) {
  const limpo = limparNumero(numero);

  const variacoes = new Set<string>();

  if (!limpo) return [];

  // original
  variacoes.add(limpo);

  // com ou sem 55
  if (limpo.startsWith("55")) {
    variacoes.add(limpo.slice(2));
  } else {
    variacoes.add(`55${limpo}`);
  }

  // tratar presença ou ausência do 9
  if (limpo.startsWith("55")) {
    const sem55 = limpo.slice(2);

    // sem 9 → adicionar 9
    if (sem55.length === 10) {
      variacoes.add(`55${sem55.slice(0, 2)}9${sem55.slice(2)}`);
      variacoes.add(`${sem55.slice(0, 2)}9${sem55.slice(2)}`);
    }

    // com 9 → remover 9
    if (sem55.length === 11 && sem55[2] === "9") {
      variacoes.add(`55${sem55.slice(0, 2)}${sem55.slice(3)}`);
      variacoes.add(`${sem55.slice(0, 2)}${sem55.slice(3)}`);
    }
  } else {
    if (limpo.length === 10) {
      variacoes.add(`55${limpo}`);
      variacoes.add(`55${limpo.slice(0, 2)}9${limpo.slice(2)}`);
    }

    if (limpo.length === 11 && limpo[2] === "9") {
      variacoes.add(`55${limpo}`);
      variacoes.add(`55${limpo.slice(0, 2)}${limpo.slice(3)}`);
    }
  }

  return Array.from(variacoes);
}

/**
 * Busca aluno pelo telefone
 */
export async function buscarAlunoPorTelefone(
  telefone: string
): Promise<AlunoDB | null> {
  const variacoes = gerarVariacoesTelefone(telefone);

  console.log("Buscando aluno pelas variações:", variacoes);

  for (const numero of variacoes) {
    const { data, error } = await supabaseAdmin
      .from("alunos")
      .select("id, nome, academia_id, telefone, ativo, status")
      .eq("telefone", numero)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      console.log("Aluno encontrado:", data.nome);
      return data as AlunoDB;
    }
  }

  console.log("Aluno não encontrado");
  return null;
}

/**
 * Busca aluno por ID (útil pro painel admin)
 */
export async function buscarAlunoPorId(
  id: number
): Promise<AlunoDB | null> {
  const { data, error } = await supabaseAdmin
    .from("alunos")
    .select("id, nome, academia_id, telefone, ativo, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar aluno:", error.message);
    return null;
  }

  return (data as AlunoDB) || null;
}