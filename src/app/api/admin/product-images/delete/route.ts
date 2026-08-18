import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/auth/admin";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";

export async function POST(request: Request) {
  try {
    await requireAdminAccess(["admin", "content_editor"]);
    const formData = await request.formData();
    const imageId = z.string().uuid().parse(formData.get("image_id"));
    const supabase = await getMigrationAwareServerSupabase();
    const { error } = await supabase.from("product_media").delete().eq("id", imageId);
    if (error) {
      return NextResponse.json({ error: "Bild konnte nicht gelöscht werden." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
