"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * Instant client-side filter for a list that is already fully rendered
 * (customers, orders, invoices…). Rows opt in by carrying a `data-search`
 * attribute holding the text to match; anything without one is left alone, so
 * headers and separators inside the container never disappear.
 *
 * Server-side search would be the right call for a list that outgrows its page
 * — see the debounced `SearchField` used by the paginated product catalogue.
 */
export function ListSearch({
  targetId,
  placeholder = "Filtrer la liste…",
  label = "Filtrer",
}: {
  targetId: string;
  placeholder?: string;
  label?: string;
}) {
  const [value, setValue] = useState("");
  const [matches, setMatches] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  const apply = useCallback(
    (next: string) => {
      setValue(next);
      const root = document.getElementById(targetId);
      if (!root) return;
      const needle = next.trim().toLowerCase();
      const rows = root.querySelectorAll<HTMLElement>("[data-search]");
      let visible = 0;
      rows.forEach((row) => {
        const hit = !needle || (row.dataset.search ?? "").toLowerCase().includes(needle);
        // `hidden` keeps filtered-out rows out of the accessibility tree too,
        // so a screen reader counts the same list a sighted user sees.
        row.hidden = !hit;
        if (hit) visible += 1;
      });
      setMatches(needle ? visible : null);
    },
    [targetId],
  );

  const clear = () => {
    apply("");
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id={inputId}
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => apply(event.target.value)}
          placeholder={placeholder}
          className="border-border bg-surface text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline-accent h-10 w-full rounded-md border px-9 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        />
        {value ? (
          <button
            type="button"
            onClick={clear}
            aria-label="Effacer le filtre"
            className="text-muted hover:text-text absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <p className="text-muted text-xs" role="status" aria-live="polite">
        {matches === null
          ? "\u00a0"
          : matches === 0
            ? "Aucun résultat pour ce filtre."
            : `${matches} résultat${matches > 1 ? "s" : ""} affiché${matches > 1 ? "s" : ""}.`}
      </p>
    </div>
  );
}
