import { describe, expect, it } from "vitest";
import { productDescriptionHtml } from "./product-description";

describe("productDescriptionHtml", () => {
  it("turns generated plain text into HTML without Markdown wrappers", () => {
    expect(productDescriptionHtml("**Der Kaminofen ist geprüft.**")).toBe(
      "<p>Der Kaminofen ist geprüft.</p>",
    );
  });

  it("keeps useful HTML and removes executable markup", () => {
    expect(productDescriptionHtml('<p onclick="alert(1)">Text <strong>sicher</strong></p><script>alert(1)</script>'))
      .toBe("<p>Text <strong>sicher</strong></p>");
  });

  it("drops unsafe link targets", () => {
    expect(productDescriptionHtml('<a href="javascript:alert(1)">Link</a>')).toBe("<a>Link</a>");
  });
});
