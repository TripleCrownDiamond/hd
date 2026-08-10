import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/account/login-form";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Melden Sie sich in Ihrem HolzDirekt-Konto an.",
};

export default function LoginPage() {
  return (
    <div className="bg-elevated/40 py-10 md:py-16">
      <div className="container-site">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand text-white">
              <Flame className="size-6 text-accent" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h1 className="font-display text-3xl font-semibold text-text">Willkommen zurück</h1>
            <p className="mt-2 text-sm text-muted">
              Melden Sie sich mit Ihrer E-Mail-Adresse an.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Suspense
                fallback={
                  <p className="text-muted py-8 text-center text-sm">Formular wird geladen …</p>
                }
              >
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-muted">
            Mit der Anmeldung akzeptieren Sie unsere{" "}
            <Link href="/agb" className="underline hover:text-text">
              AGB
            </Link>{" "}
            und die{" "}
            <Link href="/datenschutz" className="underline hover:text-text">
              Datenschutzerklärung
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
