import { afterEach, describe, expect, it } from "vitest";
import { media, isLocalRef, isImageKitRef } from "./media";

const OLD_BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_IK = process.env.NEXT_PUBLIC_IMAGEKIT_URL;

afterEach(() => {
  if (OLD_BASE === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = OLD_BASE;
  if (OLD_IK === undefined) delete process.env.NEXT_PUBLIC_IMAGEKIT_URL;
  else process.env.NEXT_PUBLIC_IMAGEKIT_URL = OLD_IK;
});

describe("media", () => {
  it("resolves a local: reference to a file served by this app", () => {
    const url = media("local:holzkraft/products/buche-25.webp");
    expect(url).toBe("/images/holzkraft/products/buche-25.webp");
  });

  it("passes local images through unmodified (no CDN transforms)", () => {
    const url = media("local:holzkraft/products/buche-25.webp", {
      width: 400,
      crop: "fill",
    });
    // The Next optimizer resizes locally; the URL must not carry CDN syntax.
    expect(url).not.toContain("w_400");
    expect(url).not.toContain("?tr=");
    expect(url).toContain("/images/holzkraft/products/buche-25.webp");
  });

  it("keeps bare references as Cloudinary public ids", () => {
    const url = media("holzkraft/products/buche-25", { width: 800 });
    expect(url).toBe(
      "https://res.cloudinary.com/pq4soawt/image/upload/f_auto,q_auto,w_800/holzkraft/products/buche-25",
    );
  });

  it("resolves imagekit: references with ImageKit transforms", () => {
    process.env.NEXT_PUBLIC_IMAGEKIT_URL = "https://ik.imagekit.io/test";
    const url = media("imagekit:holzkraft/products/buche-25", { width: 600, crop: "fill" });
    expect(url).toBe(
      "https://ik.imagekit.io/test/holzkraft/products/buche-25?tr=w-600,c-maintain_ratio,fo-auto,f-auto,q-auto",
    );
  });

  it("classifies local and imagekit references", () => {
    expect(isLocalRef("local:x.webp")).toBe(true);
    expect(isLocalRef("holzkraft/x")).toBe(false);
    expect(isImageKitRef("imagekit:x")).toBe(true);
    expect(isImageKitRef("local:x")).toBe(false);
  });
});
