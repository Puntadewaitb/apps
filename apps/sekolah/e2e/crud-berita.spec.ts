import { expect, test, type Page } from "@playwright/test";
import bcrypt from "bcryptjs";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ADMIN_EMAIL,
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  awasi,
  berkasPng,
  berkasSvg,
  dbDate,
  huruf,
  login,
  query,
  tulis,
} from "./helpers";

const adaFile = (path: string) => existsSync(join("e2e-uploads", path.replace("/uploads/", "")));
/** Jumlah tulisan dengan judul tertentu (jangan hitung seluruh tabel: tes lain berjalan paralel). */
const jumlahJudul = (judul: string) =>
  query<{ c: number }>("SELECT count(*) c FROM Post WHERE title = ?", judul)[0]!.c;

/** Isi form berita; terbit dengan tanggal lama (2020) agar tidak menggeser data seed di beranda. */
async function isi(
  page: Page,
  o: { judul: string; ringkas?: string; isi?: string; terbit?: boolean },
) {
  await page.getByRole("textbox", { name: "Judul", exact: true }).fill(o.judul);
  await page
    .getByLabel("Ringkasan")
    .fill(o.ringkas ?? "Ringkasan uji yang cukup panjang untuk validasi.");
  await page
    .getByRole("textbox", { name: "Isi", exact: true })
    .fill(
      o.isi ??
        "## Subjudul\n\nIsi uji **tebal** dan cukup panjang untuk lolos validasi.\n\n- butir satu\n- butir dua",
    );
  if (o.terbit) {
    await page.getByLabel("Terbitkan (tampil di situs publik)").check();
    await page.getByLabel("Tanggal terbit (WIB)").fill("2020-01-15T08:00");
  }
}

