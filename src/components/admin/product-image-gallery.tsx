"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { media } from "@/lib/media";

interface ImageItem {
  id: string;
  cloudinary_public_id: string;
  alt_de: string | null;
  position: number;
}

interface ProductImageGalleryProps {
  productId: string;
  images: ImageItem[];
  onReorder?: () => void;
}

export function ProductImageGallery({
  productId,
  images: initialImages,
  onReorder,
}: ProductImageGalleryProps) {
  const [images, setImages] = useState(initialImages);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const callAction = async (action: string, payload: Record<string, string>): Promise<boolean> => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) fd.append(k, v);
    try {
      const res = await fetch(`/api/admin/product-images/${action}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Opération impossible sur l'image.");
        return false;
      }
      setError(null);
      onReorder?.();
      return true;
    } catch {
      setError("La communication avec le serveur a échoué.");
      return false;
    }
  };

  const move = (id: string, direction: "up" | "down") => {
    startTransition(async () => {
      const ok = await callAction("reorder", {
        image_id: id,
        product_id: productId,
        direction,
      });
      if (ok) window.location.reload();
    });
  };

  const remove = (id: string) => {
    if (!window.confirm("Bild wirklich löschen?")) return;
    startTransition(async () => {
      const ok = await callAction("delete", {
        image_id: id,
        product_id: productId,
      });
      if (ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
        window.location.reload();
      }
    });
  };

  if (images.length === 0) {
    return (
      <p className="text-muted py-6 text-center text-sm">
        Noch keine Bilder vorhanden.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      ) : null}
      {images.map((img, idx) => (
        <div
          key={img.id}
          className="bg-surface border-border flex items-center gap-3 rounded-lg border p-3"
        >
          <GripVertical className="text-muted/40 size-4 shrink-0" />
          <div className="bg-elevated relative h-16 w-16 shrink-0 overflow-hidden rounded-md">
            <Image
              src={media(img.cloudinary_public_id, { width: 128, height: 128, crop: "fill" })}
              alt={img.alt_de ?? ""}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-text truncate text-sm font-medium">
              {img.alt_de || "Kein Alt-Text"}
            </p>
            <p className="text-muted truncate text-xs font-mono">
              {img.cloudinary_public_id.replace("local:", "")}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={isPending || idx === 0}
              onClick={() => move(img.id, "up")}
              aria-label="Nach oben"
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={isPending || idx === images.length - 1}
              onClick={() => move(img.id, "down")}
              aria-label="Nach unten"
            >
              <ChevronDown className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-danger size-8"
              disabled={isPending}
              onClick={() => remove(img.id)}
              aria-label="Bild löschen"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
