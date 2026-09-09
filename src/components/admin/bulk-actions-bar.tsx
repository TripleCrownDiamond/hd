"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { CheckSquare, Eye, EyeOff, Loader2, MinusSquare, Square, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProducts, setProductsPublished } from "@/app/admin/actions";

/**
 * Sticky bulk-actions bar above the product list. Listens to checkboxes named
 * "pid" inside the same <form> via DOM events, so the list itself stays a
 * server component and no product data has to cross to the client.
 */
export function BulkActionsBar({ totalLabel }: { totalLabel: string }) {
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const ref = useCallback((root: HTMLDivElement | null) => {
    if (!root) return;
    const form = root.closest("form");
    if (!form) return;
    formRef.current = form;
    const recalc = () => {
      const boxes = form.querySelectorAll<HTMLInputElement>('input[name="pid"]');
      setTotal(boxes.length);
      setCount([...boxes].filter((b) => b.checked).length);
    };
    recalc();
    form.addEventListener("change", recalc);
    return () => form.removeEventListener("change", recalc);
  }, []);

  const selectedIds = (): string[] => {
    const form = formRef.current;
    if (!form) return [];
    return [...form.querySelectorAll<HTMLInputElement>('input[name="pid"]:checked')].map(
      (b) => b.value,
    );
  };

  const toggleAll = () => {
    const form = formRef.current;
    if (!form) return;
    const boxes = form.querySelectorAll<HTMLInputElement>('input[name="pid"]');
    // Partial selection resolves to "select all" — the reverse would silently
    // throw away the choices already made.
    const next = count < boxes.length;
    boxes.forEach((b) => {
      b.checked = next;
    });
    form.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const clearSelection = () => {
    const form = formRef.current;
    if (!form) return;
    form.querySelectorAll<HTMLInputElement>('input[name="pid"]').forEach((b) => {
      b.checked = false;
    });
    form.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const run = (action: (fd: FormData) => Promise<void>, extra?: Record<string, string>) => {
    const ids = selectedIds();
    if (ids.length === 0) return;
    const fd = new FormData();
    fd.set("ids", ids.join(","));
    for (const [key, value] of Object.entries(extra ?? {})) fd.set(key, value);
    startTransition(() => action(fd));
  };

  const handleDelete = () => {
    if (count === 0) return;
    const msg =
      count === 1
        ? "Supprimer ce produit ? Cette action est irréversible."
        : `Supprimer ${count} produits ? Cette action est irréversible.`;
    if (!window.confirm(msg)) return;
    run(deleteProducts);
  };

  const allSelected = total > 0 && count === total;
  const SelectIcon = allSelected ? CheckSquare : count > 0 ? MinusSquare : Square;

  return (
    <div ref={ref} className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleAll}
          className="text-muted hover:text-text flex items-center gap-1.5 text-xs transition-colors"
        >
          <SelectIcon className="size-3.5" aria-hidden="true" />
          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
        </button>
        <span className="text-muted text-xs">{totalLabel}</span>
      </div>

      {count > 0 && (
        <div className="border-accent/30 bg-accent/10 sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 backdrop-blur">
          <span className="text-text text-sm font-medium">
            {count} produit{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
            {pending ? (
              <Loader2 className="ml-2 inline size-3.5 animate-spin align-[-2px]" aria-hidden="true" />
            ) : null}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(setProductsPublished, { published: "1" })}
            >
              <Eye className="size-3.5" />
              Publier
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => run(setProductsPublished, { published: "0" })}
            >
              <EyeOff className="size-3.5" />
              Dépublier
            </Button>
            <Button size="sm" variant="destructive" disabled={pending} onClick={handleDelete}>
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={clearSelection}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
