import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminAccess } from "@/lib/auth/admin";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";

export async function POST(request: Request) {
  try {
    await requireAdminAccess(["admin", "content_editor"]);
    const formData = await request.formData();
    const imageId = z.string().uuid().parse(formData.get("image_id"));
    const productId = z.string().uuid().parse(formData.get("product_id"));
    const direction = z.enum(["up", "down"]).parse(formData.get("direction"));

    const supabase = await getMigrationAwareServerSupabase();
    const { data: images } = await supabase
      .from("product_media")
      .select("id,position")
      .eq("product_id", productId)
      .order("position", { ascending: true });
    if (!images || images.length < 2) {
      return NextResponse.json({ ok: true });
    }

    const idx = images.findIndex((img) => img.id === imageId);
    if (idx === -1) {
      return NextResponse.json({ error: "Bild nicht gefunden." }, { status: 404 });
    }

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= images.length) {
      return NextResponse.json({ ok: true });
    }

    const a = images[idx]!;
    const b = images[swapIdx]!;
    await supabase.from("product_media").update({ position: b.position }).eq("id", a.id);
    await supabase.from("product_media").update({ position: a.position }).eq("id", b.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
