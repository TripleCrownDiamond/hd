"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FilterGroup {
  id: string;
  /** Query-string parameter this group writes, e.g. `holzart`. */
  param: string;
  title: string;
  options: Array<{ value: string; label: string; count?: number }>;
}

/**
 * Filters live in the URL rather than in component state: the same links are
 * emitted by the header mega menu, the result is shareable, and the server
 * renders the already-filtered list.
 */
export function CatalogFilters({ groups }: { groups: FilterGroup[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hrefWith = (param: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value === null) next.delete(param);
    else next.set(param, value);
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const active = groups
    .map((group) => ({ group, value: searchParams.get(group.param) }))
    .filter((entry): entry is { group: FilterGroup; value: string } => entry.value !== null);

  return (
    <Card className="p-0">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-muted text-sm font-semibold tracking-wider uppercase">
          Filter
        </CardTitle>
        {active.length > 0 && (
          <Link
            href={pathname}
            className="text-accent focus-visible:outline-accent text-xs hover:underline focus-visible:outline-3 focus-visible:outline-offset-2"
          >
            Zurücksetzen
          </Link>
        )}
      </CardHeader>

      {active.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5 px-6 pb-3">
            {active.map(({ group, value }) => (
              <Link
                key={group.param}
                href={hrefWith(group.param, null)}
                className="bg-brand/10 text-brand hover:bg-brand/15 focus-visible:outline-accent inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors focus-visible:outline-3 focus-visible:outline-offset-2"
                aria-label={`Filter entfernen: ${value}`}
              >
                {value}
                <X className="size-3" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Separator />
        </>
      )}

      <CardContent className="p-0">
        <Accordion type="multiple" defaultValue={groups.map((g) => g.id)}>
          {groups.map((group) => {
            const selected = searchParams.get(group.param);
            return (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="border-b-0 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
              >
                <AccordionTrigger className="text-text px-6 text-sm font-semibold">
                  {group.title}
                  {selected && (
                    <Badge variant="accent" className="mr-2 ml-auto">
                      1
                    </Badge>
                  )}
                </AccordionTrigger>
                <AccordionContent className="px-6">
                  <ul className="space-y-1">
                    {group.options.map((option) => {
                      const isSelected = selected === option.label;
                      return (
                        <li key={option.value}>
                          <Link
                            href={hrefWith(group.param, isSelected ? null : option.label)}
                            aria-pressed={isSelected}
                            className={cn(
                              "focus-visible:outline-accent flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors focus-visible:outline-3 focus-visible:outline-offset-2",
                              isSelected
                                ? "bg-brand/10 text-brand font-medium"
                                : "text-text hover:bg-elevated",
                            )}
                          >
                            <span className="truncate">{option.label}</span>
                            {option.count !== undefined && (
                              <span className="text-muted shrink-0 font-mono text-xs tabular-nums">
                                {option.count}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
