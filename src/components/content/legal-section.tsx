import type { ReactNode } from "react";

/**
 * A titled block of legal copy, for the few pages that are components rather
 * than CMS Markdown — the cookie page needs a live control in the middle of
 * its text, which Markdown cannot carry.
 */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-text text-xl font-semibold">{title}</h2>
      <div className="text-text mt-2 space-y-2 text-sm leading-relaxed">{children}</div>
    </section>
  );
}
