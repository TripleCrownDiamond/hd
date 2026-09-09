"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";

/**
 * Live search against the server for a list too large to ship to the browser
 * (the catalogue is ~2 700 products across 27 pages, so filtering what is on
 * screen would only ever search the current 100).
 *
 * Typing rewrites the `q` query param after a short pause and lets the server
 * component re-render. The pause matters: firing on every keystroke would queue
 * a request per character and let an early, slower response overwrite a later
 * one. Any page number is dropped — page 8 of the old result set is meaningless
 * against a new query.
 */
const DEBOUNCE_MS = 300;

export function SearchField({
  paramName = "q",
  placeholder,
  label,
}: {
  paramName?: string;
  placeholder?: string;
  label: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const inputId = useId();

  const urlValue = searchParams.get(paramName) ?? "";
  const [value, setValue] = useState(urlValue);
  // Distinguishes "the user is typing" from "the URL changed underneath us"
  // (back button, a filter dropdown submitting). Only the latter should
  // overwrite what is in the box.
  const typingRef = useRef(false);

  useEffect(() => {
    if (!typingRef.current) setValue(urlValue);
  }, [urlValue]);

  useEffect(() => {
    if (!typingRef.current) return;
    const timer = setTimeout(() => {
      typingRef.current = false;
      const next = new URLSearchParams(searchParams.toString());
      if (value.trim()) next.set(paramName, value.trim());
      else next.delete(paramName);
      next.delete("page");
      const query = next.toString();
      startTransition(() => {
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, paramName, pathname, router, searchParams]);

  const update = (next: string) => {
    typingRef.current = true;
    setValue(next);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="text-muted block text-xs font-medium">
        {label}
      </label>
      <div className="relative">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => update(event.target.value)}
          placeholder={placeholder}
          className="border-border bg-surface text-text placeholder:text-muted focus-visible:border-accent focus-visible:outline-accent h-10 w-full rounded-md border px-9 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-1"
        />
        {pending ? (
          <Loader2
            className="text-muted absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin"
            aria-hidden="true"
          />
        ) : value ? (
          <button
            type="button"
            onClick={() => update("")}
            aria-label="Effacer la recherche"
            className="text-muted hover:text-text absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
