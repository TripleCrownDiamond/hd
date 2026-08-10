import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ContentEditor } from "./content-editor";

describe("ContentEditor", () => {
  function openPreview() {
    fireEvent.click(screen.getByRole("tab", { name: "Aperçu" }));
  }

  it("renders a safe Markdown preview", () => {
    render(<ContentEditor initialFormat="markdown" initialBody="# Rechtlicher Hinweis" />);
    openPreview();
    expect(screen.getByRole("heading", { name: "Rechtlicher Hinweis" })).toBeInTheDocument();
  });

  it("isolates HTML previews in a sandboxed iframe", () => {
    render(<ContentEditor initialFormat="html" initialBody="<h1>Vorschau</h1>" />);
    openPreview();
    const frame = screen.getByTitle("Aperçu du contenu");
    expect(frame).toHaveAttribute("sandbox");
    expect(frame).toHaveAttribute("srcdoc", "<h1>Vorschau</h1>");
  });
});
