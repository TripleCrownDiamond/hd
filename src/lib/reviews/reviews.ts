import "server-only";

/**
 * Reading approved customer reviews.
 *
 * Only `status = 'approved'` is ever public — the RLS policy enforces it, and
 * these helpers use the public client so they cannot accidentally read a
 * pending one. A review with a product drives that product's rating; a review
 * without one is a shop testimonial for the homepage.
 */

import { getMigrationAwarePublicSupabase } from "@/lib/db/server";
import type { ReviewRow } from "@/lib/db/types";

export interface Review {
  id: string;
  authorName: string;
  location: string | null;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  reviewedOn: string;
}

export interface RatingSummary {
  average: number;
  count: number;
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    authorName: row.author_name,
    location: row.location,
    rating: row.rating,
    title: row.title,
    body: row.body,
    verified: row.verified,
    reviewedOn: row.reviewed_on,
  };
}

/** Latest approved shop testimonials (reviews not tied to a product). */
export async function getShopReviews(limit = 6): Promise<Review[]> {
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .is("product_id", null)
    .order("reviewed_on", { ascending: false })
    .limit(limit);
  return ((data as ReviewRow[] | null) ?? []).map(toReview);
}

/** Approved reviews for one product. */
export async function getProductReviews(productId: string, limit = 20): Promise<Review[]> {
  const supabase = getMigrationAwarePublicSupabase();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "approved")
    .eq("product_id", productId)
    .order("reviewed_on", { ascending: false })
    .limit(limit);
  return ((data as ReviewRow[] | null) ?? []).map(toReview);
}

export function summarise(reviews: Review[]): RatingSummary | null {
  if (reviews.length === 0) return null;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { average: Math.round((total / reviews.length) * 10) / 10, count: reviews.length };
}
