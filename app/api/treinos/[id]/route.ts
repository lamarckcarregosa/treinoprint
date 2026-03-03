import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =============================
// DELETE - EXCLUIR TREINO
// =============================
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from("treinos_modelos")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}