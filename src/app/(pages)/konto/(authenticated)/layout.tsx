import type { ReactNode } from "react";
import Link from "next/link";
import { getMigrationAwareServerSupabase } from "@/lib/db/server";

// Only routes that exist today. Bestellungen/Adressen/Einstellungen pages are
// not built yet; pointing the menu at them would render a 404.
const accountNav = [
  { label: "Übersicht", href: "/konto" },
  { label: "Merkliste", href: "/konto/favoriten" },
];

/**
 * Whether the signed-in user may enter the admin area. Read in the layout so
 * the staff link only appears for staff — a customer's account stays clean.
 * A transient Supabase failure degrades to no admin link (never a crash).
 */
async function canAccessAdmin(): Promise<boolean> {
  try {
    const supabase = await getMigrationAwareServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("profile_id", user.id)
      .in("role", ["admin", "content_editor", "support", "logistics", "finance"])
      .limit(1)
      .maybeSingle();
    return Boolean(data);
  } catch {
    return false;
  }
}

export default async function AuthenticatedAccountLayout({ children }: { children: ReactNode }) {
  const admin = await canAccessAdmin();
  return (
    <div className="container-site py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <aside aria-label="Kontonavigation" className="md:sticky md:top-24 md:self-start">
          <nav className="rounded-xl border border-border bg-surface p-2 shadow-sm">
            <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col md:overflow-visible">
              {accountNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-elevated hover:text-text focus-visible:bg-elevated focus-visible:text-text"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              {admin ? (
                <li>
                  <Link
                    href="/admin"
                    className="block whitespace-nowrap rounded-md bg-brand/10 px-3 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/15 focus-visible:bg-brand/15 focus-visible:text-brand"
                  >
                    Administration
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
