import { expect, test } from "@playwright/test";
import { ADMIN_PASSWORD, huruf, loginAdmin, query, tag, uniqueIp } from "./helpers";

const HALAMAN = [
  "/admin",
  "/admin/tamu",
  "/admin/rsvp",
  "/admin/ucapan",
  "/admin/pratinjau",
  "/admin/pratinjau/aqiqah-demo",
];

test.describe("akses admin", () => {
  test("semua halaman admin mengalihkan ke login tanpa sesi; ekspor 401", async ({
    page,
    request,
  }) => {
    for (const h of HALAMAN) {
      await page.goto(h);
      await expect(page, h).toHaveURL(/\/admin\/login$/);
    }
    for (const j of ["rsvp", "tamu", "ucapan"]) {
      expect((await request.get(`/admin/ekspor/${j}`)).status(), j).toBe(401);
    }
  });

  test("password salah ditolak; menu admin tidak tampil", async ({ page }) => {
    await loginAdmin(page, "salah-total");
    await expect(page).toHaveURL(/error=salah/);
    await expect(page.locator("main [role=alert]")).toHaveText("Password salah.");
    await expect(page.getByRole("navigation", { name: "Menu admin" })).toHaveCount(0);
  });

  test("login: cookie khusus app (HttpOnly, SameSite=Strict), ringkasan acara aktif tampil", async ({
    page,
  }) => {
    await loginAdmin(page);
    await expect(page).toHaveURL(/\/admin$/);
    const cookie = (await page.context().cookies()).find((c) => c.name === "undangan_admin");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Strict");
    expect(
      (await page.context().cookies()).find((c) => c.name === "admin_session"),
    ).toBeUndefined();
    await expect(page.getByTestId("acara-aktif")).toHaveText(
      "Undangan Pernikahan: Raka & Anisa · tema floral",
    );
    for (const s of [
      "orang-hadir",
      "rsvp-hadir",
      "tidak-hadir",
      "masih-ragu",
      "tamu-terdaftar",
      "ucapan-tampil",
    ]) {
      await expect(page.getByTestId(`stat-${s}`)).toBeVisible();
    }
  });

  test("cookie palsu ditolak; logout menghapus sesi", async ({ page, context }) => {
    await context.addCookies([
      { name: "undangan_admin", value: "9999999999.abc.palsu", url: "http://localhost:3003" },
    ]);
    await page.goto("/admin/tamu");
    await expect(page).toHaveURL(/\/admin\/login$/);

    await loginAdmin(page);
    await expect(page).toHaveURL(/\/admin$/);
    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/);
    expect((await page.request.get("/admin/ekspor/rsvp")).status()).toBe(401);
  });

  test("login dibatasi (percobaan ke-6) & origin asing ditolak", async ({ page, request }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    for (let i = 0; i < 5; i++) {
      await page.goto("/admin/login");
      await page.getByLabel("Password").fill(`salah-${i}`);
      await page.getByRole("button", { name: "Masuk" }).click();
      await expect(page).toHaveURL(/error=salah/);
    }
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page).toHaveURL(/error=terlalu-banyak/);

    const res = await request.post("/api/admin/login", {
      headers: { origin: "http://evil.example", "x-forwarded-for": uniqueIp() },
      form: { password: ADMIN_PASSWORD },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(403);
  });
});

