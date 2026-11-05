import { expect, test, type Page } from "@playwright/test";
import { base, cekDasar, gambarTermuat, pantau, tanpaOverflow } from "./helpers";

const URL = base("sekolah");
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
const png = (name = "bukti.png") => ({ name, mimeType: "image/png", buffer: PNG });
const pdf = (name = "dok.pdf") => ({
  name,
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF\n"),
});

async function tenang(page: Page) {
  await page.route("https://www.google.com/**", (r) => r.abort());
}

test.describe("sekolah (sample statis)", () => {
  test("semua halaman publik muat bersih: tanpa galat/404, gambar termuat, banner & noindex, tanpa overflow 360px", async ({
    page,
  }) => {
    await tenang(page);
    const p = pantau(page);
    for (const path of [
      "",
      "profil/",
      "program/",
      "guru/",
      "berita/",
      "agenda/",
      "galeri/",
      "donasi/",
      "ppdb/",
      "ppdb/daftar/",
      "ppdb/status/",
    ]) {
      await page.goto(`${URL}${path}`);
      await cekDasar(page, /.+/);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await gambarTermuat(page);
      await tanpaOverflow(page);
    }
    expect(p.galat.filter((g) => !/google\.com|ERR_FAILED/.test(g))).toEqual([]);
  });

  test("seluruh halaman statis dapat dibuka (200, ada <h1>) dengan menelusuri tautan internal", async ({
    request,
  }) => {
    const masalah: string[] = [];
    const antre = [URL];
    const lihat = new Set<string>();
    while (antre.length) {
      const u = antre.shift()!;
      if (lihat.has(u)) continue;
      lihat.add(u);
      const res = await request.get(u);
      if (res.status() !== 200) masalah.push(`${res.status()} ${u}`);
      const html = await res.text();
      if (!/<h1[\s>]/.test(html)) masalah.push(`tanpa <h1>: ${u}`);
      for (const m of html.matchAll(/<a [^>]*href="(\/apps\/sekolah\/[^"#?]*)"/g))
        if (!lihat.has(m[1]!)) antre.push(m[1]!);
    }
    expect(masalah).toEqual([]);
    expect(lihat.size).toBeGreaterThan(25);
  });

  test("berita: filter jenis (aria-current), detail, dan TIDAK ada paginasi (seed muat 1 halaman)", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}berita/`);
    // Penjaga: bila seed bertambah melewati 1 halaman, halaman paginasi statis harus dibuat (lihat demo/sekolah/config.mjs).
    await expect(page.getByTestId("paginasi")).toHaveCount(0);
    const nav = page.getByRole("navigation", { name: "Jenis tulisan" });
    await expect(nav.getByRole("link", { name: "Semua" })).toHaveAttribute("aria-current", "true");
    const semua = await page.getByTestId("jumlah-berita").innerText();
    await nav.getByRole("link", { name: "Pengumuman" }).click();
    await expect(page).toHaveURL(new RegExp(`${URL}berita/jenis/pengumuman/?$`));
    await expect(nav.getByRole("link", { name: "Pengumuman" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(await page.getByTestId("jumlah-berita").innerText()).not.toBe(semua);
    await page.locator("main li a").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(p.galat).toEqual([]);
  });

  test("agenda: navigasi bulan statis; tepi rentang menonaktifkan tombol (bukan tautan putus)", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}agenda/`);
    const bulan0 = await page.getByTestId("kalender").getAttribute("data-bulan");
    await page.getByRole("link", { name: /Bulan berikutnya/ }).click();
    await expect(page).toHaveURL(new RegExp(`${URL}agenda/bulan/\\d{4}-\\d{2}/?$`));
    expect(await page.getByTestId("kalender").getAttribute("data-bulan")).not.toBe(bulan0);
    await page.getByRole("link", { name: "Bulan ini" }).click();
    await expect(page.getByTestId("kalender")).toHaveAttribute("data-bulan", bulan0!);
    // geser maju terus sampai tepi: tombol "berikutnya" menjadi non-tautan
    for (let i = 0; i < 40; i++) {
      const next = page.getByRole("link", { name: /Bulan berikutnya/ });
      if ((await next.count()) === 0) break;
      await next.click();
    }
    await expect(page.getByRole("link", { name: /Bulan berikutnya/ })).toHaveCount(0);
    await expect(
      page.locator("[aria-disabled='true']", { hasText: "Bulan berikutnya" }),
    ).toBeVisible();
    expect(p.galat).toEqual([]);
  });

  test("galeri: album dan lightbox bekerja dengan gambar di bawah sub-path", async ({ page }) => {
    const p = pantau(page);
    await page.goto(`${URL}galeri/`);
    await page
      .getByRole("link", { name: /Pentas Seni|Bakti Sosial|Kegiatan Belajar/ })
      .first()
      .click();
    await gambarTermuat(page);
    await page
      .getByRole("button", { name: /Perbesar/ })
      .first()
      .click();
    await expect(page.getByRole("dialog", { name: "Pratinjau gambar" })).toBeVisible();
    await gambarTermuat(page);
    expect(p.galat).toEqual([]);
  });

  test("donasi: validasi sama dengan versi lengkap; bukti palsu ditolak; sukses SIMULASI tanpa request ke server", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}donasi/renovasi-musala/`);
    await expect(page.getByRole("progressbar").first()).toBeVisible();
    const f = page.getByRole("form", { name: "Form konfirmasi donasi" });
    // atribut `required` bawaan browser memblokir submit sebelum validasi → nonaktifkan agar validasi (simulasi) teruji
    await f.evaluate((el) => ((el as HTMLFormElement).noValidate = true));
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(f.getByText(/Bukti transfer wajib diunggah/)).toBeVisible();

    await f.getByLabel("Nama donatur").fill("Siti Aminah");
    await f.getByLabel(/Nominal transfer/).fill("5000"); // di bawah minimum
    await f.getByLabel("Bukti transfer").setInputFiles(png());
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("galat-donasi").or(f.getByRole("alert")).first()).toBeVisible();

    // berkas bukan gambar sungguhan (dinamai .png) → ditolak oleh pemeriksa magic bytes yang sama
    await f.getByLabel(/Nominal transfer/).fill("150.000");
    await f.getByLabel("Bukti transfer").setInputFiles({
      name: "palsu.png",
      mimeType: "image/png",
      buffer: Buffer.from("<svg><script>alert(1)</script></svg>"),
    });
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(f.getByText(/tidak sesuai|Format berkas/)).toBeVisible();

    await f.getByLabel("Bukti transfer").setInputFiles(png());
    await f.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("donasi-sukses")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("demo:sekolah:donasi"))).toContain(
      "Siti Aminah",
    );
    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
    expect(p.galat).toEqual([]);
  });

  test("PPDB: wizard → nomor+token → cek status memakai data yang baru dibuat; salah token ditolak; contoh bawaan bekerja", async ({
    page,
  }) => {
    const p = pantau(page);
    await page.goto(`${URL}ppdb/daftar/`);
    // validasi langkah 1: kosong → tidak lanjut
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await expect(page.getByLabel("Nama orang tua/wali")).toBeHidden();

    await page.getByLabel("Nama lengkap calon siswa").fill("Siswa Uji Demo");
    await page.getByLabel("Tempat lahir").fill("Yogyakarta");
    await page.getByLabel("Tanggal lahir").fill("2014-05-20");
    await page.getByLabel("Jenis kelamin").selectOption("L");
    await page.getByLabel("Jenjang tujuan").selectOption({ index: 1 });
    await page.getByLabel("Asal sekolah").fill("SDN 1 Sleman");
    await page.getByLabel("Alamat lengkap").fill("Jl. Melati No. 5, Sleman, Yogyakarta");
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await page.getByLabel("Nama orang tua/wali").fill("Ahmad Santoso");
    await page.getByLabel("No. HP / WhatsApp").fill("081234567890");
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await page.getByLabel("Akta kelahiran").setInputFiles(png("akta.png"));
    await page.getByLabel("Kartu keluarga").setInputFiles(pdf("kk.pdf"));
    await page.getByLabel("Rapor / ijazah terakhir").setInputFiles(png("rapor.png"));
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await page.getByLabel(/Saya menyatakan data yang diisi benar/).check();
    await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();

    await expect(page.getByTestId("pendaftaran-sukses")).toBeVisible();
    const nomor = (await page.getByTestId("no-pendaftaran").innerText()).trim();
    const token = (await page.getByTestId("token-akses").innerText()).trim();
    expect(nomor).toMatch(/^PPDB-\d{4}-[2-9A-HJKMNP-Z]{6}$/);
    expect(token).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);

    await page.goto(`${URL}ppdb/status/`);
    await page.getByLabel("Nomor pendaftaran").fill(nomor);
    await page.getByLabel("Token akses").fill("ABCD-EFGH-JKMN"); // token salah
    await page.getByRole("button", { name: "Cek Status" }).click();
    await expect(page.getByTestId("galat-status")).toHaveText(
      "Nomor pendaftaran atau token tidak cocok.",
    );
    await page.getByLabel("Token akses").fill(token);
    await page.getByRole("button", { name: "Cek Status" }).click();
    await expect(page.getByTestId("hasil-status")).toContainText("Siswa Uji Demo");

    // contoh bawaan yang diumumkan di halaman
    await page.getByLabel("Nomor pendaftaran").fill("PPDB-2027-K7M2XQ");
    await page.getByLabel("Token akses").fill("ABCD-EFGH-JKMN");
    await page.getByRole("button", { name: "Cek Status" }).click();
    await expect(page.getByTestId("hasil-status")).toContainText("Calon Siswa Contoh");
    expect(p.request.filter((r) => r.startsWith("POST"))).toEqual([]);
    expect(p.galat).toEqual([]);
  });

  test("tanpa admin/API/unggahan di hasil", async ({ request }) => {
    for (const path of ["admin/", "api/auth/session/", "uploads/x.png"])
      expect((await request.get(`${URL}${path}`)).status(), path).toBe(404);
  });
});
