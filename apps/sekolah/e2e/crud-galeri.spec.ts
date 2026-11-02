import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { awasi, berkasPng, berkasSvg, huruf, login, query } from "./helpers";

const adaFile = (path: string) => existsSync(join("e2e-uploads", path.replace("/uploads/", "")));
const fotoAlbum = (id: number) =>
  query<{ id: number; src: string; caption: string; sort: number }>(
    "SELECT id, src, caption, sort FROM GalleryImage WHERE galleryId = ? ORDER BY sort, id",
    id,
  );

test.describe("CRUD galeri", () => {
  test("album baru → unggah beberapa foto → sampul otomatis → keterangan → ganti sampul → hapus foto → publik → hapus album", async ({
    page,
    request,
  }) => {
    const p = await awasi(page);
    const judul = `Uji Album ${huruf()}`;
    await login(page);
    await page.goto("/admin/galeri");
    await page.getByRole("link", { name: "+ Album baru" }).click();
    await page.getByLabel("Judul album").fill(judul);
    await page.getByLabel("Deskripsi").fill("Album uji.");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/galeri\/\d+\?ok=tersimpan$/);
    const album = query<{ id: number; slug: string; cover: string }>(
      "SELECT id, slug, cover FROM Gallery WHERE title = ?",
      judul,
    )[0]!;
    expect(album.slug).toMatch(/^uji-album-/);
    expect(album.cover).toBe("");

    // unggah 2 foto sekaligus
    await page.getByLabel("Tambah foto").setInputFiles([berkasPng("a.png"), berkasPng("b.png")]);
    await page.getByRole("button", { name: "Unggah" }).click();
    await expect(page.getByRole("status").filter({ hasText: "2 foto ditambahkan." })).toBeVisible();
    await page.reload();
    const f = fotoAlbum(album.id);
    expect(f).toHaveLength(2);
    expect(f.map((x) => x.sort)).toEqual([1, 2]);
    for (const x of f) expect(adaFile(x.src)).toBe(true);
    expect(
      query<{ cover: string }>("SELECT cover FROM Gallery WHERE id = ?", album.id)[0]!.cover,
    ).toBe(f[0]!.src); // sampul otomatis = foto pertama
    await expect(page.getByTestId("item-foto")).toHaveCount(2);
    await expect(page.getByTestId("item-foto").first()).toContainText("Sampul album");

    // keterangan → alt di publik
    await page.getByLabel(`Keterangan foto ${f[1]!.id}`).fill("Foto kedua uji");
    await page.getByTestId("item-foto").nth(1).getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByTestId("flash")).toBeVisible();
    await page.goto(`/galeri/${album.slug}`);
    await expect(page.locator('main img[alt="Foto kedua uji"]')).toHaveCount(1);
    await expect(page.locator(`main img[alt="${judul}"]`)).toHaveCount(1); // tanpa keterangan → judul album
    await page.locator("main ul button").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");

    // ganti sampul
    await page.goto(`/admin/galeri/${album.id}`);
    await page
      .getByTestId("item-foto")
      .nth(1)
      .getByRole("button", { name: "Jadikan sampul" })
      .click();
    await expect(page.getByTestId("flash")).toBeVisible();
    expect(
      query<{ cover: string }>("SELECT cover FROM Gallery WHERE id = ?", album.id)[0]!.cover,
    ).toBe(f[1]!.src);
    await page.goto("/galeri");
    await expect(page.getByTestId("kartu-album").filter({ hasText: judul })).toContainText(
      "2 foto",
    );

    // hapus foto yang jadi sampul → sampul pindah ke foto lain; file terhapus
    page.once("dialog", (d) => void d.accept());
    await page.goto(`/admin/galeri/${album.id}`);
    await page.getByTestId("item-foto").nth(1).getByRole("button", { name: "Hapus" }).click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(fotoAlbum(album.id)).toHaveLength(1);
    expect(
      query<{ cover: string }>("SELECT cover FROM Gallery WHERE id = ?", album.id)[0]!.cover,
    ).toBe(f[0]!.src);
    expect(adaFile(f[1]!.src)).toBe(false);

    // hapus album → semua file ikut terhapus
    await page.goto("/admin/galeri");
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-album")
      .filter({ hasText: judul })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(query("SELECT id FROM Gallery WHERE id = ?", album.id)).toHaveLength(0);
    expect(query("SELECT id FROM GalleryImage WHERE galleryId = ?", album.id)).toHaveLength(0);
    expect(adaFile(f[0]!.src)).toBe(false);
    expect((await request.get(`/galeri/${album.slug}`)).status()).toBe(404);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("unggahan batch: satu berkas berbahaya → SEMUA dibatalkan (tidak ada file/baris tersisa); >10 berkas ditolak", async ({
    page,
  }) => {
    const judul = `Uji Album Batch ${huruf()}`;
    await login(page);
    await page.goto("/admin/galeri/baru");
    await page.getByLabel("Judul album").fill(judul);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/galeri\/\d+\?ok=tersimpan$/);
    const album = query<{ id: number }>("SELECT id FROM Gallery WHERE title = ?", judul)[0]!;
    const form = page.getByRole("form", { name: "Unggah foto" });

    await page
      .getByLabel("Tambah foto")
      .setInputFiles([berkasPng("ok.png"), berkasSvg("jahat.png")]);
    await page.getByRole("button", { name: "Unggah" }).click();
    await expect(form).toContainText("jahat.png: Format gambar harus PNG, JPG, atau WebP.");
    await expect(form).toContainText("Unggahan dibatalkan.");
    expect(fotoAlbum(album.id)).toHaveLength(0);

    await page
      .getByLabel("Tambah foto")
      .setInputFiles(Array.from({ length: 11 }, (_, i) => berkasPng(`f${i}.png`)));
    await page.getByRole("button", { name: "Unggah" }).click();
    await expect(form).toContainText("Maksimal 10 foto sekali unggah.");
    expect(fotoAlbum(album.id)).toHaveLength(0);

    await page.getByRole("button", { name: "Unggah" }).click(); // tanpa pilih berkas
    await expect(form).toContainText("Pilih minimal satu foto.");

    await page.goto("/admin/galeri");
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-album")
      .filter({ hasText: judul })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toBeVisible();
  });

  test("validasi album & ID tak valid; slug bentrok mendapat sufiks", async ({ page }) => {
    const t = huruf();
    await login(page);
    await page.goto("/admin/galeri/baru");
    await page.getByLabel("Judul album").fill("ab");
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByRole("form", { name: "Form album" })).toContainText(
      "Judul minimal 3 karakter.",
    );
    for (const id of ["99999", "abc", "-1"])
      expect((await page.goto(`/admin/galeri/${id}`))?.status(), id).toBe(404);

    const ids: number[] = [];
    for (let i = 0; i < 2; i++) {
      await page.goto("/admin/galeri/baru");
      await page.getByLabel("Judul album").fill(`Uji Kembar ${t}`);
      await page.getByRole("button", { name: "Simpan" }).click();
      await expect(page).toHaveURL(/\/admin\/galeri\/\d+\?ok=tersimpan$/);
      ids.push(Number(new URL(page.url()).pathname.split("/").pop()));
    }
    const slugs = ids.map(
      (id) => query<{ slug: string }>("SELECT slug FROM Gallery WHERE id = ?", id)[0]!.slug,
    );
    expect(slugs[0]).toBe(`uji-kembar-${t}`);
    expect(slugs[1]).toBe(`uji-kembar-${t}-2`);
    for (const id of ids) {
      await page.goto("/admin/galeri");
      page.once("dialog", (d) => void d.accept());
      await page
        .locator(`form:has(input[name=id][value="${id}"])`)
        .getByRole("button", { name: "Hapus" })
        .click();
      await expect(page.getByTestId("flash")).toBeVisible();
    }
  });
});
