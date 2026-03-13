"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProtegePagina from "@/components/ProtegePagina";
import { apiFetch } from "@/lib/apiFetch";

type Permissoes = {
  dashboard: boolean;
  alunos: boolean;
  personais: boolean;
  treinos: boolean;
  imprimir: boolean;
  pagamentos: boolean;
  financeiro: boolean;
  sistema: boolean;
  superadmin: boolean;
  alterar_senha: boolean;
  avaliacoes: boolean;
};

type UsuarioPermissao = {
  id: string;
  nome: string;
  usuario: string;
  tipo: string;
  ativo?: boolean;
  permissoes: Permissoes;
};

const colunas: { chave: keyof Permissoes; label: string }[] = [
  { chave: "dashboard", label: "Dashboard" },
  { chave: "alunos", label: "Alunos" },
  { chave: "personais", label: "Personais" },
  { chave: "treinos", label: "Treinos" },
  { chave: "imprimir", label: "Imprimir" },
  { chave: "pagamentos", label: "Pagamentos" },
  { chave: "financeiro", label: "Financeiro" },
  { chave: "sistema", label: "Sistema" },
  { chave: "alterar_senha", label: "Senha" },
  { chave: "avaliacoes", label: "Avaliações" },
];

function PermissoesPageContent() {
  const router = useRouter();
  const [lista, setLista] = useState<UsuarioPermissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState("");
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setErro("");
      const res = await apiFetch("/api/sistema/permissoes", { cache: "no-store" });
      const json = await res.json().catch(() => []);

      if (!res.ok) {
        setErro((json as any).error || "Erro ao carregar permissões");
        return;
      }

      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Erro ao carregar permissões");
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        await carregar();
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const atualizarPermissao = (
    userId: string,
    chave: keyof Permissoes,
    valor: boolean
  ) => {
    setLista((prev) =>
      prev.map((item) =>
        item.id === userId
          ? {
              ...item,
              permissoes: {
                ...item.permissoes,
                [chave]: valor,
              },
            }
          : item
      )
    );
  };

  const salvar = async (item: UsuarioPermissao) => {
    try {
      setSalvandoId(item.id);

      const res = await apiFetch("/api/sistema/permissoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile_id: item.id,
          permissoes: item.permissoes,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert((json as any).error || "Erro ao salvar permissões");
        return;
      }

      alert(`Permissões de ${item.nome} salvas com sucesso`);
      await carregar();
    } finally {
      setSalvandoId("");
    }
  };

  if (loading) {
    return <p className="p-6">Carregando permissões...</p>;
  }

  return (
    <main className="p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Permissões</h1>
          <p className="text-gray-500 mt-2">
            Controle visual de acesso por usuário da academia
          </p>
        </div>

        <button
          onClick={() => router.push("/sistema")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5">
        {lista.length === 0 ? (
          <p className="text-gray-500">Nenhum usuário encontrado.</p>
        ) : (
          <div className="space-y-6">
            {lista.map((item) => (
              <div key={item.id} className="border rounded-2xl p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      @{item.usuario} • {item.tipo}
                    </p>
                  </div>

                  <button
                    onClick={() => salvar(item)}
                    disabled={salvandoId === item.id}
                    className="bg-black text-white px-4 py-2 rounded-xl disabled:opacity-60"
                  >
                    {salvandoId === item.id ? "Salvando..." : "Salvar permissões"}
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {colunas.map((coluna) => (
                    <label
                      key={coluna.chave}
                      className="flex items-center gap-3 border rounded-xl px-3 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={!!item.permissoes[coluna.chave]}
                        onChange={(e) =>
                          atualizarPermissao(item.id, coluna.chave, e.target.checked)
                        }
                      />
                      <span className="text-sm">{coluna.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function PermissoesPage() {
  return (
    <ProtegePagina permissao="sistema">
      <PermissoesPageContent />
    </ProtegePagina>
  );
}