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

function gerarVariacoesTelefone(numero: string) {
  const limpo = limparNumero(numero);
  const variacoes = new Set<string>();

  if (!limpo) return [];

  variacoes.add(limpo);

  if (limpo.startsWith("55")) {
    variacoes.add(limpo.slice(2));
  } else {
    variacoes.add(`55${limpo}`);
  }

  // com ou sem 9
  if (limpo.startsWith("55")) {
    const sem55 = limpo.slice(2);

    if (sem55.length === 10) {
      variacoes.add(`55${sem55.slice(0, 2)}9${sem55.slice(2)}`);
      variacoes.add(`${sem55.slice(0, 2)}9${sem55.slice(2)}`);
    }

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

export async function buscarAlunoPorTelefone(
  telefone: string
): Promise<AlunoDB | null> {
  const variacoes = gerarVariacoesTelefone(telefone);

  for (const numero of variacoes) {
    const { data, error } = await supabaseAdmin
      .from("alunos")
      .select("id, nome, academia_id, telefone, ativo, status")
      .eq("telefone", numero)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as AlunoDB;
    }
  }

  return null;
}