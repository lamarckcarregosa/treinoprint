import { supabase } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const { id } = req.query;

  if(req.method === "PUT"){
    const treino = req.body;
    const { data, error } = await supabase.from("treinos")
      .update({...treino, exercicios:JSON.stringify(treino.exercicios)})
      .eq("id", id)
      .select()
      .single();
    if(error) return res.status(500).json({error:error.message});
    data.exercicios = JSON.parse(data.exercicios);
    return res.status(200).json(data);
  }

  if(req.method === "DELETE"){
    const { error } = await supabase.from("treinos").delete().eq("id", id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({message:"Treino deletado"});
  }

  res.setHeader("Allow",["PUT","DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}