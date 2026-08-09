import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** A five-star rating. Half-stars round to the nearest whole for the fill. */
export function ReviewStars({
  rating,
  size = "md",
  className,
}: {
  rating: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const filled = Math.round(rating);
  const px = size === "sm" ? "size-3.5" : "size-4";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} von 5 Sternen`}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          className={cn(px, index <= filled ? "fill-amber-400 text-amber-400" : "text-border")}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
