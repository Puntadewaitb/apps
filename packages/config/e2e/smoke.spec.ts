import { expect, test } from "@playwright/test";

test("config bersama: Chromium berjalan & halaman termuat", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Uji asap Playwright" })).toBeVisible();
  // Tautan eksternal: cukup assert href, jangan navigasi (jaringan cloud dibatasi).
  await expect(page.locator("#wa")).toHaveAttribute("href", "https://wa.me/6281234567890");
  // Tidak ada horizontal overflow
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
