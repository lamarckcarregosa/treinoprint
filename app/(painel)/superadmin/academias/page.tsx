"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const academiaId =
    typeof window !== "undefined"
      ? localStorage.getItem("treinoprint_academia_id")
      : null;

  const headers = new Headers(init?.headers || {});
  if (academiaId) headers.set("x-academia-id", academiaId);

  return fetch(input, {
    ...init,
    headers,
  });
}

export default function SuperAdminAcademiasPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [adminNome, setAdminNome] = useState("");
  const [adminUsuario, setAdminUsuario] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminSenha, setAdminSenha] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erro, setErro] = useState("");

  const uploadLogo = async (file: File) => {
    try {
      setEnviandoLogo(true);
      setErro("");

      const extensao = file.name.split(".").pop() || "png";
      const nomeArquivo = `novas-academias/logo-${Date.now()}.${extensao}`;

      const { error: uploadError } = await supabase.storage
        .from("academias")
        .upload(nomeArquivo, file, {
          upsert: true,
        });

      if (uploadError) {
        setErro(uploadError.message || "Erro ao enviar logo");
        return;
      }

      const { data } = supabase.storage
        .from("academias")
        .getPublicUrl(nomeArquivo);

      setLogoUrl(data.publicUrl);
    } catch (error: any) {
      setErro(error?.message || "Erro ao enviar logo");
    } finally {
      setEnviandoLogo(false);
    }
  };

  const criarAcademia = async () => {
    try {
      setErro("");
      setSalvando(true);

      const res = await apiFetch("/api/superadmin/academias/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          telefone,
          email,
          endereco,
          cnpj,
          logo_url: logoUrl,
          admin_nome: adminNome,
          admin_usuario: adminUsuario,
          admin_email: adminEmail,
          admin_senha: adminSenha,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErro(json.error || "Erro ao criar academia");
        return;
      }

      alert("Academia criada com sucesso");

      setNome("");
      setTelefone("");
      setEmail("");
      setEndereco("");
      setCnpj("");
      setLogoUrl("");
      setAdminNome("");
      setAdminUsuario("");
      setAdminEmail("");
      setAdminSenha("");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <main className="p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Super Admin</h1>
          <p className="text-gray-500 mt-2">
            Criar academia completa com admin, personal, alunos e treinos teste
          </p>
        </div>

        <button
          onClick={() => router.push("/superadmin")}
          className="bg-black text-white px-5 py-3 rounded-xl"
        >
          Voltar
        </button>
      </div>

      <section className="bg-white rounded-2xl shadow p-6 border border-black/5 space-y-6">
        <div>
          <h2 className="text-xl font-bold">Dados da academia</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da academia"
            className="border rounded-xl p-3"
          />

          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone"
            className="border rounded-xl p-3"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail da academia"
            className="border rounded-xl p-3"
          />

          <input
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            placeholder="CNPJ"
            className="border rounded-xl p-3"
          />

          <input
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Endereço"
            className="border rounded-xl p-3 md:col-span-2"
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Upload da logo
            </label>
            <input
              type="file"
              accept="image/*"
              className="border rounded-xl p-3 w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            {enviandoLogo ? (
              <p className="text-sm text-gray-500 mt-2">Enviando logo...</p>
            ) : null}
          </div>

          <input
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="URL da logo"
            className="border rounded-xl p-3 md:col-span-2"
          />
        </div>

        {logoUrl ? (
          <div>
            <p className="text-sm font-semibold text-gray-600 mb-2">Preview da logo</p>
            <img
              src={logoUrl}
              alt="Logo"
              className="h-24 object-contain border rounded-xl p-2 bg-white"
            />
          </div>
        ) : null}

        <div>
          <h2 className="text-xl font-bold">Usuário administrador</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={adminNome}
            onChange={(e) => setAdminNome(e.target.value)}
            placeholder="Nome do admin"
            className="border rounded-xl p-3"
          />

          <input
            value={adminUsuario}
            onChange={(e) => setAdminUsuario(e.target.value)}
            placeholder="Usuário do admin"
            className="border rounded-xl p-3"
          />

          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="E-mail do admin"
            className="border rounded-xl p-3"
          />

          <input
            type="password"
            value={adminSenha}
            onChange={(e) => setAdminSenha(e.target.value)}
            placeholder="Senha inicial"
            className="border rounded-xl p-3"
          />
        </div>

        <div className="rounded-2xl bg-gray-50 border p-4 text-sm text-gray-700">
          <p className="font-semibold mb-2">Essa criação automática já vai incluir:</p>
          <ul className="space-y-1">
            <li>• Personal teste</li>
            <li>• Aluno teste 01</li>
            <li>• Aluno teste 02</li>
            <li>• Aluno teste 03</li>
            <li>• Treino teste: Segunda / Iniciante / Masculino</li>
            <li>• Treino teste: Segunda / Iniciante / Feminino</li>
          </ul>
        </div>

        {erro ? <p className="text-sm text-red-600">{erro}</p> : null}

        <button
          onClick={criarAcademia}
          disabled={salvando}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl disabled:opacity-60"
        >
          {salvando ? "Criando..." : "Criar academia completa"}
        </button>
      </section>
    </main>
  );
}