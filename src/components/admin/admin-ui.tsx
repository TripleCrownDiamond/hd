import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

export function AdminHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-muted text-sm">{eyebrow}</p><h1 className="text-text mt-1 font-display text-3xl font-semibold">{title}</h1><p className="text-muted mt-2 max-w-3xl">{description}</p></div>{actions}</div>;
}

export function EmptyAdmin({ children }: { children: ReactNode }) {
  return <Card><CardContent className="text-muted py-12 text-center text-sm">{children}</CardContent></Card>;
}

export const fieldClass = "border-border bg-surface text-text focus-visible:outline-accent h-11 w-full rounded-md border px-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-2";
export const areaClass = "border-border bg-surface text-text focus-visible:outline-accent min-h-28 w-full rounded-md border p-3 text-sm focus-visible:outline-3 focus-visible:outline-offset-2";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="text-text grid gap-1.5 text-sm font-medium">{label}{children}{hint ? <span className="text-muted text-xs font-normal">{hint}</span> : null}</label>;
}
