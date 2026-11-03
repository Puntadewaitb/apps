import { encode } from "next-auth/jwt";
import { expect, test } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  E2E_SECRET,
  STAFF_EMAIL,
  STAFF_PASSWORD,
  buatProduk,
  login,
  query,
  tulis,
  uniqueIp,
} from "./helpers";

const HALAMAN_ADMIN = [
  "/admin",
  "/admin/produk",
  "/admin/produk/baru",
  "/admin/kategori",
  "/admin/stok",
];

test.describe("gerbang & login", () => {
  test("anonim: semua halaman admin dialihkan ke login (dengan callbackUrl); API → 401 JSON", async ({
    request,
  }) => {
    for (const u of [...HALAMAN_ADMIN, "/admin/produk/1", "/admin/kategori/1"]) {
      const r = await request.get(u, { maxRedirects: 0 });
      expect([307, 308], u).toContain(r.status());
      expect(r.headers()["location"], u).toContain("/admin/login");
    }
    const api = await request.get("/api/admin/ringkasan");
    expect(api.status()).toBe(401);
    expect(await api.json()).toEqual({ error: "Belum login." });
  });

  test("bypass gerbang gagal: header x-middleware-subrequest (CVE-2025-29927), trailing slash, encoding, case", async ({
    request,
  }) => {
    for (const [u, h] of [
      [
        "/admin",
        { "x-middleware-subrequest": "middleware:middleware:middleware:middleware:middleware" },
      ],
      ["/admin", { "x-middleware-subrequest": "src/middleware:src/middleware" }],
      ["/admin", { "x-middleware-subrequest": "proxy" }],
      ["/admin/", {}],
      ["/admin/produk/", {}],
      ["/%61dmin", {}],
      ["/admin%2Fproduk", {}],
      ["/admin/./produk", {}],
      ["/ADMIN/produk", {}],
    ] as const) {
      const r = await request.get(u, { headers: h, maxRedirects: 0 });
      expect(r.status(), `${u} ${JSON.stringify(h)}`).not.toBe(200);
      const body = r.status() < 300 ? await r.text() : "";
      expect(body).not.toContain("Dashboard Admin");
    }
  });

  test("JWT palsu ditolak: cookie acak, secret lain, uid fiktif; klaim role ADMIN tak berlaku bila di DB STAFF", async ({
    context,
    page,
  }) => {
    const tanam = async (nilai: string) => {
      await context.clearCookies();
      await context.addCookies([
        { name: "next-auth.session-token", value: nilai, url: "http://localhost:3005" },
      ]);
    };
    const tolak = async (nama: string) => {
      await page.goto("/admin/produk");
      expect(page.url(), nama).toContain("/admin/login");
    };
    for (const v of ["bukan.jwt.valid", "x", "a".repeat(2000)]) {
      await tanam(v);
      await tolak(`cookie "${v.slice(0, 10)}"`);
    }
    await tanam(
      await encode({
        token: { uid: 1, role: "ADMIN", sub: "1" },
        secret: "rahasia-penyerang-0123456789abcdef-xyz-abc",
      }),
    );
    await tolak("secret salah");
    // JWT sah secara kriptografis tetapi akun tidak ada di DB → ditolak oleh pemeriksaan ulang server (bukan hanya proxy)
    await tanam(
      await encode({
        token: { uid: 99_999_999, role: "ADMIN", sub: "99999999" },
        secret: E2E_SECRET,
      }),
    );
    await tolak("uid fiktif");
    // JWT sah dengan klaim role ADMIN, tetapi di DB akunnya STAFF → hak mengikuti DB
    const staf = query<{ id: number }>("SELECT id FROM User WHERE email = ?", STAFF_EMAIL)[0]!;
    await tanam(
      await encode({
        token: { uid: staf.id, role: "ADMIN", sub: String(staf.id), uid_: 1 },
        secret: E2E_SECRET,
      }),
    );
    await page.goto("/admin/produk");
    expect(page.url()).toContain("/admin?akses=ditolak");
    await expect(page.getByTestId("info-pengguna")).toContainText("Staf");
  });

  test("login berhasil → dashboard; keluar → kembali ke login & akses tertutup lagi", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dashboard Admin");
    await expect(page.getByTestId("info-pengguna")).toContainText("Administrator");
    const cookie = (await page.context().cookies()).find((c) =>
      c.name.endsWith("next-auth.session-token"),
    )!;
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.sameSite).toBe("Strict");
    await page.getByRole("button", { name: "Keluar" }).click();
    await page.waitForURL(/\/admin\/login/);
    await page.goto("/admin/produk");
    expect(page.url()).toContain("/admin/login");
  });

  test("galat login identik untuk email tak terdaftar / password salah; tidak membocorkan akun", async ({
    page,
  }) => {
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    const pesan: string[] = [];
    for (const [e, p] of [
      [ADMIN_EMAIL, "salah-salah-salah"],
      ["tidak.ada@toko.example", "salah-salah-salah"],
      [STAFF_EMAIL, "x"],
    ] as const) {
      await page.goto("/admin/login");
      await page.getByLabel("Email").fill(e);
      await page.getByLabel("Password").fill(p);
      await page.getByRole("button", { name: "Masuk" }).click();
      await expect(page.getByTestId("galat-login")).toBeVisible();
      pesan.push((await page.getByTestId("galat-login").textContent())!);
    }
    expect(new Set(pesan).size).toBe(1);
    expect(pesan[0]).toBe("Email atau password salah.");
  });

  test("callbackUrl anti open redirect: hanya path /admin internal", async ({ page }) => {
    for (const cb of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "/produk",
    ]) {
      await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
      await page.goto(`/admin/login?callbackUrl=${encodeURIComponent(cb)}`);
      await page.getByLabel("Email").fill(ADMIN_EMAIL);
      await page.getByLabel("Password").fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: "Masuk" }).click();
      await page.waitForURL(/localhost:3005\/admin$/);
      await page.context().clearCookies();
    }
    // callback sah dihormati
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto(`/admin/login?callbackUrl=${encodeURIComponent("/admin/kategori")}`);
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await page.waitForURL(/\/admin\/kategori$/);
  });

  test("rate limit login per IP: setelah 10 percobaan salah → ditolak bahkan dengan password benar", async ({
    page,
  }) => {
    const ip = uniqueIp();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    for (let i = 0; i < 11; i++) {
      await page.goto("/admin/login");
      await page.getByLabel("Email").fill("brute@toko.example");
      await page.getByLabel("Password").fill(`salah-${i}`);
      await page.getByRole("button", { name: "Masuk" }).click();
      await expect(page.getByTestId("galat-login")).toBeVisible();
    }
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByTestId("galat-login")).toContainText("Terlalu banyak percobaan");
    expect(page.url()).toContain("/admin/login");
  });

  test("akun dihapus / peran diturunkan setelah login → akses langsung hilang (peran dari DB, bukan token)", async ({
    page,
  }) => {
    const email = `sementara-${Date.now()}@toko.example`;
    const hash = query<{ passwordHash: string }>(
      "SELECT passwordHash FROM User WHERE email = ?",
      ADMIN_EMAIL,
    )[0]!.passwordHash;
    tulis((d) =>
      d
        .prepare("INSERT INTO User (email, name, passwordHash, role, createdAt) VALUES (?,?,?,?,?)")
        .run(email, "Sementara", hash, "ADMIN", new Date().toISOString().replace("Z", "+00:00")),
    );
    await login(page, email, ADMIN_PASSWORD);
    await page.goto("/admin/produk");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kelola Produk");
    tulis((d) => d.prepare("UPDATE User SET role = 'STAFF' WHERE email = ?").run(email));
    await page.goto("/admin/produk");
    expect(page.url()).toContain("/admin?akses=ditolak");
    tulis((d) => d.prepare("DELETE FROM User WHERE email = ?").run(email));
    await page.goto("/admin");
    expect(page.url()).toContain("/admin/login");
  });
});