test.describe("tamu & tautan", () => {
  test("tambah massal → tautan pribadi berfungsi, WA & hapus", async ({ page, browser }) => {
    const a = huruf();
    const b = huruf();
    await loginAdmin(page);
    await page.goto("/admin/tamu");
    await page
      .getByLabel("Daftar tamu")
      .fill(`Bapak ${a} & Keluarga; 4; 0812-1111-2222\nIbu ${b}\n  \nSahabat ${a}; 1`);
    await page.getByRole("button", { name: "Tambah & Buat Tautan" }).click();
    await expect(page.getByRole("status")).toContainText("3 tamu ditambahkan");

    const baris = page.getByTestId("baris-tamu").filter({ hasText: `Bapak ${a} & Keluarga` });
    await expect(baris).toHaveCount(1);
    await expect(baris).toContainText("4");
    const tautan = await baris.locator("a", { hasText: "?kode=" }).textContent();
    expect(tautan).toMatch(/^http:\/\/localhost:3003\/\?kode=[2-9A-HJKMNP-Z]{8}$/);
    // WA ke nomor tamu, dengan tautan pribadi di dalam pesan
    const wa = await baris.getByRole("link", { name: "Bagikan via WA" }).getAttribute("href");
    expect(wa).toMatch(/^https:\/\/wa\.me\/6281211112222\?text=/);
    expect(decodeURIComponent(wa!)).toContain(tautan!);
    // tamu tanpa HP → wa.me tanpa nomor
    const tanpaHp = page.getByTestId("baris-tamu").filter({ hasText: `Ibu ${b}` });
    expect(
      await tanpaHp.getByRole("link", { name: "Bagikan via WA" }).getAttribute("href"),
    ).toMatch(/^https:\/\/wa\.me\/\?text=/);

    // Tamu membuka tautan (tanpa login): nama & batas orang terisi
    const tamuCtx = await browser.newContext();
    const tp = await tamuCtx.newPage();
    await tp.route("https://www.google.com/**", (r) => r.abort());
    await tp.goto(new URL(tautan!).pathname + new URL(tautan!).search);
    await expect(tp.getByTestId("nama-tamu")).toHaveText(`Bapak ${a} & Keluarga`);
    await tp.getByRole("button", { name: "Buka Undangan" }).click();
    await expect(tp.getByRole("form", { name: "Form RSVP" }).getByLabel("Nama")).toHaveValue(
      `Bapak ${a} & Keluarga`,
    );
    await expect(tp.getByLabel("Jumlah orang yang hadir").locator("option")).toHaveCount(4);
    await tamuCtx.close();

    // Hapus → tautan tidak berlaku lagi
    await baris.getByRole("button", { name: `Hapus Bapak ${a} & Keluarga` }).click();
    await expect(
      page.getByTestId("baris-tamu").filter({ hasText: `Bapak ${a} & Keluarga` }),
    ).toHaveCount(0);
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await p2.goto(new URL(tautan!).pathname + new URL(tautan!).search);
    await expect(p2.getByTestId("nama-tamu")).toHaveText("Tamu Undangan");
    await ctx2.close();
  });

  test("baris salah: seluruh pengiriman ditolak (tidak ada yang tersimpan) dengan nomor baris", async ({
    page,
  }) => {
    const x = huruf();
    await loginAdmin(page);
    await page.goto("/admin/tamu");
    await page.getByLabel("Daftar tamu").fill(`Valid ${x}; 2\nSalah ${x}; 99\nSalah2 ${x}; 2; 123`);
    await page.getByRole("button", { name: "Tambah & Buat Tautan" }).click();
    const alert = page.getByRole("alert").filter({ hasText: "Tidak ada tamu yang disimpan" });
    await expect(alert).toContainText("Baris 2: Jumlah orang harus 1–20");
    await expect(alert).toContainText("Baris 3: Nomor HP tidak valid");
    expect(query("SELECT 1 FROM Guest WHERE name LIKE ?", `%${x}%`)).toHaveLength(0);
  });

  test("RSVP lewat tautan tamu tampil di rekap & dashboard tamu", async ({ page, browser }) => {
    const n = huruf();
    await loginAdmin(page);
    await page.goto("/admin/tamu");
    await page.getByLabel("Daftar tamu").fill(`Tamu ${n}; 3`);
    await page.getByRole("button", { name: "Tambah & Buat Tautan" }).click();
    const baris = page.getByTestId("baris-tamu").filter({ hasText: `Tamu ${n}` });
    const tautan = (await baris.locator("a", { hasText: "?kode=" }).textContent())!;
    const kode = new URL(tautan).searchParams.get("kode")!;

    const ctx = await browser.newContext();
    const tp = await ctx.newPage();
    await tp.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await tp.route("https://www.google.com/**", (r) => r.abort());
    await tp.goto(`/?kode=${kode}`);
    await tp.getByRole("button", { name: "Buka Undangan" }).click();
    await tp
      .getByRole("form", { name: "Form RSVP" })
      .getByLabel("Jumlah orang yang hadir")
      .selectOption("3");
    await tp.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(tp.getByTestId("rsvp-sukses")).toBeVisible();
    await ctx.close();

    await page.goto("/admin/tamu");
    await expect(page.getByTestId("baris-tamu").filter({ hasText: `Tamu ${n}` })).toContainText(
      "Hadir",
    );
    await page.goto("/admin/rsvp");
    const r = page.getByTestId("baris-rsvp").filter({ hasText: kode });
    await expect(r).toContainText(`Tamu ${n}`);
    await expect(r).toContainText("Hadir");
    await expect(r).toContainText("3");
  });
});

