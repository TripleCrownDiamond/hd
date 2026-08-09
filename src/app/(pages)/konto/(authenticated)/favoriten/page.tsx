import Link from "next/link";
import { WishlistPanel } from "@/components/commerce/wishlist-panel";

export default function FavoritesPage() {
  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted" aria-label="Brotkrümelnavigation">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/" className="hover:text-text">
              Startseite
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/konto" className="hover:text-text">
              Mein Konto
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-text">
            Merkliste
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="font-display text-3xl font-semibold text-text">Merkliste</h1>
        <p className="mt-2 text-muted">Gemerkte Produkte, um später darauf zurückzukommen.</p>
      </div>

      <WishlistPanel />

    </div>
  );
}
