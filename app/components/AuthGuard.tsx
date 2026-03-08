"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type Props = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verificar = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, nome, usuario, tipo, academia_id")
        .eq("id", userId)
        .single();

      if (!mounted) return;

      if (error || !profile) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      localStorage.setItem("treinoprint_user_id", profile.id);
      localStorage.setItem("treinoprint_user_nome", profile.nome || "");
      localStorage.setItem("treinoprint_usuario", profile.usuario || "");
      localStorage.setItem("treinoprint_user_tipo", profile.tipo || "");
      localStorage.setItem("treinoprint_academia_id", profile.academia_id || "");

      setCarregando(false);
    };

    verificar();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-2xl shadow-lg px-6 py-4 text-gray-700">
          Carregando...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}