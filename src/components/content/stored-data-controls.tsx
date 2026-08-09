"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Every key the storefront writes to the browser, with what it is for.
 *
 * Listing them by name is the honest version of a cookie table: the reader can
 * check the claim in their own dev tools. Keep in step with the stores — the
 * cart, shortlist and delivery providers each own one of these.
 */
const STORED_ITEMS = [
  {
    key: "holzkraft:cart",
    label: "Warenkorb",
    purpose: "Die Positionen, die Sie ausgewählt haben, bis zur Bestellung.",
  },
  {
    key: "holzkraft:wishlist",
    label: "Merkliste",
    purpose: "Produkte, die Sie sich gemerkt haben.",
  },
  {
    key: "holzkraft:compare",
    label: "Vergleichsliste",
    purpose: "Bis zu vier Kaminöfen, die Sie gegenüberstellen.",
  },
  {
    key: "holzkraft:delivery-postcode",
    label: "Postleitzahl",
    purpose: "Damit Liefergebiet und Versandkosten beim nächsten Besuch stimmen.",
  },
] as const;

export function StoredDataControls() {
  // Rendered on the server first, where there is no localStorage: start unknown
  // and fill in after mount so the markup matches on hydration.
  const [present, setPresent] = useState<Record<string, boolean> | null>(null);
  const [cleared, setCleared] = useState(false);

  const scan = () => {
    const found: Record<string, boolean> = {};
    for (const item of STORED_ITEMS) {
      try {
        found[item.key] = window.localStorage.getItem(item.key) !== null;
      } catch {
        found[item.key] = false;
      }
    }
    setPresent(found);
  };

  useEffect(scan, []);

  const clearAll = () => {
    for (const item of STORED_ITEMS) {
      try {
        window.localStorage.removeItem(item.key);
      } catch {
        // A browser with storage disabled has nothing to clear.
      }
    }
    setCleared(true);
    scan();
    // The stores hold their state in memory too, so a reload is what actually
    // empties the cart badge in the header.
    window.setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div>
      <ul className="mt-2 space-y-3">
        {STORED_ITEMS.map((item) => (
          <li key={item.key} className="border-border rounded-md border p-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-text font-medium">{item.label}</span>
              <span className="text-muted font-mono text-xs">{item.key}</span>
            </div>
            <p className="text-muted mt-1 text-sm">{item.purpose}</p>
            <p className="text-muted mt-1 text-xs">
              Technisch erforderlich · Speicherung im Browser, kein Ablaufdatum ·{" "}
              {present === null
                ? "Status wird geprüft"
                : present[item.key]
                  ? "derzeit gespeichert"
                  : "derzeit nicht gespeichert"}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={clearAll}>
          Alle gespeicherten Daten löschen
        </Button>
        <span className="text-muted text-sm" aria-live="polite">
          {cleared ? "Gelöscht. Die Seite wird neu geladen." : ""}
        </span>
      </div>
    </div>
  );
}
