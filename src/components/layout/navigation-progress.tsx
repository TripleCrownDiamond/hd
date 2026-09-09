"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A top-of-viewport progress bar for App Router navigations.
 *
 * Clicking a <Link> starts a server round trip, and until it resolves the
 * browser paints nothing at all — the old page just sits there, which reads as
 * a frozen app rather than a slow one. Nothing in React's model tells us a
 * navigation *started*, so we listen for the click ourselves and stop when the
 * URL actually changes.
 *
 * The bar creeps towards 90% without ever arriving: it signals "still working"
 * honestly instead of promising a completion time we cannot know.
 */
const START_DELAY_MS = 120;
const TICK_MS = 200;
const DONE_LINGER_MS = 220;

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState<number | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[] | null>(null);

  // Latest URL, so the click handler can tell a real navigation from a click on
  // a link to the page we are already showing.
  const currentUrl = `${pathname}?${searchParams.toString()}`;
  const currentUrlRef = useRef(currentUrl);

  const clearTimers = useCallback(() => {
    timers.current?.forEach(clearTimeout);
    timers.current = null;
  }, []);

  useEffect(() => {
    currentUrlRef.current = currentUrl;
    // The destination rendered. Kill the pending creep ticks first — one firing
    // after this would walk a finished bar back down from 100% to 90%.
    clearTimers();
    setProgress((value) => (value === null ? null : 100));
    const timer = setTimeout(() => setProgress(null), DONE_LINGER_MS);
    return () => clearTimeout(timer);
  }, [currentUrl, clearTimers]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Let the browser handle anything that is not a plain left click on a
      // same-tab, same-origin link.
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}?${url.searchParams.toString()}` === currentUrlRef.current) return;

      clearTimers();
      // A navigation served from cache lands in well under this; showing a bar
      // for it would be a flash of noise on an already-instant transition.
      const started = setTimeout(() => setProgress(12), START_DELAY_MS);
      const ticks = [started];
      for (let step = 1; step <= 12; step += 1) {
        ticks.push(
          setTimeout(
            () =>
              setProgress((value) =>
                value === null ? null : Math.min(90, value + (90 - value) * 0.28),
              ),
            START_DELAY_MS + step * TICK_MS,
          ),
        );
      }
      timers.current = ticks;
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      clearTimers();
    };
  }, [clearTimers]);

  if (progress === null) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5"
      role="status"
      aria-live="polite"
      aria-label="Seite wird geladen"
    >
      <div
        className="bg-accent h-full transition-[width] duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
