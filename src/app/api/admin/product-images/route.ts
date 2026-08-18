import { NextResponse } from "next/server";
import { z } from "zod";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { requireAdminAccess } from "@/lib/auth/admin";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";

export async function POST(request: Request) {
  try {
    await requireAdminAccess(["admin", "content_editor"]);
    const formData = await request.formData();
    const productId = z.string().uuid().parse(formData.get("product_id"));
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Kein Bild hochgeladen." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Nur Bilddateien sind erlaubt." }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Maximale Dateigröße: 10 MB." }, { status: 400 });
    }

    const altText = String(formData.get("alt") ?? "").trim() || null;
    const ext = file.name.split(".").pop() ?? "webp";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const relPath = `products/${productId}/${filename}`;
    const absDir = join(process.cwd(), "public", "images", "products", productId);
    const absPath = join(absDir, filename);

    // Write file to public/images/products/<uuid>/
    await mkdir(absDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(absPath, bytes);

    const supabase = await getMigrationAwareServerSupabase();
    // Get current max position.
    const { data: existing } = await supabase
      .from("product_media")
      .select("position")
      .eq("product_id", productId)
      .order("position", { ascending: false })
      .limit(1);
    const nextPos = existing && existing.length > 0 ? (existing[0]?.position ?? 0) + 1 : 0;

    const { error: insertError } = await supabase.from("product_media").insert({
      product_id: productId,
      kind: "image",
      cloudinary_public_id: `local:${relPath}`,
      alt_de: altText,
      position: nextPos,
    });
    if (insertError) {
      return NextResponse.json({ error: "Bild konnte nicht gespeichert werden." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, path: relPath });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
