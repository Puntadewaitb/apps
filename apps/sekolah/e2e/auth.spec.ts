import { expect, test, type APIRequestContext } from "@playwright/test";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  E2E_SECRET,
  EDITOR_EMAIL,
  EDITOR_PASSWORD,
  awasi,
  dbDate,
  huruf,
  masuk,
  query,
  tulis,
  uniqueIp,
} from "./helpers";

const COOKIE = "next-auth.session-token";

test.describe("akses tanpa login", () => {
  test("/admin dan sub-halamannya dialihkan ke login dengan callbackUrl; API admin → 401 JSON", async ({
    page,
    request,
  }) => {
    for (const p of ["/admin", "/admin/berita", "/admin/berita?halaman=2"]) {
      await page.goto(p);
      await expect(page, p).toHaveURL(/\/admin\/login\?callbackUrl=/);
      expect(new URL(page.url()).searchParams.get("callbackUrl"), p).toBe(p);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("Masuk Admin");
    }
    const r = await request.get("/api/admin/ringkasan");
    expect(r.status()).toBe(401);
    expect(r.headers()["cache-control"]).toContain("no-store");
    expect(await r.json()).toEqual({ error: "Belum login." });
  });

  test("percobaan melewati gerbang (trailing slash, encoding, header CVE-2025-29927) tidak pernah menampilkan dashboard", async ({
    request,
  }) => {
    const sub = "middleware:middleware:middleware:middleware:middleware";
    for (const [path, headers] of [
      ["/admin/", {}],
      ["/admin/%2e", {}],
      ["/admin%2F", {}],
      ["/admin/./", {}],
      ["/admin", { "x-middleware-subrequest": sub }],
      ["/admin", { "x-middleware-subrequest": "src/middleware:src/middleware" }],
      ["/admin", { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy" }],
      ["/api/admin/ringkasan", { "x-middleware-subrequest": sub }],
      ["/api/admin/ringkasan/", {}],
      ["/api/admin/ringkasan?x=/admin/login", {}],
      ["/admin?callbackUrl=/admin/login", { "x-forwarded-host": "evil.example" }],
    ] as const) {
      const r = await request.get(path, { headers, maxRedirects: 0 });
      const body = await r.text();
      expect(body, `${path} ${JSON.stringify(headers)}`).not.toContain("Dashboard Admin");
      expect(body, path).not.toContain('"berita"');
      expect([301, 302, 307, 308, 401, 404], `${path} → ${r.status()}`).toContain(r.status());
    }
  });

  test("halaman login: noindex, no-store, label form; endpoint sesi kosong untuk anonim", async ({
    page,
    request,
  }) => {
    const res = await page.goto("/admin/login");
    expect(res?.headers()["cache-control"]).toContain("no-store");
    expect(res?.headers()["x-robots-tag"]).toContain("noindex");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("form", { name: "Form login admin" })).toBeVisible();
    expect(await (await request.get("/api/auth/session")).json()).toEqual({});
  });
});

test.describe("login & logout", () => {
  test("password salah dan email tak terdaftar menghasilkan pesan IDENTIK; tidak ada cookie sesi", async ({
    page,
  }) => {
    await masuk(page, ADMIN_EMAIL, "password-salah-sekali");
    const a = await page.getByTestId("galat-login").textContent();
    expect(a).toBe("Email atau password salah.");
    await page.getByLabel("Email").fill(`tidakada-${huruf()}@sekolah.example`);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Masuk" }).click();
    await expect(page.getByTestId("galat-login")).toHaveText(a!);
    expect((await page.context().cookies()).find((c) => c.name === COOKIE)).toBeUndefined();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin: login berhasil → dashboard dengan angka dari DB; cookie sesi aman", async ({
    page,
  }) => {
    const p = await awasi(page);
    await masuk(page);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Dashboard Admin");
    await expect(page.getByTestId("info-pengguna")).toContainText("Admin Sekolah · Administrator");

    const terbit = query<{ c: number }>("SELECT count(*) c FROM Post WHERE published = 1")[0]!.c;
    const draf = query<{ c: number }>("SELECT count(*) c FROM Post WHERE published = 0")[0]!.c;
    await expect(page.getByTestId("ringkasan-berita-terbit")).toContainText(String(terbit));
    await expect(page.getByTestId("ringkasan-berita-draf")).toContainText(String(draf));
    // admin melihat semua area
    for (const id of ["agenda", "ppdb", "donasi"])
      await expect(page.getByTestId(`ringkasan-${id}`)).toBeVisible();
    await expect(page.getByTestId("ringkasan-donasi")).toContainText(
      String(
        query<{ c: number }>("SELECT count(*) c FROM Donation WHERE status = 'MENUNGGU'")[0]!.c,
      ),
    );

    const c = (await page.context().cookies()).find((x) => x.name === COOKIE)!;
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe("Strict");
    expect(c.path).toBe("/");
    expect(c.expires - Date.now() / 1000).toBeLessThanOrEqual(8 * 3600 + 60);
    expect(c.expires - Date.now() / 1000).toBeGreaterThan(7 * 3600);
    expect(await page.evaluate(() => document.cookie)).not.toContain("session-token");
    // JWT berisi uid & role saja (tanpa hash password / email)
    expect(c.value).not.toContain(ADMIN_PASSWORD);
    expect(p.masalah, p.masalah.join("\n")).toEqual([]);
  });

  test("halaman admin: no-store + noindex; logout menghapus sesi dan menutup akses lagi", async ({
    page,
    request,
  }) => {
    await masuk(page);
    await expect(page).toHaveURL(/\/admin$/);
    const res = await page.request.get("/admin");
    expect(res.headers()["cache-control"]).toContain("no-store");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(200);

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    expect((await page.context().cookies()).find((x) => x.name === COOKIE)).toBeUndefined();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login\?callbackUrl=/);
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(401);
    void request;
  });

  test("sudah login → /admin/login mengalihkan ke dashboard", async ({ page }) => {
    await masuk(page);
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("callbackUrl internal dipakai; yang berbahaya diabaikan (anti open redirect)", async ({
    page,
  }) => {
    await masuk(page, ADMIN_EMAIL, ADMIN_PASSWORD, "/admin?dari=uji");
    await expect(page).toHaveURL(/\/admin\?dari=uji$/);
    for (const bad of [
      "https://evil.example/admin",
      "//evil.example",
      "/berita",
      "javascript:alert(1)",
    ]) {
      await page.context().clearCookies();
      await masuk(page, ADMIN_EMAIL, ADMIN_PASSWORD, bad);
      await page.waitForURL(/localhost:3004\/admin$/);
      expect(new URL(page.url()).origin, bad).toBe("http://localhost:3004");
    }
  });

  test("editor: hanya area konten (tanpa PPDB/donasi) di dashboard dan di API", async ({
    page,
  }) => {
    await masuk(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId("info-pengguna")).toContainText("Editor");
    await expect(page.getByTestId("ringkasan-berita-terbit")).toBeVisible();
    await expect(page.getByTestId("ringkasan-agenda")).toBeVisible();
    await expect(page.getByTestId("ringkasan-ppdb")).toHaveCount(0);
    await expect(page.getByTestId("ringkasan-donasi")).toHaveCount(0);
    const j = await (await page.request.get("/api/admin/ringkasan")).json();
    expect(Object.keys(j).sort()).toEqual(["agenda", "berita"]);
  });
});

test.describe("kekuatan sesi", () => {
  const tanamkan = async (page: import("@playwright/test").Page, value: string) =>
    page
      .context()
      .addCookies([
        { name: COOKIE, value, url: "http://localhost:3004", httpOnly: true, sameSite: "Strict" },
      ]);
  const tolak = async (page: import("@playwright/test").Page, label: string) => {
    await page.goto("/admin");
    await expect(page, label).toHaveURL(/\/admin\/login/);
    expect((await page.request.get("/api/admin/ringkasan")).status(), label).toBe(401);
  };

  test("cookie sembarang / rusak ditolak", async ({ page }) => {
    for (const v of ["garbage", "a.b.c", "x".repeat(500), ""]) {
      await page.context().clearCookies();
      await tanamkan(page, v || "x");
      await tolak(page, `cookie "${v.slice(0, 10)}"`);
    }
  });

  test("JWT yang ditandatangani rahasia LAIN ditolak", async ({ page }) => {
    const jwt = await encode({
      token: { uid: 1, role: "ADMIN", sub: "1" },
      secret: "rahasia-penyerang-0123456789abcdef-xyz-abc",
    });
    await tanamkan(page, jwt);
    await tolak(page, "secret salah");
  });

  test("JWT valid secara kriptografis tetapi akunnya tidak ada di DB → ditolak oleh pemeriksaan ulang server", async ({
    page,
  }) => {
    const jwt = await encode({
      token: { uid: 987654, role: "ADMIN", sub: "987654" },
      secret: E2E_SECRET,
    });
    await tanamkan(page, jwt);
    await tolak(page, "uid fiktif");
  });

  test("JWT valid dengan klaim role ADMIN, tetapi di DB akunnya EDITOR → hak mengikuti DB, bukan klaim token", async ({
    page,
  }) => {
    const e = query<{ id: number }>("SELECT id FROM User WHERE email = ?", EDITOR_EMAIL)[0]!;
    const jwt = await encode({
      token: { uid: e.id, role: "ADMIN", sub: String(e.id) },
      secret: E2E_SECRET,
    });
    await tanamkan(page, jwt);
    await page.goto("/admin");
    await expect(page.getByTestId("info-pengguna")).toContainText("Editor");
    await expect(page.getByTestId("ringkasan-ppdb")).toHaveCount(0);
    const j = await (await page.request.get("/api/admin/ringkasan")).json();
    expect(Object.keys(j).sort()).toEqual(["agenda", "berita"]);
  });

  test("akun dihapus setelah login → akses langsung hilang (tanpa menunggu JWT kedaluwarsa)", async ({
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
    await masuk(page, email, "password-uji-123456");
    await expect(page).toHaveURL(/\/admin$/);
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(200);
    tulis((d) => d.prepare("DELETE FROM User WHERE email = ?").run(email));
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(401);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("peran diturunkan menjadi tak dikenal setelah login → ditolak", async ({ page }) => {
    const email = `uji-${huruf()}@sekolah.example`;
    const hash = await bcrypt.hash("password-uji-123456", 4);
    tulis((d) =>
      d
        .prepare(
          "INSERT INTO User (email, name, passwordHash, role, createdAt) VALUES (?, 'Sementara', ?, 'EDITOR', ?)",
        )
        .run(email, hash, dbDate(Date.now())),
    );
    await masuk(page, email, "password-uji-123456");
    await expect(page).toHaveURL(/\/admin$/);
    tulis((d) => d.prepare("UPDATE User SET role = 'SUSPEND' WHERE email = ?").run(email));
    expect((await page.request.get("/api/admin/ringkasan")).status()).toBe(401);
    tulis((d) => d.prepare("DELETE FROM User WHERE email = ?").run(email));
  });
});

test.describe("rate limit & CSRF", () => {
  async function coba(
    request: APIRequestContext,
    ip: string,
    email: string,
    password: string,
    csrf?: string,
  ) {
    const token =
      csrf ??
      (
        (await (
          await request.get("/api/auth/csrf", { headers: { "x-forwarded-for": ip } })
        ).json()) as { csrfToken: string }
      ).csrfToken;
    const r = await request.post("/api/auth/callback/credentials", {
      headers: { "x-forwarded-for": ip },
      form: { csrfToken: token, email, password, json: "true" },
    });
    return (await r.json()) as { url?: string };
  }

  test("lebih dari 10 percobaan/15 menit dari satu IP → RATE_LIMIT, termasuk bila password benar", async ({
    playwright,
  }) => {
    const request = await playwright.request.newContext({ baseURL: "http://localhost:3004" });
    const ip = uniqueIp();
    try {
      for (let i = 0; i < 10; i++) {
        const j = await coba(request, ip, `acak-${i}-${huruf()}@sekolah.example`, "salah");
        expect(j.url, `percobaan ${i + 1}`).toContain("error=KREDENSIAL");
      }
      const j = await coba(request, ip, ADMIN_EMAIL, ADMIN_PASSWORD);
      expect(j.url).toContain("error=RATE_LIMIT");
      expect(
        (await request.get("/api/auth/session", { headers: { "x-forwarded-for": ip } })).ok(),
      ).toBe(true);
      expect(
        await (
          await request.get("/api/auth/session", { headers: { "x-forwarded-for": ip } })
        ).json(),
      ).toEqual({});
      // IP lain tidak terdampak
      const lain = await coba(request, uniqueIp(), ADMIN_EMAIL, ADMIN_PASSWORD);
      expect(lain.url ?? "").not.toContain("error=");
    } finally {
      await request.dispose();
    }
  });

  test("UI menampilkan pesan rate limit", async ({ page }) => {
    const ip = uniqueIp();
    await page.setExtraHTTPHeaders({ "x-forwarded-for": ip });
    await page.goto("/admin/login");
    for (let i = 0; i < 11; i++) {
      await page.getByLabel("Email").fill(`ui-${i}-${huruf()}@sekolah.example`);
      await page.getByLabel("Password").fill("salah");
      await page.getByRole("button", { name: "Masuk" }).click();
      await expect(page.getByTestId("galat-login")).toBeVisible();
      if (i < 10)
        await expect(page.getByTestId("galat-login")).toHaveText("Email atau password salah.");
    }
    await expect(page.getByTestId("galat-login")).toHaveText(
      "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    );
  });

  test("login tanpa token CSRF yang benar ditolak", async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: "http://localhost:3004" });
    try {
      for (const csrf of ["", "token-palsu"]) {
        const r = await request.post("/api/auth/callback/credentials", {
          headers: { "x-forwarded-for": uniqueIp() },
          form: { csrfToken: csrf, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, json: "true" },
        });
        const j = (await r.json()) as { url?: string };
        expect(j.url ?? "", `csrf="${csrf}"`).toContain("csrf=true");
        expect((await request.get("/api/auth/session")).status()).toBe(200);
        expect(await (await request.get("/api/auth/session")).json()).toEqual({});
      }
    } finally {
      await request.dispose();
    }
  });
});
