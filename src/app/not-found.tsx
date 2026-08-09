import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-site flex flex-col items-center justify-center py-24 text-center">
      <span className="font-display text-8xl font-semibold text-border">404</span>
      <h1 className="mt-4 font-display text-3xl font-semibold text-text">
        Seite nicht gefunden
      </h1>
      <p className="mt-3 max-w-md text-muted">
        Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Zur Startseite
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/brennholz">
            <ArrowLeft className="size-4" />
            Zum Sortiment
          </Link>
        </Button>
      </div>
    </div>
  );
}
