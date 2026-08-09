"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCart } from "@/lib/cart/cart-store";
import { checkDelivery, type DeliveryCheck } from "./client";

/**
 * The delivery postcode, shared by the cart and the checkout.
 *
 * Both need the same answer: the summary shows what shipping will cost, and
 * the checkout charges it. Keeping one postcode in one place is what stops the
 * two from disagreeing, and persisting it means a visitor who checked their
 * postcode on a product page does not retype it at the till.
 *
 * The quote is recomputed whenever the basket changes, because the free-
 * delivery threshold and the shipping class both depend on its contents.
 */

interface DeliveryContextValue {
  postcode: string;
  setPostcode: (value: string) => void;
  /** Last completed check for the current postcode and basket. */
  result: DeliveryCheck | null;
  checking: boolean;
  /** False until the persisted postcode has been read in the browser. */
  hydrated: boolean;
  clear: () => void;
}

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

const STORAGE_KEY = "holzkraft:delivery-postcode";

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { items, subtotalCents } = useCart();
  const [postcode, setPostcodeState] = useState("");
  const [result, setResult] = useState<DeliveryCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && /^\d{5}$/.test(stored)) setPostcodeState(stored);
    } catch {
      // A blocked localStorage only costs the convenience of remembering it.
    }
    setHydrated(true);
  }, []);

  // Kinds drive the shipping class; the string keeps the effect from firing on
  // every unrelated basket mutation.
  const kinds = useMemo(() => items.map((item) => item.imageKind), [items]);
  const kindsKey = kinds.join(",");

  useEffect(() => {
    if (!hydrated) return;
    if (!/^\d{5}$/.test(postcode)) {
      setResult(null);
      setChecking(false);
      return;
    }

    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setChecking(true);

    checkDelivery(postcode, { subtotalCents, kinds: kindsKey ? kindsKey.split(",") : [] }, controller.signal)
      .then((next) => {
        setResult(next);
        setChecking(false);
      })
      .catch(() => {
        // Aborted by a newer postcode; the newer request owns the state.
      });

    return () => controller.abort();
  }, [postcode, subtotalCents, kindsKey, hydrated]);

  const setPostcode = useCallback((value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 5);
    setPostcodeState(clean);
    try {
      if (clean.length === 5) window.localStorage.setItem(STORAGE_KEY, clean);
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const clear = useCallback(() => setPostcode(""), [setPostcode]);

  const value = useMemo<DeliveryContextValue>(
    () => ({ postcode, setPostcode, result, checking, hydrated, clear }),
    [postcode, setPostcode, result, checking, hydrated, clear],
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error("useDelivery must be used within DeliveryProvider");
  return context;
}
