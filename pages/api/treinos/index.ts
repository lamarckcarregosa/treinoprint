import { supabase } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method === "GET"){
    const { data, error } = await supabase.from("treinos").select("*");
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }

  if(req.method === "POST"){
    const treino = req.body;
    // Para armazenar array de exercicios como JSON
    const { data, error } = await supabase.from("treinos").insert([{...treino, exercicios:JSON.stringify(treino.exercicios)}]).select().single();
    if(error) return res.status(500).json({error:error.message});
    // Retornar com exercicios parseados
    data.exercicios = JSON.parse(data.exercicios);
    return res.status(200).json(data);
  }

  res.setHeader("Allow",["GET","POST"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}