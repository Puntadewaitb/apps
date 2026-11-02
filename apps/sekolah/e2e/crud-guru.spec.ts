import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { awasi, berkasPng, berkasSvg, huruf, login, query, tulis } from "./helpers";

const adaFile = (path: string) => existsSync(join("e2e-uploads", path.replace("/uploads/", "")));

test.describe("CRUD guru & staf", () => {
  test("tambah (dengan foto) → tampil di publik sesuai urutan → sembunyikan → ubah → hapus (foto terhapus)", async ({
    page,
    request,
  }) => {
    const p = await awasi(page);
    const nama = `Guru Uji ${huruf()}`;
    await login(page);
    await page.goto("/admin/guru");
    await page.getByRole("link", { name: "+ Guru baru" }).click();
    await page.getByLabel("Nama lengkap").fill(nama);
    await page.getByLabel("Jabatan").fill("Guru Uji");
    await page.getByLabel("Mata pelajaran").fill("Pengujian");
    await page.getByLabel("Bio singkat").fill("Bio uji yang singkat.");
    await page.getByLabel("Urutan tampil").fill("0");
    await page.getByLabel(/^Foto/).setInputFiles(berkasPng());
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/guru\?ok=tersimpan$/);
    const row = query<{ id: number; photo: string; sort: number; active: number }>(
      "SELECT id, photo, sort, active FROM Teacher WHERE name = ?",
      nama,
    )[0]!;
    expect(row.photo).toMatch(/^\/uploads\/.+\.png$/);
    expect(row.active).toBe(1);
    expect(adaFile(row.photo)).toBe(true);

    // publik: urutan 0 → paling depan; foto termuat; alt tanpa "(placeholder)"
    await page.goto("/guru");
    const kartu = page.getByTestId("kartu-guru").first();
    await expect(kartu).toContainText(nama);
    const foto = kartu.locator("img");
    await expect(foto).toHaveAttribute("alt", `Foto ${nama}`);
    expect(await foto.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(
      true,
    );

    // sembunyikan
    await page.goto(`/admin/guru/${row.id}`);
    await page.getByLabel("Tampilkan di situs").uncheck();
    await page.getByLabel("Jabatan").fill("Guru Uji Revisi");
    await page.getByRole("button", { name: "Simpan" }).click();
    await page.waitForURL(/ok=tersimpan/);
    await expect(page.getByTestId("baris-guru").filter({ hasText: nama })).toContainText(
      "Disembunyikan",
    );
    await page.goto("/guru");
    await expect(page.locator("body")).not.toContainText(nama);

    // ganti foto → file lama terhapus, baru ada
    await page.goto(`/admin/guru/${row.id}`);
    await page.getByLabel(/^Foto/).setInputFiles(berkasPng("baru.png"));
    await page.getByRole("button", { name: "Simpan" }).click();
    await page.waitForURL(/ok=tersimpan/);
    const baru = query<{ photo: string }>("SELECT photo FROM Teacher WHERE id = ?", row.id)[0]!
      .photo;
    expect(baru).not.toBe(row.photo);
    expect(adaFile(baru)).toBe(true);
    expect(adaFile(row.photo)).toBe(false);

    // hapus foto lewat centang
    await page.goto(`/admin/guru/${row.id}`);
    await page.getByLabel("Hapus foto saat ini").check();
    await page.getByRole("button", { name: "Simpan" }).click();
    await page.waitForURL(/ok=tersimpan/);
    expect(
      query<{ photo: string }>("SELECT photo FROM Teacher WHERE id = ?", row.id)[0]!.photo,
    ).toBe("");
    expect(adaFile(baru)).toBe(false);

    // hapus data
    await page.goto("/admin/guru");
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-guru")
      .filter({ hasText: nama })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(query("SELECT id FROM Teacher WHERE id = ?", row.id)).toHaveLength(0);
    expect((await request.get(baru)).status()).toBe(404);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("validasi: nama/jabatan pendek, urutan bukan angka, foto berbahaya → ditolak tanpa menyimpan", async ({
    page,
  }) => {
    await login(page);
    const hitung = () =>
      query<{ c: number }>(
        "SELECT count(*) c FROM Teacher WHERE name IN ('ab', 'Nama Valid Uji')",
      )[0]!.c;
    await page.goto("/admin/guru/baru");
    await page.getByLabel("Nama lengkap").fill("ab");
    await page.getByLabel("Jabatan").fill("x");
    await page.getByLabel("Urutan tampil").fill("abc");
    await page.getByRole("button", { name: "Simpan" }).click();
    const form = page.getByRole("form", { name: "Form guru" });
    await expect(form).toContainText("Nama minimal 3 karakter.");
    await expect(form).toContainText("Jabatan minimal 3 karakter.");
    await expect(form).toContainText("Urutan harus bilangan bulat 0–9999.");

    await page.getByLabel("Nama lengkap").fill("Nama Valid Uji");
    await page.getByLabel("Jabatan").fill("Jabatan Valid");
    await page.getByLabel("Urutan tampil").fill("5");
    await page.getByLabel(/^Foto/).setInputFiles(berkasSvg("foto.png"));
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toContainText("Format gambar harus PNG, JPG, atau WebP.");
    expect(hitung()).toBe(0);
  });

  test("data 'kotor' langsung di DB (HTML/skrip) tampil sebagai teks di situs publik dan di panel admin", async ({
    page,
  }) => {
    const t = huruf();
    const kotor = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Teacher (name, position, subject, bio, photo, sort, active) VALUES (?, ?, ?, ?, '', 98, 1)",
        )
        .run(`${kotor}N${t}`, `${kotor}P${t}`, `${kotor}S${t}`, `${kotor}B${t}`),
    );
    try {
      await awasi(page);
      await page.goto("/guru");
      const kartu = page.getByTestId("kartu-guru").filter({ hasText: `N${t}` });
      await expect(kartu).toHaveCount(1);
      expect(await kartu.locator("img, script").count()).toBe(0);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(
        0,
      );
      await login(page);
      await page.goto("/admin/guru");
      const baris = page.getByTestId("baris-guru").filter({ hasText: `N${t}` });
      await expect(baris).toHaveCount(1);
      expect(await baris.locator("img, script").count()).toBe(0);
      await page.goto(
        `/admin/guru/${query<{ id: number }>("SELECT id FROM Teacher WHERE sort = 98")[0]!.id}`,
      );
      await expect(page.getByLabel("Nama lengkap")).toHaveValue(`${kotor}N${t}`); // nilai field = teks, bukan markup
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(
        0,
      );
    } finally {
      tulis((d) => d.prepare("DELETE FROM Teacher WHERE sort = 98").run());
    }
  });
});
