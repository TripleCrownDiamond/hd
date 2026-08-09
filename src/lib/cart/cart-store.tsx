"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

export interface CartItem {
  id: string;
  slug: string;
  href?: string;
  name: string;
  variant?: string;
  quantity: number;
  priceCents: number;
  basePriceCents?: number;
  basePriceUnit?: string;
  image?: string;
  imageKind: "wood" | "stove" | "briquette" | "pellet" | "accessory";
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "add"; item: CartItem }
  | { type: "remove"; id: string }
  | { type: "setQty"; id: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

function reducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add": {
      const existing = state.items.find((i) => i.id === action.item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === action.item.id
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        };
      }
      return { items: [...state.items, action.item] };
    }
    case "remove":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "setQty":
      return {
        items: state.items
          .map((i) =>
            i.id === action.id ? { ...i, quantity: Math.max(1, action.quantity) } : i,
          )
          .filter((i) => i.quantity > 0),
      };
    case "clear":
      return { items: [] };
    case "hydrate":
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  replace: (items: CartItem[]) => void;
  count: number;
  subtotalCents: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** False until the persisted cart has been read in the browser. */
  hydrated: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "holzkraft:cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          dispatch({ type: "hydrate", items: parsed as CartItem[] });
        }
      }
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      // ignore
    }
  }, [state.items, hydrated]);

  const add = useCallback((item: CartItem) => {
    dispatch({ type: "add", item });
    setIsOpen(true);
  }, []);

  const remove = useCallback((id: string) => dispatch({ type: "remove", id }), []);
  const setQuantity = useCallback(
    (id: string, quantity: number) => dispatch({ type: "setQty", id, quantity }),
    [],
  );
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const replace = useCallback((items: CartItem[]) => dispatch({ type: "hydrate", items }), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const value = useMemo<CartContextValue>(() => {
    const count = state.items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotalCents = state.items.reduce(
      (sum, i) => sum + i.priceCents * i.quantity,
      0,
    );
    return {
      ...state,
      add,
      remove,
      setQuantity,
      clear,
      replace,
      count,
      subtotalCents,
      isOpen,
      open,
      close,
      toggle,
      hydrated,
    };
  }, [state, add, remove, setQuantity, clear, replace, isOpen, open, close, toggle, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