test.describe("moderasi ucapan", () => {
  test("sembunyikan → hilang dari publik; tampilkan → kembali; hapus → hilang permanen", async ({
    page,
    request,
  }) => {
    const t = tag("m");
    const res = await request.post("/api/ucapan", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { name: "Penulis", message: `Ucapan moderasi ${t}` },
    });
    expect(res.status()).toBe(201);
    const publik = async () =>
      JSON.stringify(
        await (
          await request.get("/api/ucapan", { headers: { "x-forwarded-for": uniqueIp() } })
        ).json(),
      );
    expect(await publik()).toContain(t);

    await loginAdmin(page);
    await page.goto("/admin/ucapan");
    const item = () => page.getByTestId("baris-ucapan").filter({ hasText: t });
    await item().getByRole("button", { name: "Sembunyikan" }).click();
    await expect(item()).toHaveAttribute("data-visible", "false");
    await expect(item()).toContainText("Disembunyikan");
    expect(await publik()).not.toContain(t);

    await item().getByRole("button", { name: "Tampilkan" }).click();
    await expect(item()).toHaveAttribute("data-visible", "true");
    expect(await publik()).toContain(t);

    await item().getByRole("button", { name: "Hapus" }).click();
    await expect(item()).toHaveCount(0);
    expect(query("SELECT 1 FROM Wish WHERE message LIKE ?", `%${t}%`)).toHaveLength(0);
  });

  test("ucapan berisi tautan otomatis tertahan di admin & bisa disetujui", async ({
    page,
    request,
  }) => {
    const t = tag("s");
    await request.post("/api/ucapan", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { name: "Promotor", message: `Kunjungi https://promo.example ${t}` },
    });
    await loginAdmin(page);
    await page.goto("/admin/ucapan");
    const item = page.getByTestId("baris-ucapan").filter({ hasText: t });
    await expect(item).toHaveAttribute("data-visible", "false");
    await item.getByRole("button", { name: "Tampilkan" }).click();
    await expect(item).toHaveAttribute("data-visible", "true");
    const list = await (
      await request.get("/api/ucapan", { headers: { "x-forwarded-for": uniqueIp() } })
    ).json();
    expect(JSON.stringify(list)).toContain(t);
  });
});

test.describe("ekspor CSV", () => {
  test("tamu, rsvp, ucapan: header, isi, dan formula dinetralkan; jenis tak dikenal 404", async ({
    page,
    request,
  }) => {
    const n = huruf();
    const t = tag("e");
    await request.post("/api/ucapan", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { name: "Penulis", message: `=HYPERLINK("http://x") ${t}` },
    });
    await loginAdmin(page);
    await page.goto("/admin/tamu");
    await page.getByLabel("Daftar tamu").fill(`=1+1 ${n}; 2`);
    await page.getByRole("button", { name: "Tambah & Buat Tautan" }).click();
    await expect(page.getByRole("status")).toContainText("1 tamu");

    const tamu = await page.request.get("/admin/ekspor/tamu");
    expect(tamu.status()).toBe(200);
    expect(tamu.headers()["content-type"]).toContain("text/csv");
    expect(tamu.headers()["content-disposition"]).toMatch(
      /attachment; filename="tamu-raka-anisa-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    const csvTamu = await tamu.text();
    expect(csvTamu.split("\r\n")[0]).toContain("id,nama,kode,maks_orang,no_hp,tautan");
    expect(csvTamu).toContain(`'=1+1 ${n}`);
    expect(csvTamu).toContain("http://localhost:3003/?kode=");

    const rsvp = await (await page.request.get("/admin/ekspor/rsvp")).text();
    expect(rsvp.split("\r\n")[0]).toContain("id,waktu,nama,status,jumlah_orang,kode_tamu");
    expect(rsvp).toContain("Ibu Dewi Lestari"); // data seed

    const ucapan = await (await page.request.get("/admin/ekspor/ucapan")).text();
    expect(ucapan.split("\r\n")[0]).toContain("id,waktu,nama,ucapan,tampil");
    expect(ucapan).toContain(`'=HYPERLINK`);
    expect(ucapan).not.toMatch(new RegExp(`(^|,)"?=HYPERLINK`, "m"));

    expect((await page.request.get("/admin/ekspor/semua")).status()).toBe(404);
    expect((await page.request.get("/admin/ekspor/..%2Fetc")).status()).toBe(404);
  });
});
