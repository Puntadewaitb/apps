import { expect, test, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
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
  isiWizard,
  login,
  query,
  tulis,
  uniqueIp,
} from "./helpers";

// Seluruh berkas serial: tes menghitung berkas di folder dokumen/ dan mengubah tabel Registration bersama.
test.describe.configure({ mode: "serial" });

const DIR_DOK = join("e2e-uploads", "dokumen");
const berkasDokumen = () => (existsSync(DIR_DOK) ? readdirSync(DIR_DOK).sort() : []);
const hashToken = (t: string) =>
  createHash("sha256").update(t.toUpperCase().replace(/[\s-]/g, "")).digest("hex");

type Reg = {
  id: number;
  regNo: string;
  tokenHash: string;
  status: string;
  documents: string;
  studentName: string;
  adminNote: string;
};
const reg = (nama: string) =>
  query<Reg>("SELECT * FROM Registration WHERE studentName = ?", nama)[0];

async function kirim(page: Page, o: Parameters<typeof isiWizard>[1] & { ip?: string } = {}) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": o.ip ?? uniqueIp() });
  await page.goto("/ppdb/daftar");
  await isiWizard(page, o);
  await page.getByLabel("Saya menyatakan data yang diisi benar").check();
  await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();
}

async function ambilKredensial(page: Page) {
  await expect(page.getByTestId("pendaftaran-sukses")).toBeVisible();
  return {
    nomor: (await page.getByTestId("no-pendaftaran").textContent())!,
    token: (await page.getByTestId("token-akses").textContent())!,
  };
}

const cekStatus = async (page: Page, nomor: string, token: string, ip = uniqueIp()) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
  await page.goto("/ppdb/status");
  await page.getByLabel("Nomor pendaftaran").fill(nomor);
  await page.getByLabel("Token akses").fill(token);
  await page.getByRole("button", { name: "Cek Status" }).click();
};

