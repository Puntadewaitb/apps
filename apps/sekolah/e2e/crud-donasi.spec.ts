import { expect, test, type Page } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  awasi,
  berkasPdf,
  berkasPng,
  berkasSvg,
  dbDate,
  huruf,
  login,
  query,
  tulis,
  uniqueIp,
} from "./helpers";

// Serial: tes menghitung berkas di dokumen/ dan mengubah progres program bersama.
test.describe.configure({ mode: "serial" });

const DIR_DOK = join("e2e-uploads", "dokumen");
const berkas = () => (existsSync(DIR_DOK) ? readdirSync(DIR_DOK).length : 0);
const spasi = (s: string | null) => (s ?? "").replace(/\s+/g, " ");
const rp = (n: number) => `Rp ${n.toLocaleString("id-ID")}`;

type Don = {
  id: number;
  programId: number;
  donorName: string;
  anonymous: number;
  amount: number;
  status: string;
  proofPath: string;
  verifiedAt: string | null;
  message: string;
};
const don = (nama: string) => query<Don>("SELECT * FROM Donation WHERE donorName = ?", nama)[0];
const program = (slug: string) =>
  query<{ id: number; target: number; title: string }>(
    "SELECT id, target, title FROM DonationProgram WHERE slug = ?",
    slug,
  )[0]!;

async function konfirmasi(
  page: Page,
  o: {
    slug?: string;
    nama: string;
    nominal?: string;
    anonim?: boolean;
    pesan?: string;
    ip?: string;
    bukti?: Parameters<ReturnType<Page["getByLabel"]>["setInputFiles"]>[0];
  },
) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": o.ip ?? uniqueIp() });
  await page.goto(`/donasi/${o.slug ?? "buku-perpustakaan"}`);
  const form = page.getByRole("form", { name: "Form konfirmasi donasi" });
  await form.getByLabel("Nama donatur").fill(o.nama);
  await form.getByLabel(/Nominal transfer/).fill(o.nominal ?? "150.000");
  await form.getByLabel("Bukti transfer").setInputFiles(o.bukti ?? berkasPng("bukti.png"));
  if (o.pesan) await form.getByLabel(/Pesan/).fill(o.pesan);
  if (o.anonim) await form.getByLabel(/Sembunyikan nama saya/).check();
  await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
}

const progresPublik = async (page: Page, slug: string) => {
  await page.goto(`/donasi/${slug}`);
  return {
    terkumpul: spasi(await page.getByTestId("terkumpul").textContent()),
    persen: await page.getByTestId("persen").textContent(),
  };
};

