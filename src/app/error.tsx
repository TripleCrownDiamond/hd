"use client";

import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-site flex flex-col items-center justify-center py-24 text-center">
      <span className="font-display text-8xl font-semibold text-border">!</span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-text">
        Ein Fehler ist aufgetreten
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Entschuldigung, etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.
      </p>
      <Button className="mt-8" onClick={reset}>
        <RotateCcw className="size-4" />
        Erneut versuchen
      </Button>
    </div>
  );
}
