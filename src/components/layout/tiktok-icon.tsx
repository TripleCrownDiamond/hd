/**
 * TikTok glyph.
 *
 * Lucide dropped brand marks, so this one is drawn here. Same 24-unit box,
 * `currentColor` fill and `size-4` sizing as the Lucide icons beside it in the
 * footer, so the row stays visually even.
 */
export function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true" focusable="false">
      <path d="M16.5 2h-3.02v13.1a2.6 2.6 0 1 1-1.86-2.5V9.5a5.66 5.66 0 1 0 4.88 5.6V8.66a6.9 6.9 0 0 0 4.02 1.29V6.9A3.94 3.94 0 0 1 16.5 2Z" />
    </svg>
  );
}
