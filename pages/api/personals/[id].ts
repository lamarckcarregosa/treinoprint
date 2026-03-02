import { supabase } from "@/lib/supabase";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req:NextApiRequest,res:NextApiResponse){
  const { id } = req.query;

  if(req.method === "PUT"){
    const { nome } = req.body;
    const { data, error } = await supabase.from("personals").update({ nome }).eq("id", id).select().single();
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json(data);
  }

  if(req.method === "DELETE"){
    const { error } = await supabase.from("personals").delete().eq("id", id);
    if(error) return res.status(500).json({error:error.message});
    return res.status(200).json({message:"Personal deletado"});
  }

  res.setHeader("Allow",["PUT","DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}