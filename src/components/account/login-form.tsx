"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserSupabase } from "@/lib/db/client";

/**
 * The storefront login — and, via the `?next=` parameter, the admin entry.
 *
 * The admin layout redirects anonymous visitors to `/konto/anmelden?next=/admin`,
 * so this form is the single door into the CMS. It signs in against Supabase and
 * then sends the session cookie along to the requested page.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only same-site paths are acceptable: an absolute or protocol-relative value
  // would turn a successful login into an open redirect.
  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/konto";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Bitte E-Mail-Adresse und Passwort eingeben.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await getBrowserSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      if (signInError.message.includes("Invalid login credentials")) {
        setError("E-Mail-Adresse oder Passwort ist falsch.");
      } else if (signInError.message.includes("Email not confirmed")) {
        setError("Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.");
      } else {
        setError("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="ihre@email.de"
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Passwort</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="pl-10"
          />
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth loading={loading}>
        Anmelden
      </Button>
    </form>
  );
}
