"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Passwort</Label>
          <Link
            href="/konto/passwort-vergessen"
            className="text-xs text-accent hover:underline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
          >
            Passwort vergessen?
          </Link>
        </div>
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

      <div className="flex items-center gap-2">
        <Checkbox id="remember" name="remember" />
        <Label htmlFor="remember" className="text-sm font-normal text-muted">
          Angemeldet bleiben
        </Label>
      </div>

      <Button type="submit" fullWidth loading={loading}>
        Anmelden
      </Button>

      <Separator className="my-2" />

      <p className="text-center text-sm text-muted">
        Noch kein Konto?{" "}
        <Link
          href="/konto/registrieren"
          className="font-medium text-accent hover:underline focus-visible:outline-3 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          Konto erstellen
        </Link>
      </p>
    </form>
  );
}
