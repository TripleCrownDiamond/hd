"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Wishlist ("Merkliste") and comparison ("Vergleich") lists.
 *
 * Both are the same shape — an ordered set of products the visitor picked — so
 * they share one store and one localStorage strategy. Entries carry enough to
 * render a card without another round-trip.
 */
export interface ShortlistEntry {
  slug: string;
  name: string;
  brand?: string;
  /** Cloudinary public id, empty when the product has no image. */
  image?: string;
  priceCents?: number;
  href: string;
  kind: "stove" | "wood" | "kindling" | "briquette" | "pellet" | "accessory";
  comparison?: {
    powerKwNominal: number | null;
    powerKwMin: number | null;
    powerKwMax: number | null;
    efficiencyPct: number | null;
    energyClass: string | null;
    fuel: string | null;
    heightMm: number | null;
    widthMm: number | null;
    depthMm: number | null;
    weightKg: number | null;
    flueDiameterMm: number | null;
  };
}

/** Comparing more than this stops fitting on screen and stops being useful. */
export const COMPARE_LIMIT = 4;

type ListName = "wishlist" | "compare";

interface ShortlistContextValue {
  wishlist: ShortlistEntry[];
  compare: ShortlistEntry[];
  has: (list: ListName, slug: string) => boolean;
  toggle: (list: ListName, entry: ShortlistEntry) => void;
  remove: (list: ListName, slug: string) => void;
  clear: (list: ListName) => void;
  /** False until localStorage has been read, so SSR and first paint agree. */
  hydrated: boolean;
  compareIsFull: boolean;
}

const ShortlistContext = createContext<ShortlistContextValue | null>(null);

const STORAGE_KEYS: Record<ListName, string> = {
  wishlist: "holzkraft:wishlist",
  compare: "holzkraft:compare",
};

function read(key: string): ShortlistEntry[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ShortlistEntry[]) : [];
  } catch {
    return [];
  }
}

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [wishlist, setWishlist] = useState<ShortlistEntry[]>([]);
  const [compare, setCompare] = useState<ShortlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setWishlist(read(STORAGE_KEYS.wishlist));
    setCompare(read(STORAGE_KEYS.compare));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
      window.localStorage.setItem(STORAGE_KEYS.compare, JSON.stringify(compare));
    } catch {
      // A full or blocked storage must not break the page.
    }
  }, [wishlist, compare, hydrated]);

  const setter = useCallback(
    (list: ListName) => (list === "wishlist" ? setWishlist : setCompare),
    [],
  );

  const toggle = useCallback(
    (list: ListName, entry: ShortlistEntry) => {
      setter(list)((current) => {
        if (current.some((item) => item.slug === entry.slug)) {
          return current.filter((item) => item.slug !== entry.slug);
        }
        // The comparison view keeps the earliest picks; the wishlist is unbounded.
        if (list === "compare" && current.length >= COMPARE_LIMIT) return current;
        return [...current, entry];
      });
    },
    [setter],
  );

  const remove = useCallback(
    (list: ListName, slug: string) => {
      setter(list)((current) => current.filter((item) => item.slug !== slug));
    },
    [setter],
  );

  const clear = useCallback((list: ListName) => setter(list)([]), [setter]);

  const value = useMemo<ShortlistContextValue>(
    () => ({
      wishlist,
      compare,
      has: (list, slug) =>
        (list === "wishlist" ? wishlist : compare).some((item) => item.slug === slug),
      toggle,
      remove,
      clear,
      hydrated,
      compareIsFull: compare.length >= COMPARE_LIMIT,
    }),
    [wishlist, compare, toggle, remove, clear, hydrated],
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlists(): ShortlistContextValue {
  const context = useContext(ShortlistContext);
  if (!context) throw new Error("useShortlists must be used inside ShortlistProvider");
  return context;
}