test.describe("CRUD berita", () => {
  test("buat draf → tidak tampil publik → terbitkan → tampil → ubah (slug tetap) → hapus (file gambar ikut terhapus)", async ({
    page,
    request,
  }) => {
    const p = await awasi(page);
    const t = huruf();
    const judul = `Uji Berita ${t}`;
    await login(page);
    await page.goto("/admin/berita");
    await page.getByRole("link", { name: "+ Tulisan baru" }).click();
    await isi(page, { judul });
    await page.getByLabel("Gambar sampul").setInputFiles(berkasPng());
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/berita\?ok=tersimpan$/);
    await expect(page.getByTestId("flash")).toHaveText("Perubahan tersimpan.");

    const baris = page.getByTestId("baris-berita").filter({ hasText: judul });
    await expect(baris).toContainText("Draf");
    const row = query<{
      id: number;
      slug: string;
      image: string;
      authorId: number;
      published: number;
    }>("SELECT id, slug, image, authorId, published FROM Post WHERE title = ?", judul)[0]!;
    expect(row.slug).toBe(`uji-berita-${t}`);
    expect(row.image).toMatch(/^\/uploads\/[A-Za-z0-9_-]{16,}\.png$/);
    expect(row.published).toBe(0);
    expect(adaFile(row.image)).toBe(true);
    expect(
      query<{ email: string }>("SELECT email FROM User WHERE id = ?", row.authorId)[0]!.email,
    ).toBe(ADMIN_EMAIL);

    // draf: tidak ada di publik
    expect((await request.get(`/berita/${row.slug}`)).status()).toBe(404);
    // file unggahan disajikan dengan header aman
    const img = await request.get(row.image);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toBe("image/png");
    expect(img.headers()["x-content-type-options"]).toBe("nosniff");
    expect(img.headers()["content-security-policy"]).toContain("sandbox");
    expect(img.headers()["cache-control"]).toContain("immutable");

    // terbitkan lewat tombol cepat → perlu tanggal terbit: tombol memakai "sekarang"; kembalikan ke 2020 lewat form ubah
    await baris.getByRole("link", { name: "Ubah" }).click();
    await page.getByLabel("Terbitkan (tampil di situs publik)").check();
    await page.getByLabel("Tanggal terbit (WIB)").fill("2020-01-15T08:00");
    await page.getByRole("textbox", { name: "Judul", exact: true }).fill(`${judul} Revisi`);
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(
      page.getByTestId("baris-berita").filter({ hasText: `${judul} Revisi` }),
    ).toContainText("Terbit");
    const sesudah = query<{ slug: string; published: number }>(
      "SELECT slug, published FROM Post WHERE id = ?",
      row.id,
    )[0]!;
    expect(sesudah.slug).toBe(row.slug); // URL publik stabil walau judul berubah
    expect(sesudah.published).toBe(1);

    const pub = await page.request.get(`/berita/${row.slug}`);
    expect(pub.status()).toBe(200);
    await page.goto(`/berita/${row.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${judul} Revisi`);
    await expect(page.getByTestId("isi-artikel").locator("h2")).toHaveText("Subjudul");
    await expect(page.getByTestId("isi-artikel").locator("strong")).toHaveText("tebal");
    await expect(page.getByTestId("meta-berita")).toContainText("Admin Sekolah");

    // hapus → hilang dari publik, file gambar terhapus
    await page.goto("/admin/berita");
    page.once("dialog", (d) => void d.accept());
    await page
      .getByTestId("baris-berita")
      .filter({ hasText: judul })
      .getByRole("button", { name: "Hapus" })
      .click();
    await expect(page).toHaveURL(/ok=dihapus/);
    await expect(page.getByTestId("flash")).toHaveText("Data dihapus.");
    expect(query("SELECT id FROM Post WHERE id = ?", row.id)).toHaveLength(0);
    expect((await request.get(`/berita/${row.slug}`)).status()).toBe(404);
    expect(adaFile(row.image)).toBe(false);
    expect((await request.get(row.image)).status()).toBe(404);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("validasi: field kosong/pendek menampilkan pesan per field dan tidak menyimpan apa pun", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/berita/baru");
    await page.getByRole("textbox", { name: "Judul", exact: true }).fill("abc");
    await page.getByLabel("Ringkasan").fill("pendek");
    await page.getByRole("textbox", { name: "Isi", exact: true }).fill("pendek");
    await page.getByRole("button", { name: "Simpan" }).click();
    const form = page.getByRole("form", { name: "Form berita" });
    await expect(form).toContainText("Judul minimal 5 karakter.");
    await expect(form).toContainText("Ringkasan minimal 20 karakter.");
    await expect(form).toContainText("Isi minimal 30 karakter.");
    await expect(
      page.getByRole("alert").filter({ hasText: "Periksa kembali isian Anda." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/berita\/baru$/);
    expect(jumlahJudul("abc")).toBe(0);
  });

  test("setelah gagal validasi, isian yang sudah diketik TIDAK hilang (React mereset field tak terkontrol)", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/berita/baru");
    await page.getByRole("textbox", { name: "Judul", exact: true }).fill("abc");
    await page.getByLabel("Ringkasan").fill("Ringkasan yang cukup panjang untuk valid.");
    await page.getByRole("textbox", { name: "Isi", exact: true }).fill("isi pendek");
    await page.getByLabel("Jenis").selectOption("PENGUMUMAN");
    await page.getByLabel("Tanggal terbit (WIB)").fill("2020-01-15T08:00");
    await page.getByLabel("Terbitkan (tampil di situs publik)").check();
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page.getByRole("form", { name: "Form berita" })).toContainText(
      "Judul minimal 5 karakter.",
    );
    await expect(page.getByRole("textbox", { name: "Judul", exact: true })).toHaveValue("abc");
    await expect(page.getByLabel("Ringkasan")).toHaveValue(
      "Ringkasan yang cukup panjang untuk valid.",
    );
    await expect(page.getByRole("textbox", { name: "Isi", exact: true })).toHaveValue("isi pendek");
    await expect(page.getByLabel("Jenis")).toHaveValue("PENGUMUMAN");
    await expect(page.getByLabel("Tanggal terbit (WIB)")).toHaveValue("2020-01-15T08:00");
    await expect(page.getByLabel("Terbitkan (tampil di situs publik)")).toBeChecked();
  });

  test("unggahan berbahaya ditolak: SVG/skrip menyamar PNG, file teks, terlalu besar → tidak tersimpan", async ({
    page,
  }) => {
    await login(page);
    const judul = `Uji Unggah Buruk ${huruf()}`;
    await page.goto("/admin/berita/baru");
    await isi(page, { judul });
    const kasus: Array<
      [string, Parameters<ReturnType<Page["getByLabel"]>["setInputFiles"]>[0], string]
    > = [
      ["svg menyamar png", berkasSvg("lucu.png"), "Format gambar harus PNG, JPG, atau WebP."],
      [
        "teks",
        { name: "a.jpg", mimeType: "image/jpeg", buffer: Buffer.from("bukan gambar") },
        "Format gambar harus PNG, JPG, atau WebP.",
      ],
      [
        "terlalu besar",
        {
          name: "besar.png",
          mimeType: "image/png",
          buffer: Buffer.concat([berkasPng().buffer, Buffer.alloc(2 * 1024 * 1024)]),
        },
        "Ukuran gambar maksimal 2 MB.",
      ],
      [
        "mime tak cocok",
        { name: "a.png", mimeType: "image/jpeg", buffer: berkasPng().buffer },
        "Isi file tidak sesuai dengan tipe yang dinyatakan.",
      ],
    ];
    for (const [nama, file, pesan] of kasus) {
      await page.getByLabel("Gambar sampul").setInputFiles(file);
      await page.getByRole("button", { name: "Simpan" }).click();
      await expect(page.getByRole("form", { name: "Form berita" }), nama).toContainText(pesan);
      await expect(page).toHaveURL(/\/admin\/berita\/baru$/);
    }
    expect(jumlahJudul(judul)).toBe(0);
  });

  test("XSS lewat form: tag di judul dibuang; HTML di isi hanya tampil sebagai teks di situs publik", async ({
    page,
  }) => {
    const t = huruf();
    await login(page);
    await page.goto("/admin/berita/baru");
    await isi(page, {
      judul: `Uji Xss <img src=x onerror="window.__xss=1"> ${t}`,
      isi: `Paragraf <script>window.__xss=1</script> <img src=x onerror="window.__xss=1"> panjang cukup.\n\n[x](javascript:window.__xss=1)`,
      terbit: true,
    });
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/ok=tersimpan/);
    const row = query<{ slug: string; title: string }>(
      "SELECT slug, title FROM Post WHERE title LIKE ?",
      `%${t}%`,
    )[0]!;
    expect(row.title).not.toMatch(/[<>]/);
    await page.goto(`/berita/${row.slug}`);
    await expect(page.getByTestId("isi-artikel")).toContainText("<script>");
    expect(
      await page.getByTestId("isi-artikel").locator("script, img, a[href^='javascript']").count(),
    ).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);
    tulis((d) => d.prepare("DELETE FROM Post WHERE slug = ?").run(row.slug));
  });

  test("editor teks: toolbar menyisipkan sintaks, pratinjau memakai renderer aman, nilai tetap terkirim", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/admin/berita/baru");
    const isiEl = page.getByRole("textbox", { name: "Isi", exact: true });
    await isiEl.fill("halo dunia");
    await isiEl.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(5, 10));
    await page.getByRole("button", { name: "Tebal", exact: true }).click();
    await expect(isiEl).toHaveValue("halo **dunia**");
    await isiEl.fill("satu\ndua");
    await isiEl.evaluate((el: HTMLTextAreaElement) => el.setSelectionRange(6, 6));
    await page.getByRole("button", { name: "Daftar butir" }).click();
    await expect(isiEl).toHaveValue("satu\n- dua");
    await isiEl.fill(
      "## Judul\n\nteks **tebal** <script>window.__xss=1</script> [aman](/berita) [jahat](javascript:alert(1))",
    );
    await page.getByRole("button", { name: "Pratinjau" }).click();
    const pv = page.getByTestId("pratinjau");
    await expect(pv.locator("h2")).toHaveText("Judul");
    await expect(pv.locator("strong")).toHaveText("tebal");
    await expect(pv).toContainText("<script>");
    expect(await pv.locator("script, a[href^='javascript']").count()).toBe(0);
    await expect(pv.getByRole("link", { name: "aman" })).toHaveAttribute("href", "/berita");
    await page.getByRole("button", { name: "Tulis" }).click();
    await expect(isiEl).toBeVisible();
    await expect(isiEl).toHaveValue(/## Judul/);
  });

  test("terjadwal: terbit dengan tanggal masa depan tidak tampil publik; tombol 'Jadikan draf' bekerja", async ({
    page,
    request,
  }) => {
    const t = huruf();
    await login(page);
    await page.goto("/admin/berita/baru");
    await isi(page, { judul: `Uji Jadwal ${t}` });
    await page.getByLabel("Terbitkan (tampil di situs publik)").check();
    await page.getByLabel("Tanggal terbit (WIB)").fill("2099-01-01T08:00");
    await page.getByRole("button", { name: "Simpan" }).click();
    const baris = page.getByTestId("baris-berita").filter({ hasText: `Uji Jadwal ${t}` });
    await expect(baris).toContainText("Terjadwal");
    const row = query<{ id: number; slug: string }>(
      "SELECT id, slug FROM Post WHERE title = ?",
      `Uji Jadwal ${t}`,
    )[0]!;
    expect((await request.get(`/berita/${row.slug}`)).status()).toBe(404);
    await baris.getByRole("button", { name: "Jadikan draf" }).click();
    await expect(
      page.getByTestId("baris-berita").filter({ hasText: `Uji Jadwal ${t}` }),
    ).toContainText("Draf");
    expect(
      query<{ published: number }>("SELECT published FROM Post WHERE id = ?", row.id)[0]!.published,
    ).toBe(0);
    tulis((d) => d.prepare("DELETE FROM Post WHERE id = ?").run(row.id));
  });

  test("editor (peran EDITOR) boleh mengelola berita", async ({ page }) => {
    const t = huruf();
    await login(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto("/admin/berita/baru");
    await isi(page, { judul: `Uji Editor ${t}` });
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(
      page.getByTestId("baris-berita").filter({ hasText: `Uji Editor ${t}` }),
    ).toBeVisible();
    const author = query<{ email: string }>(
      "SELECT u.email FROM Post p JOIN User u ON u.id = p.authorId WHERE p.title = ?",
      `Uji Editor ${t}`,
    )[0]!;
    expect(author.email).toBe(EDITOR_EMAIL);
    tulis((d) => d.prepare("DELETE FROM Post WHERE title = ?").run(`Uji Editor ${t}`));
  });

  test("aksi server memeriksa sesi: akun dihapus saat form terbuka → aksi ditolak & dialihkan ke login, data tidak berubah", async ({
    page,
  }) => {
    const email = `uji-${huruf()}@sekolah.example`;
    const hash = await bcrypt.hash("password-uji-123456", 4);
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO User (email, name, passwordHash, role, createdAt) VALUES (?, 'Sementara', ?, 'EDITOR', ?)",
        )
        .run(email, hash, dbDate(Date.now())),
    );
    await login(page, email, "password-uji-123456");
    await page.goto("/admin/berita/baru");
    const judulSesi = `Uji Sesi ${huruf()}`;
    await isi(page, { judul: judulSesi });
    tulis((d) => d.prepare("DELETE FROM User WHERE email = ?").run(email)); // sesi masih "berlaku" di cookie
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    expect(jumlahJudul(judulSesi)).toBe(0);
  });

  test("ID tidak valid / tidak ada → 404; tulisan yang dihapus saat diedit → pesan, bukan error", async ({
    page,
  }) => {
    await login(page);
    for (const id of ["99999", "abc", "-1", "1e3", "0x10"]) {
      const res = await page.goto(`/admin/berita/${id}`);
      expect(res?.status(), id).toBe(404);
    }
    const t = huruf();
    await page.goto("/admin/berita/baru");
    await isi(page, { judul: `Uji Hilang ${t}` });
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(page).toHaveURL(/ok=tersimpan/);
    const id = query<{ id: number }>("SELECT id FROM Post WHERE title = ?", `Uji Hilang ${t}`)[0]!
      .id;
    await page.goto(`/admin/berita/${id}`);
    tulis((d) => d.prepare("DELETE FROM Post WHERE id = ?").run(id));
    await page.getByRole("button", { name: "Simpan" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Tulisan tidak ditemukan" }),
    ).toBeVisible();
  });
});
