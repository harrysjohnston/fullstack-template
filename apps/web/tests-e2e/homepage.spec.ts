import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("loads successfully", async ({ page }) => {
    await page.goto("/");
    // Check that the page loaded (has the main element)
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("displays the main heading", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "fullstack-template" })).toBeVisible();
  });

  test("displays the description text", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Next.js \+ TypeScript scaffold/i)).toBeVisible();
  });

  test("displays both buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
    await expect(page.getByRole("button", { name: "View docs" })).toBeVisible();
  });
});
