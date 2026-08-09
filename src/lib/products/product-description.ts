const ALLOWED_TAGS = new Set(["p", "br", "strong", "em", "ul", "ol", "li", "h2", "h3", "a"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeLimitedHtml(value: string) {
  const withoutDangerousBlocks = value
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\/\1\s*>/gi, "");

  return withoutDangerousBlocks.replace(/<\/?([a-z0-9]+)(?:\s[^>]*)?>/gi, (tag, rawName) => {
    const name = String(rawName).toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br>";
    if (name === "a") {
      const href = /\shref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
      return /^https?:\/\//i.test(href)
        ? `<a href="${escapeHtml(href)}" rel="noreferrer noopener">`
        : "<a>";
    }
    return `<${name}>`;
  });
}

/** Convert catalogue copy to a small, safe HTML subset for product pages. */
export function productDescriptionHtml(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim().replace(/^\*\*([\s\S]*?)\*\*$/, "$1").trim();
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) return sanitizeLimitedHtml(trimmed);
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.replace(/\s*\n\s*/g, " "))}</p>`)
    .join("");
}
