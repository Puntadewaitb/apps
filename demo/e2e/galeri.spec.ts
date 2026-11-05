import { expect, test } from "@playwright/test";
import { DEMO_APPS } from "../apps.mjs";
import { BASE_ROOT } from "./helpers";

test.describe("galeri sample (halaman indeks)", () => {
  test("memuat semua template; setiap tautan menuju halaman yang ada; noindex", async ({
    page,
    request,
  }) => {
    await page.goto(`${BASE_ROOT}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Contoh Template Website");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow",
    );
    for (const a of DEMO_APPS) {
      const link = page.getByRole("link", { name: new RegExp(a.nama) });
      await expect(link).toHaveAttribute("href", `./${a.slug}/`);
      expect((await request.get(`${BASE_ROOT}/${a.slug}/`)).status(), a.slug).toBe(200);
    }
    await expect(page.locator("main li")).toHaveCount(DEMO_APPS.length);
  });

  test("halaman tak dikenal → 404.html galeri (satu-satunya 404 yang disajikan GitHub Pages)", async ({
    page,
  }) => {
    const res = await page.goto(`${BASE_ROOT}/tidak-ada/`);
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
