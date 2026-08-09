"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

export function NewsletterSignup({ source, compact = false }: { source: "home" | "footer"; compact?: boolean }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/newsletter", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), consent: form.get("consent") === "on", source }) });
    const result = await response.json() as { message: string };
    setMessage(result.message); setLoading(false);
    if (response.ok) event.currentTarget.reset();
  }

  return <form onSubmit={submit} className={compact ? "flex flex-col gap-3" : "mx-auto max-w-md space-y-4"}>
    <div className={compact ? "grid gap-3" : "flex gap-3"}><input name="email" type="email" required placeholder="Ihre E-Mail-Adresse" aria-label="E-Mail-Adresse für Newsletter" className="h-12 min-w-0 flex-1 rounded-md border border-white/20 bg-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" /><button type="submit" disabled={loading} className="h-12 rounded-md bg-accent px-6 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:opacity-50">{loading ? "Wird gespeichert…" : "Anmelden"}</button></div>
    <label className="flex items-start gap-2 text-left text-xs text-white/60"><input name="consent" type="checkbox" required className="mt-0.5" /><span>Ich stimme der Verarbeitung meiner Daten für den Newsletter zu. Die <Link href="/datenschutz" className="underline hover:text-white">Datenschutzerklärung</Link> habe ich zur Kenntnis genommen.</span></label>
    {message ? <p role="status" className="text-sm text-white/80">{message}</p> : null}
  </form>;
}
