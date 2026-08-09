import { test, expect } from "@playwright/test";

test.describe("Smoke", () => {
  test("home page loads with German content and skip link", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/HOLZKRAFT/);
    await expect(page.getByRole("link", { name: "Zum Hauptinhalt springen" })).toBeAttached();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/Wärme|Brennholz/);
  });

  test("main navigation links resolve", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Brennholz bestellen/ }).first().click();
    await expect(page).toHaveURL(/\/brennholz$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/konto/anmelden");
    await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByLabel("E-Mail-Adresse", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
  });
});