test.describe("alur donatur → verifikasi admin → progres", () => {
  test("konfirmasi tersimpan MENUNGGU (bukti privat), belum dihitung di progres & belum tampil di daftar donatur", async ({
    page,
    request,
  }) => {
    const p = await awasi(page);
    const nama = `Donatur ${huruf()}`;
    const g0 = await progresPublik(page, "buku-perpustakaan");
    const sebelum = berkas();
    await konfirmasi(page, { nama, nominal: "Rp 2.500.000", pesan: "Semoga bermanfaat" });
    await expect(page.getByTestId("donasi-sukses")).toContainText("Terima kasih");
    const d = don(nama)!;
    expect(d.status).toBe("MENUNGGU");
    expect(d.amount).toBe(2_500_000); // "Rp 2.500.000" → angka
    expect(d.verifiedAt).toBeNull();
    expect(d.proofPath).toMatch(/^[A-Za-z0-9_-]{16,}\.png$/);
    expect(berkas()).toBe(sebelum + 1);
    expect((await request.get(`/uploads/${d.proofPath}`)).status()).toBe(404); // bukan di jalur publik
    // progres & daftar donatur tidak berubah
    expect(await progresPublik(page, "buku-perpustakaan")).toEqual(g0);
    await expect(page.getByTestId("daftar-donatur")).not.toContainText(nama);
    // anonim tidak boleh membuka bukti
    const tolak = await request.get(`/admin/donasi/bukti/${d.id}`, { maxRedirects: 0 });
    expect(tolak.status()).toBe(307);
    expect(tolak.headers()["location"]).toContain("/admin/login");
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("admin memverifikasi → progres naik tepat sebesar nominal; donatur tampil; menolak → turun lagi", async ({
    page,
    browser,
    request,
  }) => {
    const nama = `Donatur ${huruf()}`;
    const slug = "buku-perpustakaan";
    const g0 = await progresPublik(page, slug);
    await konfirmasi(page, { nama, nominal: "3.000.000", pesan: "Untuk buku" });
    await expect(page.getByTestId("donasi-sukses")).toBeVisible();
    const d = don(nama)!;
    const prog = program(slug);
    const dasar = Number(g0.terkumpul.replace(/\D/g, ""));

    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    // dashboard: jumlah "Donasi menunggu" = jumlah MENUNGGU di DB
    await ap.goto("/admin");
    const menunggu = query<{ c: number }>(
      "SELECT count(*) c FROM Donation WHERE status = 'MENUNGGU'",
    )[0]!.c;
    await expect(ap.getByTestId("ringkasan-donasi")).toContainText(String(menunggu));
    // daftar & detail
    await ap.goto("/admin/donasi?status=menunggu");
    const baris = ap.getByTestId("baris-donasi").filter({ hasText: nama });
    await expect(baris).toContainText(rp(3_000_000));
    await baris.getByRole("link", { name: "Tinjau" }).click();
    await expect(ap.getByTestId("status-donasi")).toHaveText("Menunggu verifikasi");
    await expect(ap.getByTestId("data-donasi")).toContainText("Untuk buku");
    // bukti hanya untuk admin, dengan header aman
    const bukti = await ap.request.get(`/admin/donasi/bukti/${d.id}`);
    expect(bukti.status()).toBe(200);
    expect(bukti.headers()["content-type"]).toBe("image/png");
    expect(bukti.headers()["content-disposition"]).toMatch(/^inline/);
    expect(bukti.headers()["x-content-type-options"]).toBe("nosniff");
    expect(bukti.headers()["content-security-policy"]).toContain("sandbox");
    expect(bukti.headers()["cache-control"]).toContain("no-store");
    expect((await ap.request.get("/admin/donasi/bukti/99999")).status()).toBe(404);
    for (const x of ["abc", "-1", "1e3"])
      expect((await ap.request.get(`/admin/donasi/bukti/${x}`)).status(), x).toBe(404);

    // verifikasi
    await ap.getByRole("button", { name: "Verifikasi" }).click();
    await expect(ap.getByTestId("status-donasi")).toHaveText("Terverifikasi");
    const v = don(nama)!;
    expect(v.status).toBe("TERVERIFIKASI");
    expect(v.verifiedAt).not.toBeNull();
    const naik = await progresPublik(page, slug);
    expect(Number(naik.terkumpul.replace(/\D/g, ""))).toBe(dasar + 3_000_000);
    expect(naik.persen).toBe(`${Math.floor(((dasar + 3_000_000) / prog.target) * 100)}%`);
    await expect(page.getByTestId("daftar-donatur")).toContainText(nama);
    await expect(page.getByTestId("daftar-donatur")).toContainText("Untuk buku");
    // ringkasan admin ikut
    await ap.goto("/admin/donasi");
    await expect(
      ap.getByTestId("baris-program").filter({ hasText: prog.title }).getByTestId("verif"),
    ).toContainText(rp(dasar + 3_000_000));

    // tolak → progres kembali, donatur hilang dari daftar publik
    await ap.goto(`/admin/donasi/${d.id}`);
    await ap.getByRole("button", { name: "Tolak" }).click();
    await expect(ap.getByTestId("status-donasi")).toHaveText("Ditolak");
    expect(don(nama)!.verifiedAt).toBeNull();
    expect(Number((await progresPublik(page, slug)).terkumpul.replace(/\D/g, ""))).toBe(dasar);
    await expect(page.getByTestId("daftar-donatur")).not.toContainText(nama);
    // kembalikan ke menunggu
    await ap.goto(`/admin/donasi/${d.id}`);
    await ap.getByRole("button", { name: "Kembalikan ke menunggu" }).click();
    await expect(ap.getByTestId("status-donasi")).toHaveText("Menunggu verifikasi");
    void request;
    await admin.close();
  });

  test("donatur anonim: nama asli tidak pernah ada di HTML publik walau sudah diverifikasi", async ({
    page,
    browser,
    request,
  }) => {
    const nama = `Rahasia ${huruf()}`;
    await konfirmasi(page, { nama, anonim: true, nominal: "100.000" });
    await expect(page.getByTestId("donasi-sukses")).toBeVisible();
    const d = don(nama)!;
    expect(d.anonymous).toBe(1);
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    await ap.goto(`/admin/donasi/${d.id}`);
    await expect(ap.getByTestId("data-donasi")).toContainText(nama); // admin tetap tahu
    await ap.getByRole("button", { name: "Verifikasi" }).click();
    await expect(ap.getByTestId("status-donasi")).toHaveText("Terverifikasi");
    const html = await (await request.get("/donasi/buku-perpustakaan")).text();
    expect(html).not.toContain(nama);
    expect(html).toContain("Hamba Allah");
    expect(await (await request.get("/donasi")).text()).not.toContain(nama);
    await admin.close();
  });

  test("validasi: nominal/bukti salah → ditolak; tidak ada baris & tidak ada berkas yatim", async ({
    page,
  }) => {
    const nama = `Donatur ${huruf()}`;
    const sebelum = berkas();
    for (const [nominal, bukti, pesan] of [
      ["abc", berkasPng(), "Nominal hanya berisi angka bulat rupiah"],
      ["9.999", berkasPng(), "Nominal minimal"],
      ["1.000.000.001", berkasPng(), "Nominal maksimal"],
      ["150.000", berkasSvg("b.png"), "Format berkas harus PDF, PNG, JPG, atau WebP."],
      [
        "150.000",
        {
          name: "b.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.concat([berkasPdf().buffer, Buffer.alloc(2 * 1024 * 1024)]),
        },
        "Ukuran berkas maksimal 2 MB.",
      ],
      [
        "150.000",
        { name: "b.png", mimeType: "image/png", buffer: berkasPdf().buffer },
        "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
      ],
    ] as const) {
      await konfirmasi(page, { nama, nominal, bukti });
      await expect(
        page.getByRole("form", { name: "Form konfirmasi donasi" }),
        nominal,
      ).toContainText(pesan);
    }
    expect(don(nama)).toBeUndefined();
    expect(berkas()).toBe(sebelum);
  });

  test("PDF diterima sebagai bukti dan diunduh (attachment) oleh admin", async ({
    page,
    browser,
  }) => {
    const nama = `Donatur ${huruf()}`;
    await konfirmasi(page, { nama, bukti: berkasPdf("bukti.pdf") });
    await expect(page.getByTestId("donasi-sukses")).toBeVisible();
    const d = don(nama)!;
    expect(d.proofPath).toMatch(/\.pdf$/);
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    const r = await ap.request.get(`/admin/donasi/bukti/${d.id}`);
    expect(r.headers()["content-type"]).toBe("application/pdf");
    expect(r.headers()["content-disposition"]).toMatch(/^attachment/);
    await admin.close();
  });

  test("program ditutup (batas waktu lewat) saat formulir terbuka → server menolak; halaman menampilkan pesan ditutup", async ({
    page,
  }) => {
    const slug = "buku-perpustakaan";
    const nama = `Donatur ${huruf()}`;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto(`/donasi/${slug}`);
    const lama = query<{ deadline: string | null }>(
      "SELECT deadline FROM DonationProgram WHERE slug = ?",
      slug,
    )[0]!.deadline;
    const form = page.getByRole("form", { name: "Form konfirmasi donasi" });
    await form.getByLabel("Nama donatur").fill(nama);
    await form.getByLabel(/Nominal transfer/).fill("150.000");
    await form.getByLabel("Bukti transfer").setInputFiles(berkasPng());
    try {
      tulis((d) =>
        d
          .prepare("UPDATE DonationProgram SET deadline = ? WHERE slug = ?")
          .run(dbDate(Date.now() - 86_400_000), slug),
      );
      await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
      await expect(page.getByTestId("galat-donasi")).toHaveText(
        "Program donasi ini tidak ditemukan atau sudah ditutup.",
      );
      expect(don(nama)).toBeUndefined();
      await page.goto(`/donasi/${slug}`);
      await expect(page.getByTestId("donasi-ditutup")).toBeVisible();
      await expect(page.getByRole("form", { name: "Form konfirmasi donasi" })).toHaveCount(0);
    } finally {
      tulis((d) =>
        d.prepare("UPDATE DonationProgram SET deadline = ? WHERE slug = ?").run(lama, slug),
      );
    }
  });

  test("honeypot (bot) → tampak sukses tetapi tidak tersimpan; rate limit >5/jam/IP", async ({
    page,
  }) => {
    const nama = `Donatur ${huruf()}`;
    const sebelum = berkas();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/donasi/buku-perpustakaan");
    const form = page.getByRole("form", { name: "Form konfirmasi donasi" });
    await form.getByLabel("Nama donatur").fill(nama);
    await form.getByLabel(/Nominal transfer/).fill("150.000");
    await form.getByLabel("Bukti transfer").setInputFiles(berkasPng());
    await page
      .locator('input[name="website_url"]')
      .evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("donasi-sukses")).toBeVisible();
    expect(don(nama)).toBeUndefined();
    expect(berkas()).toBe(sebelum);

    // rate limit: 6 kiriman kosong dari IP yang sama
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/donasi/buku-perpustakaan");
    const f2 = page.getByRole("form", { name: "Form konfirmasi donasi" });
    await f2.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    for (let i = 0; i < 6; i++) {
      await f2.getByRole("button", { name: "Kirim Konfirmasi" }).click();
      await expect(
        page.getByTestId("galat-donasi").or(f2.getByText("Periksa kembali isian Anda.")).first(),
      ).toBeVisible();
    }
    await expect(page.getByTestId("galat-donasi")).toContainText("Terlalu banyak percobaan");
  });
});

test.describe("program donasi (admin) & keamanan", () => {
  test("buat program → tampil publik 0% → ubah target → nonaktifkan → 404 publik; gambar diunggah", async ({
    page,
    browser,
    request,
  }) => {
    const judul = `Uji Program ${huruf()}`;
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await awasi(ap);
    await login(ap);
    await ap.goto("/admin/donasi/program");
    await ap.getByRole("link", { name: "+ Program baru" }).click();
    await ap.getByLabel("Judul program").fill(judul);
    await ap
      .getByLabel(/^Deskripsi/)
      .fill("Program uji untuk memeriksa pembuatan program donasi dari panel admin.");
    await ap.getByLabel(/Target dana/).fill("75.000.000");
    await ap.getByLabel("Batas waktu").fill("2099-12-31");
    await ap.getByLabel("Gambar program").setInputFiles(berkasPng());
    await ap.getByRole("button", { name: "Simpan" }).click();
    await expect(ap).toHaveURL(/\/admin\/donasi\/program\?ok=tersimpan$/);
    const row = query<{ id: number; slug: string; target: number; image: string; active: number }>(
      "SELECT id, slug, target, image, active FROM DonationProgram WHERE title = ?",
      judul,
    )[0]!;
    expect(row.slug).toMatch(/^uji-program-/);
    expect(row.target).toBe(75_000_000);
    expect(row.image).toMatch(/^\/uploads\/.+\.png$/);

    await page.goto(`/donasi/${row.slug}`);
    expect(await page.getByTestId("persen").textContent()).toBe("0%");
    await expect(page.getByRole("form", { name: "Form konfirmasi donasi" })).toBeVisible();
    await page.goto("/donasi");
    await expect(page.getByTestId("kartu-program-donasi").filter({ hasText: judul })).toBeVisible();

    await ap.goto(`/admin/donasi/program/${row.id}`);
    await ap.getByLabel(/Target dana/).fill("100000000");
    await ap.getByLabel(/Aktif/).uncheck();
    await ap.getByRole("button", { name: "Simpan" }).click();
    await expect(ap).toHaveURL(/ok=tersimpan/);
    expect(
      query<{ target: number; active: number }>(
        "SELECT target, active FROM DonationProgram WHERE id = ?",
        row.id,
      )[0],
    ).toEqual({ target: 100_000_000, active: 0 });
    expect((await request.get(`/donasi/${row.slug}`)).status()).toBe(404); // nonaktif tidak publik
    await page.goto("/donasi");
    await expect(page.getByTestId("kartu-program-donasi").filter({ hasText: judul })).toHaveCount(
      0,
    );
    tulis((d) => d.prepare("DELETE FROM DonationProgram WHERE id = ?").run(row.id));
    await admin.close();
  });

  test("validasi program: target kecil/bukan angka, tanggal fiktif, judul pendek (isian dipertahankan)", async ({
    browser,
  }) => {
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    await ap.goto("/admin/donasi/program/baru");
    const form = ap.getByRole("form", { name: "Form program donasi" });
    await form.getByLabel("Judul program").fill("abc");
    await form.getByLabel(/^Deskripsi/).fill("pendek");
    await form.getByLabel(/Target dana/).fill("1.500");
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await ap.getByLabel("Batas waktu").evaluate((el: HTMLInputElement) => {
      el.type = "text";
      el.value = "2027-02-30";
    });
    await ap.getByRole("button", { name: "Simpan" }).click();
    await expect(form).toContainText("Judul minimal 5 karakter.");
    await expect(form).toContainText("Deskripsi minimal 20 karakter.");
    await expect(form).toContainText("Nominal minimal Rp 100.000.");
    await expect(form).toContainText("Batas waktu tidak valid.");
    await expect(form.getByLabel("Judul program")).toHaveValue("abc");
    expect(query("SELECT id FROM DonationProgram WHERE title = 'abc'")).toHaveLength(0);
    for (const id of ["99999", "abc", "-1"])
      expect((await ap.goto(`/admin/donasi/program/${id}`))?.status(), id).toBe(404);
    await admin.close();
  });

  test("hak akses: anonim → login; EDITOR ditolak (menu, halaman, bukti)", async ({
    page,
    browser,
  }) => {
    for (const u of ["/admin/donasi", "/admin/donasi/1", "/admin/donasi/program"]) {
      await page.goto(u);
      await expect(page, u).toHaveURL(/\/admin\/login/);
    }
    const ed = await browser.newContext();
    const ep = await ed.newPage();
    await login(ep, EDITOR_EMAIL, EDITOR_PASSWORD);
    await expect(
      ep.getByRole("navigation", { name: "Menu admin" }).getByRole("link", { name: "Donasi" }),
    ).toHaveCount(0);
    for (const u of [
      "/admin/donasi",
      "/admin/donasi/1",
      "/admin/donasi/program",
      "/admin/donasi/program/baru",
    ]) {
      await ep.goto(u);
      await expect(ep, u).toHaveURL(/\/admin\?akses=ditolak$/);
    }
    const id = query<{ id: number }>("SELECT id FROM Donation LIMIT 1")[0]!.id;
    const r = await ep.request.get(`/admin/donasi/bukti/${id}`);
    expect(r.status()).toBe(403);
    await ed.close();
  });

  test("data 'kotor' langsung di DB (HTML/skrip pada nama & pesan): tampil sebagai teks di publik dan admin; nama berkas bukti berbahaya diabaikan", async ({
    page,
    browser,
  }) => {
    const t = huruf();
    const kotor = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    const prog = program("buku-perpustakaan");
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Donation (programId, donorName, anonymous, amount, message, proofPath, status, verifiedAt, createdAt) VALUES (?, ?, 0, 50000, ?, '../../etc/passwd', 'TERVERIFIKASI', ?, ?)",
        )
        .run(
          prog.id,
          `${kotor}Nama${t}`,
          `${kotor} pesan ${t}`,
          dbDate(Date.now()),
          dbDate(Date.now()),
        ),
    );
    try {
      await awasi(page);
      await page.goto("/donasi/buku-perpustakaan");
      const item = page.getByTestId("item-donatur").filter({ hasText: `Nama${t}` });
      await expect(item).toHaveCount(1);
      expect(await item.locator("img, script").count()).toBe(0);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(
        0,
      );
      const admin = await browser.newContext();
      const ap = await admin.newPage();
      await login(ap);
      await ap.goto("/admin/donasi");
      const baris = ap.getByTestId("baris-donasi").filter({ hasText: `Nama${t}` });
      await expect(baris).toHaveCount(1);
      expect(await baris.locator("img, script").count()).toBe(0);
      const id = query<{ id: number }>(
        "SELECT id FROM Donation WHERE donorName LIKE ?",
        `%Nama${t}`,
      )[0]!.id;
      await ap.goto(`/admin/donasi/${id}`);
      expect(await ap.getByTestId("data-donasi").locator("img, script").count()).toBe(0);
      // proofPath berbahaya → 404, bukan pembacaan berkas di luar folder
      expect((await ap.request.get(`/admin/donasi/bukti/${id}`)).status()).toBe(404);
      expect(await ap.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);
      await admin.close();
    } finally {
      tulis((d) => d.prepare("DELETE FROM Donation WHERE donorName LIKE ?").run(`%Nama${t}`));
    }
  });
});
