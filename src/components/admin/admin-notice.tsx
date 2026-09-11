/**
 * One-line confirmation banner shared by every admin screen.
 *
 * Admin server actions do their work then `redirect()` back to the page with a
 * `notice` (success) or `error` query parameter. Each page reads them with
 * `readFeedback()` and renders this component, so a CRUD operation is never a
 * silent no-op: the operator always sees whether it worked.
 */
export function AdminNotice({
  notice,
  error,
}: {
  notice?: string | null;
  error?: string | null;
}) {
  if (error) {
    return (
      <div
        role="alert"
        className="border-danger/20 bg-danger/5 text-danger rounded-md border px-4 py-3 text-sm"
      >
        {error}
      </div>
    );
  }
  if (notice) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-success/30 bg-success/10 text-success rounded-md border px-4 py-3 text-sm"
      >
        {notice}
      </div>
    );
  }
  return null;
}

/** Extract the `notice` / `error` query parameters from a page's searchParams. */
export function readFeedback(
  search: Record<string, string | string[] | undefined> | undefined,
): { notice: string | null; error: string | null } {
  const first = (key: string): string | null => {
    const value = search?.[key];
    return typeof value === "string" && value.trim() ? value : null;
  };
  return { notice: first("notice"), error: first("error") };
}