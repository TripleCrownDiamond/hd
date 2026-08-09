import { cn } from "@/lib/utils";

/**
 * HolzDirekt wordmark.
 *
 * Same construction as the HOLZKRAFT mark it replaces: one heavy condensed
 * grotesque, cut in two colours at the word seam — HOLZ in wood brown, DIREKT
 * in forest green — with an axe-cut slit through the H.
 *
 * The glyphs are drawn as paths rather than set in a webfont so the lockup is
 * identical everywhere and never reflows while a font loads. Cap height is 100
 * units, stems are 26, letters are spaced 8 apart.
 */

type LogoTone = "color" | "mono";

/** `[path, advanceWidth]` per glyph. Paths are filled even-odd: counters and
 *  the axe slit are subpaths that cut back out. */
const GLYPHS = {
  // Stems, crossbar, then the slit that gives the mark its name.
  H: ["M0,0H26V37H46V0H72V100H46V63H26V100H0Z M0,63L26,41L26,50L0,72Z", 72],
  O: ["M16,0H58A16,16 0 0 1 74,16V84A16,16 0 0 1 58,100H16A16,16 0 0 1 0,84V16A16,16 0 0 1 16,0Z M26,26H48V74H26Z", 74],
  L: ["M0,0H26V74H60V100H0Z", 60],
  Z: ["M0,0H66V24L30,76H66V100H0V76L36,24H0Z", 66],
  D: ["M0,0H48A24,24 0 0 1 72,24V76A24,24 0 0 1 48,100H0Z M26,26H48V74H26Z", 72],
  I: ["M0,0H26V100H0Z", 26],
  R: ["M0,0H70V56H48L70,100H41L26,72V100H0Z M26,20H48V36H26Z", 70],
  E: ["M0,0H60V24H26V38H54V62H26V76H60V100H0Z", 60],
  K: ["M0,0H26V40L54,0H70L40,48L70,100H50L26,60V100H0Z", 70],
  T: ["M0,0H66V24H46V100H20V24H0Z", 66],
} satisfies Record<string, [string, number]>;

type Glyph = keyof typeof GLYPHS;

const LETTER_GAP = 8;

/** Lays a word out left to right and returns the placed glyphs plus the pen x. */
function layout(word: Glyph[], startX: number) {
  let x = startX;
  const placed = word.map((char) => {
    const [d, width] = GLYPHS[char];
    const node = { char, d, x };
    x += width + LETTER_GAP;
    return node;
  });
  // The trailing gap belongs between words, not after the last letter.
  return { placed, endX: x - LETTER_GAP };
}

const HOLZ = layout(["H", "O", "L", "Z"], 0);
const DIREKT = layout(["D", "I", "R", "E", "K", "T"], HOLZ.endX + LETTER_GAP);
const VIEWBOX_WIDTH = DIREKT.endX;

function Word({ part, fill }: { part: typeof HOLZ; fill: string }) {
  return (
    <g fill={fill} fillRule="evenodd">
      {part.placed.map((glyph) => (
        <path key={`${glyph.char}-${glyph.x}`} d={glyph.d} transform={`translate(${glyph.x} 0)`} />
      ))}
    </g>
  );
}

export function Logo({
  tone = "color",
  className,
  title = "HolzDirekt",
}: {
  tone?: LogoTone;
  className?: string;
  /** Rendered for assistive tech. Pass `null` when a nearby label already says it. */
  title?: string | null;
}) {
  const mono = tone === "mono";
  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} 100`}
      className={cn("block", className)}
      role={title ? "img" : undefined}
      aria-label={title ?? undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <Word part={HOLZ} fill={mono ? "currentColor" : "var(--color-wood)"} />
      <Word part={DIREKT} fill={mono ? "currentColor" : "var(--color-brand)"} />
    </svg>
  );
}

/**
 * Square lockup for favicons, avatars and anywhere the full wordmark would set
 * too small: the chiselled H on a brand tile.
 */
export function LogoMark({
  tone = "color",
  className,
}: {
  tone?: LogoTone;
  className?: string;
}) {
  const [glyph, width] = GLYPHS.H;
  return (
    <svg viewBox="0 0 128 128" className={cn("block shrink-0", className)} aria-hidden="true" focusable="false">
      <rect
        width="128"
        height="128"
        rx="28"
        fill={tone === "mono" ? "currentColor" : "var(--color-brand)"}
      />
      <path
        d={glyph}
        fillRule="evenodd"
        fill={tone === "mono" ? "var(--color-surface)" : "white"}
        transform={`translate(${(128 - width) / 2} 14)`}
      />
    </svg>
  );
}
