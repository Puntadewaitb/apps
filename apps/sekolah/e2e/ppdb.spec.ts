import { expect, test } from "@playwright/test";
import { ppdb } from "../content/ppdb";
import { awasi, berkasPng, huruf, isiWizard, uniqueIp } from "./helpers";

test.describe("halaman info PPDB", () => {
  test("alur, gelombang, jenjang, dokumen; tombol Daftar & Cek Status", async ({ page }) => {
    const p = await awasi(page);
    await page.goto("/ppdb");
    await expect(page).toHaveTitle(
      `${ppdb.judul} ${ppdb.tahunAjaran} | Sekolah Cendekia Nusantara`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ppdb.judul);
    await expect(page.getByRole("link", { name: "Daftar Sekarang" })).toHaveAttribute(
      "href",
      "/ppdb/daftar",
    );
    await expect(page.getByRole("link", { name: "Cek Status Pendaftaran" })).toHaveAttribute(
      "href",
      "/ppdb/status",
    );
    await expect(page.locator("#alur li")).toHaveCount(ppdb.alur.length);
    for (const g of ppdb.gelombang) await expect(page.locator("#jadwal")).toContainText(g.periode);
    for (const j of ppdb.jenjang) await expect(page.locator("#jadwal")).toContainText(j);
    await expect(page.getByTestId("daftar-dokumen").locator("li")).toHaveCount(ppdb.dokumen.length);
    await expect(page.getByTestId("daftar-dokumen")).toContainText("Pas foto 3×4 (opsional)");
    // menu utama memuat PPDB
    await expect(
      page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "PPDB" }),
    ).toHaveAttribute("href", "/ppdb");
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });
});

test.describe("formulir pendaftaran: perilaku wizard (tanpa mengirim)", () => {
  test("empat langkah; 'Lanjut' ditahan validasi langkah ini; ringkasan memuat isian & nama berkas", async ({
    page,
  }) => {
    await awasi(page);
    await page.goto("/ppdb/daftar");
    const langkah = page.getByTestId("langkah");
    await expect(langkah.locator("[aria-current=step]")).toContainText("1. Data calon siswa");
    // hanya langkah aktif yang terlihat
    await expect(page.getByLabel("Nama lengkap calon siswa")).toBeVisible();
    await expect(page.getByLabel("Nama orang tua/wali")).toBeHidden();
    // lanjut tanpa isi → tetap di langkah 1 (validasi browser)
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await expect(langkah.locator("[aria-current=step]")).toContainText("1.");
    expect(
      await page
        .getByLabel("Nama lengkap calon siswa")
        .evaluate((el: HTMLInputElement) => el.validity.valueMissing),
    ).toBe(true);

    await isiWizard(page, { nama: "Siswa Ringkasan", sampaiLangkah: 4 });
    await expect(langkah.locator("[aria-current=step]")).toContainText("4. Tinjau & kirim");
    const r = page.getByTestId("ringkasan");
    await expect(r).toContainText("Siswa Ringkasan");
    await expect(r).toContainText("SMP Kelas 7");
    await expect(r).toContainText("akta.png");
    await expect(r).toContainText("kk.pdf");
    await expect(r).toContainText("— tidak diunggah —"); // pas foto opsional
    await expect(page.getByRole("button", { name: "Kirim Pendaftaran" })).toBeVisible();
    // mundur mempertahankan isian
    await page.getByRole("button", { name: "← Sebelumnya" }).click();
    await page.getByRole("button", { name: "← Sebelumnya" }).click();
    await page.getByRole("button", { name: "← Sebelumnya" }).click();
    await expect(page.getByLabel("Nama lengkap calon siswa")).toHaveValue("Siswa Ringkasan");
  });

  test("tanpa JavaScript: semua bagian tampil sekaligus dan ada tombol kirim", async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    try {
      await page.goto("/ppdb/daftar");
      for (const l of ["Nama lengkap calon siswa", "Nama orang tua/wali", "Akta kelahiran"])
        await expect(page.getByLabel(l)).toBeVisible();
      await expect(page.getByRole("button", { name: "Kirim Pendaftaran" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Lanjut →" })).toHaveCount(0);
    } finally {
      await ctx.close();
    }
  });

  test("honeypot tidak terlihat/terfokus oleh manusia; heading & landmark benar", async ({
    page,
  }) => {
    await page.goto("/ppdb/daftar");
    const hp = page.locator('input[name="website_url"]');
    await expect(hp).toHaveAttribute("tabindex", "-1");
    expect(await hp.evaluate((el) => !!el.closest('[aria-hidden="true"]'))).toBe(true);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("form", { name: "Form pendaftaran PPDB" })).toBeVisible();
  });

  void berkasPng;
  void huruf;
  void uniqueIp;
});

test.describe("cek status (tanpa data pendaftar)", () => {
  test("format salah / nomor tak dikenal / token salah → pesan jelas, tanpa membocorkan keberadaan nomor", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/status");
    const isi = async (n: string, t: string) => {
      await page.getByLabel("Nomor pendaftaran").fill(n);
      await page.getByLabel("Token akses").fill(t);
      await page.getByRole("button", { name: "Cek Status" }).click();
    };
    await isi("abc", "xyz");
    await expect(page.getByTestId("galat-status")).toContainText(
      "Format nomor pendaftaran atau token tidak sesuai",
    );
    await isi("PPDB-2027-AAAAAA", "ABCD-EFGH-JKMN");
    await expect(page.getByTestId("galat-status")).toHaveText(
      "Nomor pendaftaran atau token tidak cocok.",
    );
    await expect(page.getByTestId("hasil-status")).toHaveCount(0);
    // input token disamarkan
    await expect(page.getByLabel("Token akses")).toHaveAttribute("type", "password");
  });

  test("percobaan berlebih dari satu IP (>10) → dibatasi", async ({ page }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/status");
    for (let i = 0; i < 11; i++) {
      await page
        .getByLabel("Nomor pendaftaran")
        .fill(`PPDB-2027-${huruf().slice(0, 6).toUpperCase().replace(/[IOL]/g, "A")}`);
      await page.getByLabel("Token akses").fill("ABCD-EFGH-JKMN");
      await page.getByRole("button", { name: "Cek Status" }).click();
      await expect(page.getByTestId("galat-status")).toBeVisible();
    }
    await expect(page.getByTestId("galat-status")).toHaveText(
      "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    );
  });
});
