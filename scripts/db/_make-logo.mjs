// Render the HolzDirekt wordmark into public/logo.png for invoice PDFs.
// The mark is normally drawn in the browser; pdf-lib can only embed bitmaps,
// so we rasterize the same paths with sharp.
// Run: node scripts/db/_make-logo.mjs
import sharp from "sharp";
import { writeFile } from "node:fs/promises";

// Same glyph paths as src/components/layout/logo.tsx.
const GLYPHS = {
  H: "M0,0H26V37H46V0H72V100H46V63H26V100H0Z M0,63L26,41L26,50L0,72Z",
  O: "M16,0H58A16,16 0 0 1 74,16V84A16,16 0 0 1 58,100H16A16,16 0 0 1 0,84V16A16,16 0 0 1 16,0Z M26,26H48V74H26Z",
  L: "M0,0H26V74H60V100H0Z",
  Z: "M0,0H66V24L30,76H66V100H0V76L36,24H0Z",
  D: "M0,0H48A24,24 0 0 1 72,24V76A24,24 0 0 1 48,100H0Z M26,26H48V74H26Z",
  I: "M0,0H26V100H0Z",
  R: "M0,0H70V56H48L70,100H41L26,72V100H0Z M26,20H48V36H26Z",
  E: "M0,0H60V24H26V38H54V62H26V76H60V100H0Z",
  K: "M0,0H26V40L54,0H70L40,48L70,100H50L26,60V100H0Z",
  T: "M0,0H66V24H46V100H20V24H0Z",
};
const WIDTHS = { H: 72, O: 74, L: 60, Z: 66, D: 72, I: 26, R: 70, E: 60, K: 70, T: 66 };
const GAP = 8;

function layOut(chars, startX) {
  let x = startX;
  const paths = [];
  for (const ch of chars) {
    paths.push(`<path d="${GLYPHS[ch]}" transform="translate(${x} 0)"/>`);
    x += WIDTHS[ch] + GAP;
  }
  return { paths, end: x - GAP };
}

const holz = layOut("HOLZ", 0);
const direkt = layOut("DIREKT", holz.end + GAP);
const viewWidth = direkt.end;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} 100">
  <g fill="#4a2e1b" fill-rule="evenodd">${holz.paths.join("")}</g>
  <g fill="#1f6b3b" fill-rule="evenodd">${direkt.paths.join("")}</g>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
await writeFile("public/logo.png", png);
console.log(`wrote public/logo.png (${png.length} bytes, viewBox 0 0 ${viewWidth} 100)`);
