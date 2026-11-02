import { expect, test } from "@playwright/test";
import { galleries } from "../prisma/seed-data";
import { awasi } from "./helpers";

test.describe("galeri", () => {
  test("daftar album: judul, jumlah foto, cover termuat", async ({ page }) => {
    await awasi(page);
    await page.goto("/galeri");
    await expect(page.getByTestId("kartu-album")).toHaveCount(galleries.length);
    for (const g of galleries) {
      const k = page.getByTestId("kartu-album").filter({ hasText: g.title });
      await expect(k).toContainText(`${g.images.length} foto`);
      await expect(k.getByRole("link", { name: `Buka album: ${g.title}` })).toHaveAttribute(
        "href",
        `/galeri/${g.slug}`,
      );
      expect(
        await k.locator("img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
        g.slug,
      ).toBe(true);
    }
  });

  test("album: semua foto tampil berurutan; lightbox buka, panah, Esc, fokus kembali", async ({
    page,
  }) => {
    const g = galleries[0]!;
    await page.goto(`/galeri/${g.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(g.title);
    const tombol = page.locator("main ul button");
    await expect(tombol).toHaveCount(g.images.length);
    await tombol.first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator("img")).toHaveAttribute("src", g.images[0]!.src);
    await page.keyboard.press("ArrowRight");
    await expect(dialog.locator("img")).toHaveAttribute("src", g.images[1]!.src);
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft"); // melingkar ke foto terakhir
    await expect(dialog.locator("img")).toHaveAttribute("src", g.images.at(-1)!.src);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(tombol.first()).toBeFocused();
  });

  test("alt gambar berasal dari keterangan; album/slug tidak dikenal → 404", async ({ page }) => {
    const g = galleries[1]!;
    await page.goto(`/galeri/${g.slug}`);
    await expect(page.locator(`main img[alt="${g.images[0]!.caption}"]`)).toHaveCount(1);
    for (const s of ["tidak-ada", "__proto__", "..%2Fetc", "PENTAS-SENI-2026"]) {
      const res = await page.goto(`/galeri/${s}`);
      expect(res?.status(), s).toBe(404);
    }
  });
});
