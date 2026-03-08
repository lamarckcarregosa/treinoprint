"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../context/authcontext";

export default function PrivateRoute({ children }: any){

  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(()=>{
    if(!loading && !user){
      router.push("/login");
    }
  },[user,loading]);

  if(loading) return <div>Carregando...</div>;

  return user ? children : null;
}
