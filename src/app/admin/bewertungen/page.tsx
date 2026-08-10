import { getMigrationAwareServerSupabase } from "@/lib/db/server";
import { AdminHeader, Field, EmptyAdmin, fieldClass, areaClass } from "@/components/admin/admin-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ReviewRow } from "@/lib/db/types";
import { saveReview, deleteReview } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES: Array<[string, string]> = [
  ["pending", "En attente"],
  ["approved", "Approuvé"],
  ["rejected", "Rejeté"],
];
const STATUS_VARIANT: Record<string, "warning" | "success" | "info"> = {
  pending: "warning",
  approved: "success",
  rejected: "info",
};

function ReviewForm({ review }: { review?: ReviewRow }) {
  return (
    <form action={saveReview} className="grid gap-4 md:grid-cols-2">
      {review && <input type="hidden" name="id" value={review.id} />}
      <Field label="Nom">
        <input name="author_name" defaultValue={review?.author_name ?? ""} className={fieldClass} required />
      </Field>
      <Field label="Ville (facultatif)">
        <input name="location" defaultValue={review?.location ?? ""} className={fieldClass} />
      </Field>
      <Field label="Étoiles (1–5)">
        <input
          name="rating"
          type="number"
          min={1}
          max={5}
          defaultValue={review?.rating ?? 5}
          className={fieldClass}
          required
        />
      </Field>
      <Field label="Date">
        <input
          name="reviewed_on"
          type="date"
          defaultValue={review?.reviewed_on ?? new Date().toISOString().slice(0, 10)}
          className={fieldClass}
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Titre (facultatif)">
          <input name="title" defaultValue={review?.title ?? ""} className={fieldClass} />
        </Field>
      </div>
      <div className="md:col-span-2">
        <Field label="Texte">
          <textarea name="body" defaultValue={review?.body ?? ""} className={areaClass} required />
        </Field>
      </div>
      <Field label="ID produit (facultatif)" hint="Vide = avis boutique sur la page d'accueil">
        <input name="product_id" defaultValue={review?.product_id ?? ""} className={fieldClass} />
      </Field>
      <Field label="Statut">
        <select name="status" defaultValue={review?.status ?? "approved"} className={fieldClass}>
          {STATUSES.map(([status, label]) => (
            <option key={status} value={status}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <label className="text-text flex items-center gap-2 text-sm md:col-span-2">
        <input type="checkbox" name="verified" defaultChecked={review?.verified ?? false} />
        Achat vérifié
      </label>
      <div className="md:col-span-2">
        <Button type="submit">{review ? "Enregistrer" : "Créer l'avis"}</Button>
      </div>
    </form>
  );
}

export default async function ReviewsAdminPage() {
  const supabase = await getMigrationAwareServerSupabase();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .order("reviewed_on", { ascending: false })
    .limit(200);
  const reviews = (data as ReviewRow[] | null) ?? [];

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Boutique"
        title="Avis"
        description="Avis clients. Seuls les avis approuvés apparaissent dans la boutique ; sans ID produit, ils sont considérés comme un avis boutique sur la page d'accueil."
      />

      <Card>
        <CardContent className="pt-6">
          <h2 className="text-text mb-4 font-medium">Nouvel avis</h2>
          <ReviewForm />
        </CardContent>
      </Card>

      {reviews.length === 0 ? (
        <EmptyAdmin>Aucun avis pour le moment.</EmptyAdmin>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[review.status]}>{STATUSES.find(([status]) => status === review.status)?.[1] ?? review.status}</Badge>
                      <strong>{review.author_name}</strong>
                      <span className="text-muted">
                        {"★".repeat(review.rating)}
                        {"☆".repeat(5 - review.rating)}
                      </span>
                      {review.product_id && <span className="text-muted text-xs">Produit</span>}
                    </span>
                    <span className="text-muted text-sm">{review.reviewed_on}</span>
                  </summary>
                  <p className="text-muted mt-3 text-sm">{review.body}</p>
                  <div className="mt-6">
                    <ReviewForm review={review} />
                  </div>
                  <form action={deleteReview} className="mt-3">
                    <input type="hidden" name="id" value={review.id} />
                    <Button variant="ghost" size="sm" className="text-danger">
                      Supprimer
                    </Button>
                  </form>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