test.describe("alur pendaftaran → status → tinjauan admin", () => {
  test("daftar lewat wizard → nomor & token acak tampil sekali; token hanya tersimpan sebagai hash; berkas privat", async ({
    page,
    request,
  }) => {
    const p = await awasi(page);
    const nama = `Siswa ${huruf()}`;
    const sebelum = berkasDokumen().length;
    await kirim(page, { nama, pekerjaan: "Guru" });
    const { nomor, token } = await ambilKredensial(page);
    expect(nomor).toMatch(/^PPDB-\d{4}-[2-9A-HJKMNP-Z]{6}$/);
    expect(token).toMatch(/^[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/);
    await expect(page.getByText("hanya ditampilkan satu kali")).toBeVisible();

    const r = reg(nama)!;
    expect(r.regNo).toBe(nomor);
    expect(r.status).toBe("BARU");
    expect(r.tokenHash).toBe(hashToken(token));
    // token polos tidak ada di baris mana pun
    expect(JSON.stringify(r)).not.toContain(token);
    expect(JSON.stringify(r)).not.toContain(token.replace(/-/g, ""));
    // dokumen: 3 wajib tersimpan sebagai berkas privat dengan nama acak (bukan nama asli)
    const dok = JSON.parse(r.documents) as Array<{ kind: string; file: string }>;
    expect(dok.map((d) => d.kind).sort()).toEqual(["akta", "kk", "rapor"]);
    expect(berkasDokumen().length).toBe(sebelum + 3);
    for (const d of dok) {
      expect(d.file).not.toMatch(/akta|kk|rapor/);
      expect(existsSync(join(DIR_DOK, d.file))).toBe(true);
      // tidak bisa diambil lewat jalur unggahan publik
      expect((await request.get(`/uploads/${d.file}`)).status()).toBe(404);
      expect((await request.get(`/uploads/dokumen/${d.file}`)).status()).toBe(404);
    }
    // anonim tidak boleh membuka dokumen / daftar pendaftar
    for (const u of [`/admin/ppdb/dokumen/${r.id}/akta`, "/admin/ppdb/ekspor"]) {
      // proxy mengalihkan anonim ke login (307) — tidak ada data yang bocor
      const tolak = await request.get(u, { maxRedirects: 0 });
      expect(tolak.status(), u).toBe(307);
      expect(tolak.headers()["location"], u).toContain("/admin/login");
      const diikuti = await request.get(u);
      expect(diikuti.headers()["content-type"], u).toContain("text/html");
    }
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("cek status: nomor+token benar menampilkan data; variasi penulisan diterima; token salah / nomor lain → pesan identik", async ({
    page,
  }) => {
    const nama = `Siswa ${huruf()}`;
    await kirim(page, { nama });
    const { nomor, token } = await ambilKredensial(page);

    await cekStatus(page, nomor, token);
    const hasil = page.getByTestId("hasil-status");
    await expect(hasil).toContainText(nama);
    await expect(hasil).toContainText("SMP Kelas 7");
    await expect(page.getByTestId("status-badge")).toHaveText("Baru diterima");
    await expect(hasil).toContainText("Akta kelahiran, Kartu keluarga, Rapor / ijazah terakhir");
    await expect(hasil).not.toContainText("Pas foto"); // opsional & tidak diunggah

    // huruf kecil, tanpa tanda hubung, spasi di tepi
    await cekStatus(page, ` ${nomor.toLowerCase()} `, token.toLowerCase().replace(/-/g, ""));
    await expect(page.getByTestId("hasil-status")).toContainText(nama);

    // token salah (satu karakter diganti) dan nomor yang tidak ada → pesan IDENTIK
    const salah = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
    await cekStatus(page, nomor, salah);
    const pesanSalah = await page.getByTestId("galat-status").textContent();
    await cekStatus(page, "PPDB-2027-AAAAAA", token);
    expect(await page.getByTestId("galat-status").textContent()).toBe(pesanSalah);
    expect(pesanSalah).toBe("Nomor pendaftaran atau token tidak cocok.");
    await expect(page.getByTestId("hasil-status")).toHaveCount(0);
    // data pendaftar tidak ikut dikirim ke browser pada kasus gagal
    await expect(page.locator("body")).not.toContainText(nama);
  });

  test("tebak token: per-nomor dibatasi (>8 percobaan) walau IP berganti-ganti", async ({
    page,
  }) => {
    const nama = `Siswa ${huruf()}`;
    await kirim(page, { nama });
    const { nomor, token } = await ambilKredensial(page);
    for (let i = 0; i < 8; i++) {
      await cekStatus(page, nomor, "ZZZZ-ZZZZ-ZZZZ");
      await expect(page.getByTestId("galat-status")).toHaveText(
        "Nomor pendaftaran atau token tidak cocok.",
      );
    }
    // percobaan ke-9 dari IP baru dengan token BENAR pun diblokir (nomor dikunci sementara)
    await cekStatus(page, nomor, token);
    await expect(page.getByTestId("galat-status")).toHaveText(
      "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    );
    await expect(page.getByTestId("hasil-status")).toHaveCount(0);
  });

  test("admin: daftar, filter, cari, detail, buka dokumen (header aman), ubah status + catatan → tampil di status publik", async ({
    page,
    browser,
  }) => {
    const nama = `Siswa ${huruf()}`;
    await kirim(page, { nama, pekerjaan: '=HYPERLINK("http://evil.example","x")' });
    const { nomor, token } = await ambilKredensial(page);
    const r = reg(nama)!;

    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    await ap.goto("/admin/ppdb");
    const baris = ap.getByTestId("baris-ppdb").filter({ hasText: nomor });
    await expect(baris).toContainText(nama);
    await expect(baris).toContainText("Baru diterima");
    await expect(ap.getByRole("link", { name: /^Baru diterima \(\d+\)$/ })).toBeVisible();

    // filter status & pencarian
    await ap.goto("/admin/ppdb?status=baru");
    await expect(ap.getByTestId("baris-ppdb").filter({ hasText: nomor })).toHaveCount(1);
    await ap.goto("/admin/ppdb?status=diterima");
    await expect(ap.getByTestId("baris-ppdb").filter({ hasText: nomor })).toHaveCount(0);
    await ap.goto(`/admin/ppdb?q=${encodeURIComponent(nama)}`);
    await expect(ap.getByTestId("baris-ppdb")).toHaveCount(1);
    await ap.goto(`/admin/ppdb?q=${encodeURIComponent(nomor.toLowerCase())}`);
    await expect(ap.getByTestId("baris-ppdb")).toHaveCount(1);
    await ap.goto("/admin/ppdb?status=bukan-status&q=%27%3B%20DROP%20TABLE%20Registration%3B--");
    await expect(ap.getByRole("heading", { level: 1 })).toContainText("Pendaftar PPDB");

    // detail
    await ap.goto(`/admin/ppdb/${r.id}`);
    await expect(ap.getByTestId("nama-pendaftar")).toHaveText(nama);
    const data = ap.getByTestId("data-pendaftar");
    await expect(data).toContainText("Yogyakarta, 20 Mei 2014");
    await expect(data).toContainText("6281234567890");
    await expect(data).toContainText("=HYPERLINK"); // tampil sebagai teks biasa

    // dokumen: admin boleh; header aman; PDF diunduh (attachment), gambar inline
    const links = ap.getByTestId("dokumen-pendaftar").getByRole("link");
    await expect(links).toHaveCount(3);
    const akta = await ap.request.get(`/admin/ppdb/dokumen/${r.id}/akta`);
    expect(akta.status()).toBe(200);
    expect(akta.headers()["content-type"]).toBe("image/png");
    expect(akta.headers()["content-disposition"]).toMatch(/^inline/);
    expect(akta.headers()["x-content-type-options"]).toBe("nosniff");
    expect(akta.headers()["content-security-policy"]).toContain("sandbox");
    expect(akta.headers()["cache-control"]).toContain("no-store");
    const kk = await ap.request.get(`/admin/ppdb/dokumen/${r.id}/kk`);
    expect(kk.headers()["content-type"]).toBe("application/pdf");
    expect(kk.headers()["content-disposition"]).toMatch(/^attachment/);
    expect((await ap.request.get(`/admin/ppdb/dokumen/${r.id}/foto`)).status()).toBe(404); // tidak diunggah
    for (const x of ["../x", "AKTA", "lain", "%2e%2e"])
      expect((await ap.request.get(`/admin/ppdb/dokumen/${r.id}/${x}`)).status(), x).toBe(404);
    expect((await ap.request.get("/admin/ppdb/dokumen/99999/akta")).status()).toBe(404);

    // ubah status + catatan
    await ap.getByRole("combobox", { name: "Status" }).selectOption("DITERIMA");
    await ap.getByLabel(/Catatan untuk pendaftar/).fill("Selamat! Daftar ulang 1–10 Maret 2027.");
    await ap.getByRole("button", { name: "Simpan status" }).click();
    await expect(ap.getByRole("status").filter({ hasText: "Status tersimpan." })).toBeVisible();
    expect(query<Reg>("SELECT * FROM Registration WHERE id = ?", r.id)[0]!.status).toBe("DITERIMA");

    // pendaftar melihat status baru + catatan
    await cekStatus(page, nomor, token);
    await expect(page.getByTestId("status-badge")).toHaveText("Diterima");
    await expect(page.getByTestId("catatan-panitia")).toContainText(
      "Daftar ulang 1–10 Maret 2027.",
    );

    // ekspor CSV: label status, filter, dan netralisasi formula
    const csv = await ap.request.get("/admin/ppdb/ekspor?status=diterima");
    expect(csv.status()).toBe(200);
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(csv.headers()["content-disposition"]).toMatch(
      /^attachment; filename="ppdb-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect(csv.headers()["x-content-type-options"]).toBe("nosniff");
    const teks = await csv.text();
    expect(teks).toContain(nomor);
    expect(teks).toContain("Diterima");
    expect(teks).toContain("Akta kelahiran; Kartu keluarga; Rapor / ijazah terakhir");
    expect(teks).toContain("'=HYPERLINK"); // diberi awalan apostrof: tidak dieksekusi Excel/Sheets
    expect(teks).not.toMatch(/(^|,)=HYPERLINK/m);
    const semua = await (await ap.request.get("/admin/ppdb/ekspor")).text();
    expect(semua.split("\r\n").length).toBeGreaterThanOrEqual(2);
    await admin.close();
  });

  test("ubah status: nilai di luar daftar & catatan > 500 karakter ditolak; ID tidak valid → 404", async ({
    page,
    browser,
  }) => {
    const nama = `Siswa ${huruf()}`;
    await kirim(page, { nama });
    await ambilKredensial(page);
    const r = reg(nama)!;
    const admin = await browser.newContext();
    const ap = await admin.newPage();
    await login(ap);
    await ap.goto(`/admin/ppdb/${r.id}`);
    const form = ap.getByRole("form", { name: "Form ubah status" });
    // penyerang mengubah nilai <option> lewat devtools
    await ap.getByRole("combobox", { name: "Status" }).evaluate((el: HTMLSelectElement) => {
      el.options[0]!.value = "DITERIMA_PALSU";
    });
    await ap.getByRole("button", { name: "Simpan status" }).click();
    await expect(form).toContainText("Status tidak valid.");
    expect(query<Reg>("SELECT * FROM Registration WHERE id = ?", r.id)[0]!.status).toBe("BARU");
    await ap.reload();
    await ap
      .getByLabel(/Catatan untuk pendaftar/)
      .evaluate((el: HTMLTextAreaElement) => el.removeAttribute("maxlength"));
    await ap.getByLabel(/Catatan untuk pendaftar/).fill("x".repeat(501));
    await ap.getByRole("button", { name: "Simpan status" }).click();
    await expect(form).toContainText("Catatan maksimal 500 karakter.");
    expect(query<Reg>("SELECT * FROM Registration WHERE id = ?", r.id)[0]!.adminNote).toBe("");
    for (const id of ["99999", "abc", "-1", "1e3"])
      expect((await ap.goto(`/admin/ppdb/${id}`))?.status(), id).toBe(404);
    await admin.close();
  });
});

test.describe("keamanan & ketahanan", () => {
  test("hak akses: anonim → login; EDITOR ditolak (menu, halaman, ekspor, dokumen)", async ({
    page,
    browser,
  }) => {
    for (const u of ["/admin/ppdb", "/admin/ppdb/1"]) {
      await page.goto(u);
      await expect(page, u).toHaveURL(/\/admin\/login/);
    }
    const ed = await browser.newContext();
    const ep = await ed.newPage();
    await login(ep, EDITOR_EMAIL, EDITOR_PASSWORD);
    await expect(
      ep.getByRole("navigation", { name: "Menu admin" }).getByRole("link", { name: "PPDB" }),
    ).toHaveCount(0);
    await ep.goto("/admin/ppdb");
    await expect(ep).toHaveURL(/\/admin\?akses=ditolak$/);
    await expect(ep.getByRole("alert").filter({ hasText: "tidak memiliki akses" })).toBeVisible();
    const id = query<{ id: number }>("SELECT id FROM Registration ORDER BY id LIMIT 1")[0]?.id ?? 1;
    await ep.goto(`/admin/ppdb/${id}`);
    await expect(ep).toHaveURL(/\/admin\?akses=ditolak$/);
    for (const u of ["/admin/ppdb/ekspor", `/admin/ppdb/dokumen/${id}/akta`]) {
      const r = await ep.request.get(u);
      expect(r.status(), u).toBe(403);
      expect(await r.json()).toEqual({ error: "Tidak diizinkan." });
    }
    await ed.close();
  });

  test("validasi server: isian salah → pesan per field, kembali ke langkah yang tepat, isian & berkas TIDAK hilang, tidak ada baris/berkas baru", async ({
    page,
  }) => {
    const nama = `Siswa ${huruf()}`;
    const sebelum = berkasDokumen().length;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/daftar");
    await isiWizard(page, { nama, alamat: "pendek" }); // alamat < 10 karakter
    await page.getByLabel("Saya menyatakan data yang diisi benar").check();
    await page
      .getByLabel("No. HP / WhatsApp")
      .evaluate((el: HTMLInputElement) => (el.value = "123")); // HP tidak valid
    await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();
    await expect(page.getByTestId("galat-form")).toHaveText("Periksa kembali isian Anda.");
    // lompat ke langkah 1 (alamat bermasalah) dan menampilkan pesan
    await expect(page.getByTestId("langkah").locator("[aria-current=step]")).toContainText("1.");
    await expect(page.getByRole("form", { name: "Form pendaftaran PPDB" })).toContainText(
      "Alamat minimal 10 karakter.",
    );
    await expect(page.getByLabel("Nama lengkap calon siswa")).toHaveValue(nama); // tidak hilang
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await expect(page.getByRole("form", { name: "Form pendaftaran PPDB" })).toContainText(
      "Nomor HP tidak valid",
    );
    await page.getByRole("button", { name: "Lanjut →" }).click();
    // berkas tetap terpilih → ringkasan di langkah 4 masih bisa menampilkannya setelah dikoreksi
    expect(
      await page.getByLabel("Akta kelahiran").evaluate((el: HTMLInputElement) => el.files?.length),
    ).toBe(1);
    expect(reg(nama)).toBeUndefined();
    expect(berkasDokumen().length).toBe(sebelum);
  });

  test("dokumen wajib kosong / berkas berbahaya ditolak SEMUANYA (atomik): tidak ada baris & tidak ada berkas yatim", async ({
    page,
  }) => {
    const nama = `Siswa ${huruf()}`;
    const sebelum = berkasDokumen().length;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/daftar");
    await isiWizard(page, { nama, dokumen: false, sampaiLangkah: 3 });
    // akta valid, KK = SVG menyamar PDF, rapor kosong
    await page.getByLabel("Akta kelahiran").setInputFiles(berkasPng("akta.png"));
    await page.getByLabel("Kartu keluarga").setInputFiles(berkasSvg("kk.pdf"));
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await page.getByLabel("Saya menyatakan data yang diisi benar").check();
    await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();
    const form = page.getByRole("form", { name: "Form pendaftaran PPDB" });
    await expect(page.getByTestId("langkah").locator("[aria-current=step]")).toContainText("3.");
    await expect(form).toContainText("Dokumen ini wajib diunggah."); // rapor
    await expect(form).toContainText("Format berkas harus PDF, PNG, JPG, atau WebP."); // svg
    expect(reg(nama)).toBeUndefined();
    expect(berkasDokumen().length).toBe(sebelum); // akta valid TIDAK ikut tertulis
  });

  test("berkas terlalu besar / MIME tidak cocok isi / EXE ditolak", async ({ page }) => {
    const nama = `Siswa ${huruf()}`;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/daftar");
    await isiWizard(page, { nama, dokumen: false, sampaiLangkah: 3 });
    await page.getByLabel("Akta kelahiran").setInputFiles({
      name: "besar.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.concat([berkasPdf().buffer, Buffer.alloc(2 * 1024 * 1024)]),
    });
    await page
      .getByLabel("Kartu keluarga")
      .setInputFiles({ name: "kk.png", mimeType: "image/png", buffer: berkasPdf().buffer }); // PDF diklaim PNG
    await page.getByLabel("Rapor / ijazah terakhir").setInputFiles({
      name: "x.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]),
    }); // EXE
    await page.getByRole("button", { name: "Lanjut →" }).click();
    await page.getByLabel("Saya menyatakan data yang diisi benar").check();
    await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();
    const form = page.getByRole("form", { name: "Form pendaftaran PPDB" });
    await expect(form).toContainText("Ukuran berkas maksimal 2 MB.");
    await expect(form).toContainText("Isi berkas tidak sesuai dengan tipe yang dinyatakan.");
    await expect(form).toContainText("Format berkas harus PDF, PNG, JPG, atau WebP.");
    expect(reg(nama)).toBeUndefined();
  });

  test("honeypot terisi (bot) → tampak sukses tetapi TIDAK ada baris/berkas yang tersimpan", async ({
    page,
  }) => {
    const nama = `Siswa ${huruf()}`;
    const sebelum = berkasDokumen().length;
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/ppdb/daftar");
    await isiWizard(page, { nama });
    await page.getByLabel("Saya menyatakan data yang diisi benar").check();
    await page
      .locator('input[name="website_url"]')
      .evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
    await page.getByRole("button", { name: "Kirim Pendaftaran" }).click();
    await expect(page.getByTestId("pendaftaran-sukses")).toBeVisible();
    expect(reg(nama)).toBeUndefined();
    expect(berkasDokumen().length).toBe(sebelum);
  });

  test("rate limit pendaftaran: >5 percobaan/jam/IP diblokir (IP lain tidak terdampak)", async ({
    page,
  }) => {
    const ip = uniqueIp();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await page.goto("/ppdb/daftar");
    // kirim formulir kosong dengan melewati validasi browser
    await page
      .getByRole("form", { name: "Form pendaftaran PPDB" })
      .evaluate((f: HTMLFormElement) => (f.noValidate = true));
    for (let i = 0; i < 6; i++) {
      await page
        .getByRole("button", { name: "Lanjut →" })
        .click()
        .catch(() => undefined);
      await page.locator("form").evaluate((f: HTMLFormElement) => f.requestSubmit());
      await expect(page.getByTestId("galat-form")).toBeVisible();
      if (i < 5)
        await expect(page.getByTestId("galat-form")).toHaveText("Periksa kembali isian Anda.");
    }
    await expect(page.getByTestId("galat-form")).toContainText(
      "Terlalu banyak percobaan pendaftaran",
    );
  });

  test("data 'kotor' langsung di DB: teks di-escape di panel admin & status publik; nama berkas berbahaya diabaikan", async ({
    page,
    browser,
  }) => {
    const t = huruf();
    const kotor = `<img src=x onerror="window.__xss=1"><script>window.__xss=1</script>`;
    const nomor = `PPDB-2027-${"ABCDEF"
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")}`;
    const token = "ABCD-EFGH-JKMN";
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO Registration (regNo, tokenHash, status, adminNote, studentName, birthPlace, birthDate, gender, previousSchool, address, targetGrade, parentName, parentPhone, parentEmail, parentJob, documents, createdAt, updatedAt) VALUES (?, ?, 'BARU', ?, ?, ?, ?, 'P', ?, ?, 'SMP Kelas 7', ?, '6281234567890', '', ?, ?, ?, ?)",
        )
        .run(
          nomor,
          hashToken(token),
          `${kotor} catatan ${t}`,
          `${kotor}Nama${t}`,
          kotor,
          dbDate(new Date("2014-05-20T00:00:00Z")),
          kotor,
          kotor,
          `${kotor}Ortu${t}`,
          kotor,
          JSON.stringify([
            { kind: "akta", file: "../../../etc/passwd", mime: "image/png", size: 1 },
            { kind: "kk", file: "abcdefghijklmnop.pdf", mime: "application/pdf", size: 1 }, // file tidak ada
            { kind: 7, file: "x" },
          ]),
          dbDate(Date.now()),
          dbDate(Date.now()),
        ),
    );
    const id = query<{ id: number }>("SELECT id FROM Registration WHERE regNo = ?", nomor)[0]!.id;
    try {
      const admin = await browser.newContext();
      const ap = await admin.newPage();
      await awasi(ap);
      await login(ap);
      await ap.goto("/admin/ppdb");
      const baris = ap.getByTestId("baris-ppdb").filter({ hasText: `Nama${t}` });
      await expect(baris).toHaveCount(1);
      expect(await baris.locator("img, script").count()).toBe(0);
      await ap.goto(`/admin/ppdb/${id}`);
      expect(await ap.getByTestId("data-pendaftar").locator("img, script").count()).toBe(0);
      await expect(ap.getByTestId("data-pendaftar")).toContainText("<script>");
      // dokumen berbentuk salah dibuang; yang berkasnya hilang → 404, bukan crash/traversal
      await expect(ap.getByTestId("dokumen-pendaftar").getByRole("link")).toHaveCount(1);
      expect((await ap.request.get(`/admin/ppdb/dokumen/${id}/kk`)).status()).toBe(404);
      expect((await ap.request.get(`/admin/ppdb/dokumen/${id}/akta`)).status()).toBe(404);
      expect(await ap.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(0);

      await cekStatus(page, nomor, token);
      const hasil = page.getByTestId("hasil-status");
      await expect(hasil).toContainText(`Nama${t}`);
      await expect(page.getByTestId("catatan-panitia")).toContainText("<script>");
      expect(await hasil.locator("img, script").count()).toBe(0);
      expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0)).toBe(
        0,
      );
      const csv = await (await ap.request.get("/admin/ppdb/ekspor")).text();
      expect(csv).toContain(nomor); // ekspor tidak error karena data kotor
      await admin.close();
    } finally {
      tulis((d) => d.prepare("DELETE FROM Registration WHERE id = ?").run(id));
    }
  });
});
