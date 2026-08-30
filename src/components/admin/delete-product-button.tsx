"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProduct } from "@/app/admin/actions";
import { useTransition } from "react";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        if (
          !window.confirm(
            `Supprimer « ${productName} » ? Cette action est irréversible.`,
          )
        )
          return;
        startTransition(() => deleteProduct(formData));
      }}
    >
      <input type="hidden" name="id" value={productId} />
      <Button
        size="sm"
        variant="destructive"
        type="submit"
        disabled={pending}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </form>
  );
}