test.describe("matriks otorisasi: ADMIN vs STAFF", () => {
  const MATRIKS: Array<[string, boolean]> = [
    ["/admin", true],
    ["/admin/stok", true],
    ["/admin/produk", false],
    ["/admin/produk/baru", false],
    ["/admin/kategori", false],
  ];
  test("STAFF: ringkasan & stok boleh; produk/kategori ditolak (dialihkan ke /admin?akses=ditolak); menu hanya yang berhak", async ({
    page,
  }) => {
    await login(page, STAFF_EMAIL, STAFF_PASSWORD);
    await expect(page.getByTestId("info-pengguna")).toContainText("Staf");
    const menu = page.getByRole("navigation", { name: "Menu admin" });
    await expect(menu.getByRole("link", { name: "Stok" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Produk" })).toHaveCount(0);
    await expect(menu.getByRole("link", { name: "Kategori" })).toHaveCount(0);
    for (const [u, boleh] of MATRIKS) {
      await page.goto(u);
      if (boleh) expect(page.url(), u).toContain(u);
      else {
        expect(page.url(), u).toContain("/admin?akses=ditolak");
        await expect(page.getByTestId("akses-ditolak")).toBeVisible();
      }
    }
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(200);
  });

  test("ADMIN: semua halaman boleh", async ({ page }) => {
    await login(page);
    for (const [u] of MATRIKS) {
      const r = await page.goto(u);
      expect(r?.status(), u).toBe(200);
      expect(page.url(), u).toContain(u);
    }
  });

  test("server action berisiko dipanggil STAFF langsung (tanpa UI) ditolak & data tak berubah", async ({
    browser,
  }) => {
    // ADMIN: ambil ID action 'ubahAktif' dari HTML halaman produk.
    const p = buatProduk({ name: `Aksi ${Date.now()}` });
    const a = await (await browser.newContext()).newPage();
    await login(a);
    await a.goto("/admin/produk");
    const html = await a.content();
    const aksi = /name="\$ACTION_ID_([0-9a-f]+)"/.exec(html)?.[1];
    expect(aksi, "ID server action ditemukan di HTML admin").toBeTruthy();
    // STAFF: kirim form dengan ID action itu lewat cookie sesi STAFF.
    const sCtx = await browser.newContext();
    const s = await sCtx.newPage();
    await login(s, STAFF_EMAIL, STAFF_PASSWORD);
    const r = await s.request.post("/admin/produk", {
      multipart: { [`$ACTION_ID_${aksi}`]: "", id: String(p.id) },
      maxRedirects: 0,
    });
    expect(r.status()).not.toBe(200);
    expect(
      query<{ active: number }>("SELECT active FROM Product WHERE id = ?", p.id)[0]!.active,
    ).toBe(1); // tidak diubah
    // kontrol positif: ADMIN dengan permintaan yang sama berhasil mengubah
    const ok = await a.request.post("/admin/produk", {
      multipart: { [`$ACTION_ID_${aksi}`]: "", id: String(p.id) },
      maxRedirects: 0,
    });
    expect(ok.status()).toBeLessThan(400);
    expect(
      query<{ active: number }>("SELECT active FROM Product WHERE id = ?", p.id)[0]!.active,
    ).toBe(0);
  });
});
