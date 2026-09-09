"use client";

import { useId, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fieldClass } from "@/components/admin/admin-ui";

/**
 * A dropdown that filters by rewriting the URL, so it composes with the
 * debounced `SearchField` instead of fighting it. A plain GET <form> would
 * submit only the fields it contains and drop the live search term on every
 * change of filter.
 */
export function FilterSelect({
  name,
  label,
  value,
  options,
  allLabel,
}: {
  name: string;
  label: string;
  value: string;
  options: readonly (readonly [string, string])[];
  allLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const selectId = useId();

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set(name, next);
    else params.delete(name);
    // A page number from the previous result set does not survive a filter
    // change — page 8 of 27 may not exist once the set shrinks.
    params.delete("page");
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor={selectId} className="text-muted block text-xs font-medium">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(event) => change(event.target.value)}
        data-pending={pending ? "true" : undefined}
        className={`${fieldClass} data-[pending]:opacity-60`}
      >
        <option value="">{allLabel}</option>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
