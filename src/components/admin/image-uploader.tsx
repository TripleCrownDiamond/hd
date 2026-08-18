"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  productId: string;
  onUploaded?: () => void;
}

export function ImageUploader({ productId, onUploaded }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      setError("Nur Bilddateien (JPEG, PNG, WebP) sind erlaubt.");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("Die Datei darf maximal 10 MB groß sein.");
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("product_id", productId);
      fd.append("file", file);
      fd.append("alt", altText);
      const res = await fetch("/api/admin/product-images", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Upload fehlgeschlagen.");
      }
      setFile(null);
      setPreview(null);
      setAltText("");
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-border bg-surface flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "hover:border-brand/40"
        }`}
      >
        <Upload className="text-muted size-8" />
        <p className="text-muted text-sm">
          Bild hierher ziehen oder <span className="text-accent font-medium">klicken</span>
        </p>
        <p className="text-muted/60 text-xs">JPEG, PNG oder WebP · max. 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {preview && (
        <div className="bg-elevated/40 rounded-lg p-4">
          <div className="flex gap-4">
            <div className="bg-surface border-border relative h-32 w-32 shrink-0 overflow-hidden rounded-md border">
              <Image
                src={preview}
                alt="Vorschau"
                fill
                sizes="128px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-text truncate text-sm font-medium">{file?.name}</p>
              <p className="text-muted text-xs">
                {file ? `${(file.size / 1024).toFixed(0)} KB` : ""}
              </p>
              <label className="text-text grid gap-1 text-sm">
                Alt-Text
                <input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Beschreibung des Bildes"
                  className="border-border bg-surface text-text h-9 rounded-md border px-3 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={upload}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Upload className="size-4" />
                  )}
                  {uploading ? "Wird hochgeladen…" : "Hochladen"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setAltText("");
                  }}
                >
                  <X className="size-4" />
                  Abbrechen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-danger text-sm" role="alert">{error}</p>
      )}
    </div>
  );
}
