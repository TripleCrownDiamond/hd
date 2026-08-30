"use client";

import { useState, useRef, useCallback } from "react";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProducts } from "@/app/admin/actions";
import { useTransition } from "react";

/**
 * Renders a sticky bulk-actions bar above the product list. Listens to
 * checkboxes named "pid" inside the same <form> via DOM events.
 */
export function BulkActionsBar({ totalLabel }: { totalLabel: string }) {
  const [count, setCount] = useState(0);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const ref = useCallback((root: HTMLDivElement | null) => {
    if (!root) return;
    const form = root.closest("form");
    if (!form) return;
    formRef.current = form;
    const recalc = () => {
      const checked = form.querySelectorAll<HTMLInputElement>(
        'input[name="pid"]:checked',
      );
      setCount(checked.length);
    };
    recalc();
    form.addEventListener("change", recalc);
    return () => form.removeEventListener("change", recalc);
  }, []);

  const selectAll = () => {
    const form = formRef.current;
    if (!form) return;
    const boxes = form.querySelectorAll<HTMLInputElement>(
      'input[name="pid"]',
    );
    const allChecked = [...boxes].every((b) => b.checked);
    boxes.forEach((b) => {
      b.checked = !allChecked;
    });
    setCount(allChecked ? 0 : boxes.length);
    form.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const handleDelete = () => {
    const form = formRef.current;
    if (!form || count === 0) return;
    const msg =
      count === 1
        ? "Supprimer ce produit ? Cette action est irréversible."
        : `Supprimer ${count} produits ? Cette action est irréversible.`;
    if (!window.confirm(msg)) return;
    const ids = [
      ...form.querySelectorAll<HTMLInputElement>(
        'input[name="pid"]:checked',
      ),
    ]
      .map((b) => b.value)
      .join(",");
    const fd = new FormData();
    fd.set("ids", ids);
    startTransition(() => deleteProducts(fd));
  };

  return (
    <div ref={ref}>
      {count > 0 && (
        <div className="bg-accent/10 border-accent/30 sticky top-0 z-10 flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <span className="text-text text-sm font-medium">
            {count} produit{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={pending}
            >
              <Trash2 className="size-3.5" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={selectAll}
        className="text-muted hover:text-text flex items-center gap-1 text-xs"
      >
        {count > 0 ? (
          <CheckSquare className="size-3.5" />
        ) : (
          <Square className="size-3.5" />
        )}
        Tout sélectionner
      </button>
    </div>
  );
}
