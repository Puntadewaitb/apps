import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const uniqueIp = () => {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
};
const tag = (p = "t") => `${p}${randomBytes(4).toString("hex")}`;
/** Nama orang hanya boleh huruf: tag acak berupa huruf a–p. */
const huruf = () => [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 16))).join("");

function q<T>(sql: string, ...args: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...args) as T[];
  } finally {
    d.close();
  }
}

const post = (
  r: APIRequestContext,
  path: string,
  data: unknown,
  headers: Record<string, string> = {},
) => r.post(path, { data, headers: { "x-forwarded-for": uniqueIp(), ...headers } });

async function buka(page: Page, url = "/") {
  await page.route("https://www.google.com/**", (r) => r.abort());
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto(url);
  await page.getByRole("button", { name: "Buka Undangan" }).click();
}

test.describe("RSVP (UI)", () => {
  test("hadir dengan jumlah orang: tersimpan di DB & pesan sukses", async ({ page }) => {
    const nama = `Tamu ${huruf()}`;
    await buka(page);
    const form = page.getByRole("form", { name: "Form RSVP" });
    await form.getByLabel("Nama").fill(nama);
    await form.getByLabel("Hadir", { exact: true }).check();
    await form.getByLabel("Jumlah orang yang hadir").selectOption("3");
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("rsvp-sukses")).toContainText("3 orang");
    const rows = q<{ status: string; pax: number; guestId: number | null }>(
      "SELECT status, pax, guestId FROM Rsvp WHERE name = ?",
      nama,
    );
    expect(rows).toEqual([{ status: "HADIR", pax: 3, guestId: null }]);
  });

  test("tidak hadir: jumlah orang disembunyikan & tersimpan 0", async ({ page }) => {
    const nama = `Tamu ${huruf()}`;
    await buka(page);
    const form = page.getByRole("form", { name: "Form RSVP" });
    await form.getByLabel("Nama").fill(nama);
    await form.getByLabel("Tidak hadir").check();
    await expect(form.getByLabel("Jumlah orang yang hadir")).toHaveCount(0);
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("rsvp-sukses")).toContainText("Doa terbaik");
    expect(q("SELECT status, pax FROM Rsvp WHERE name = ?", nama)).toEqual([
      { status: "TIDAK_HADIR", pax: 0 },
    ]);
  });

  test("nama invalid ditolak dengan pesan jelas & tidak tersimpan", async ({ page }) => {
    await buka(page);
    const form = page.getByRole("form", { name: "Form RSVP" });
    await form.getByLabel("Nama").fill("A");
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(form.getByText("Nama minimal 2 karakter")).toBeVisible();
    await expect(page.getByTestId("rsvp-sukses")).toHaveCount(0);
  });

  test("tautan pribadi ?kode=: nama terisi, batas orang sesuai tamu, RSVP diperbarui (tidak ganda)", async ({
    page,
  }) => {
    await buka(page, "/?kode=demo-0003"); // Sahabat Kampus, maxPax 1 (huruf kecil → dinormalkan)
    await expect(page.getByTestId("nama-tamu")).toHaveText("Sahabat Kampus"); // cover (setelah dibuka tetap di DOM)
    const form = page.getByRole("form", { name: "Form RSVP" });
    await expect(form.getByLabel("Nama")).toHaveValue("Sahabat Kampus");
    await expect(form.getByLabel("Jumlah orang yang hadir").locator("option")).toHaveCount(1);

    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("rsvp-sukses")).toContainText("1 orang");
    await page.getByRole("button", { name: "Ubah konfirmasi" }).click();
    await form.getByLabel("Tidak hadir").check();
    await form.getByRole("button", { name: "Kirim Konfirmasi" }).click();
    await expect(page.getByTestId("rsvp-sukses")).toContainText("diperbarui");

    const rows = q<{ status: string; pax: number }>(
      "SELECT r.status, r.pax FROM Rsvp r JOIN Guest g ON g.id = r.guestId WHERE g.code = 'DEMO-0003'",
    );
    expect(rows).toEqual([{ status: "TIDAK_HADIR", pax: 0 }]);
  });
});

test.describe("API /api/rsvp", () => {
  test("pax dibatasi maxPax tamu; tamu umum maksimal 5", async ({ request }) => {
    const r1 = await post(request, "/api/rsvp", {
      name: `Umum ${huruf()}`,
      status: "HADIR",
      pax: 40,
    });
    expect(r1.status()).toBe(201);
    expect((await r1.json()).pax).toBe(5);
    // DEMO-0002 maxPax 2
    const r2 = await post(request, "/api/rsvp", {
      name: "Ibu Dewi Lestari",
      status: "HADIR",
      pax: 9,
      kode: "DEMO-0002",
    });
    expect([200, 201]).toContain(r2.status());
    expect((await r2.json()).pax).toBe(2);
  });

  test("kode tidak dikenal → 400; format salah → 400", async ({ request }) => {
    const a = await post(request, "/api/rsvp", {
      name: "Budi",
      status: "HADIR",
      kode: "TIDAK-ADA",
    });
    expect(a.status()).toBe(400);
    expect((await a.json()).errors.kode).toMatch(/tidak ditemukan/);
    const b = await post(request, "/api/rsvp", {
      name: "Budi",
      status: "HADIR",
      kode: "x'; DROP TABLE",
    });
    expect(b.status()).toBe(400);
  });

  test("status/pax invalid → 400 dengan pesan per field", async ({ request }) => {
    const r = await post(request, "/api/rsvp", { name: "Budi", status: "MUNGKIN", pax: "banyak" });
    expect(r.status()).toBe(400);
    const body = await r.json();
    expect(Object.keys(body.errors).sort()).toEqual(["pax", "status"]);
  });

  test("honeypot, content-type, JSON rusak, body besar, origin asing", async ({ request }) => {
    const nama = `Bot ${huruf()}`;
    const bot = await post(request, "/api/rsvp", {
      name: nama,
      status: "HADIR",
      website_url: "http://spam",
    });
    expect(bot.status()).toBe(200);
    expect(q("SELECT 1 FROM Rsvp WHERE name = ?", nama)).toHaveLength(0);

    const ip = { "x-forwarded-for": uniqueIp() };
    expect((await request.post("/api/rsvp", { headers: ip, form: { name: "x" } })).status()).toBe(
      415,
    );
    expect(
      (
        await request.post("/api/rsvp", {
          headers: { ...ip, "content-type": "application/json" },
          data: "{rusak",
        })
      ).status(),
    ).toBe(400);
    expect((await post(request, "/api/rsvp", { name: "x".repeat(6000) })).status()).toBe(413);
    expect(
      (
        await post(
          request,
          "/api/rsvp",
          { name: "Budi", status: "HADIR" },
          { origin: "http://evil.example" },
        )
      ).status(),
    ).toBe(403);
  });

  test("rate limit: ke-6 dari IP sama → 429 + Retry-After", async ({ request }) => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) {
      expect((await post(request, "/api/rsvp", {}, { "x-forwarded-for": ip })).status()).toBe(400);
    }
    const blocked = await post(request, "/api/rsvp", {}, { "x-forwarded-for": ip });
    expect(blocked.status()).toBe(429);
    expect(Number(blocked.headers()["retry-after"])).toBeGreaterThan(0);
  });
});

test.describe("ucapan & doa", () => {
  test("kirim ucapan: langsung tampil di daftar & tersimpan tersanitasi", async ({ page }) => {
    const t = tag("u");
    await buka(page);
    const form = page.getByRole("form", { name: "Form ucapan" });
    await form.getByLabel("Nama").fill("Dewi Sahabat");
    await form.getByLabel("Ucapan & doa").fill(`Selamat <b>ya</b> ${t}`);
    await form.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(page.getByText("Ucapan Anda telah tampil")).toBeVisible();
    const item = page.getByTestId("daftar-ucapan").locator("li", { hasText: t });
    await expect(item).toContainText(`Selamat ya ${t}`);
    await expect(item).toContainText("Dewi Sahabat");
    expect(await item.innerHTML()).not.toContain("<b>");
    expect(
      q<{ visible: number }>("SELECT visible FROM Wish WHERE message LIKE ?", `%${t}%`),
    ).toEqual([{ visible: 1 }]);
  });

  test("ucapan berisi tautan: disimpan tapi disembunyikan (moderasi)", async ({
    page,
    request,
  }) => {
    const t = tag("s");
    await buka(page);
    const form = page.getByRole("form", { name: "Form ucapan" });
    await form.getByLabel("Nama").fill("Promotor");
    await form.getByLabel("Ucapan & doa").fill(`Kunjungi https://judi.example ${t}`);
    await form.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(page.getByText("akan tampil setelah ditinjau")).toBeVisible();
    await expect(page.getByTestId("daftar-ucapan").getByText(t)).toHaveCount(0);
    expect(
      q<{ visible: number }>("SELECT visible FROM Wish WHERE message LIKE ?", `%${t}%`),
    ).toEqual([{ visible: 0 }]);
    // dan tidak muncul di API publik
    const list = await (
      await request.get("/api/ucapan", { headers: { "x-forwarded-for": uniqueIp() } })
    ).json();
    expect(JSON.stringify(list)).not.toContain(t);
  });

  test("validasi: pesan terlalu pendek ditolak dengan pesan jelas", async ({ page }) => {
    await buka(page);
    const form = page.getByRole("form", { name: "Form ucapan" });
    await form.getByLabel("Nama").fill("Dewi");
    await form.getByLabel("Ucapan & doa").fill("ok");
    await form.getByRole("button", { name: "Kirim Ucapan" }).click();
    await expect(form.getByText("Pesan minimal 3 karakter")).toBeVisible();
  });

  test("auto-refresh: ucapan baru dari orang lain muncul tanpa muat ulang (jam dikunci)", async ({
    page,
    request,
  }) => {
    const t = tag("a");
    await page.clock.install({ time: new Date("2027-02-10T10:00:00+07:00") });
    await buka(page);
    await expect(page.getByTestId("daftar-ucapan").getByText(t)).toHaveCount(0);
    const res = await post(request, "/api/ucapan", {
      name: "Orang Lain",
      message: `Doa dari jauh ${t}`,
    });
    expect(res.status()).toBe(201);
    await page.clock.fastForward(16_000);
    await expect(page.getByTestId("daftar-ucapan").getByText(`Doa dari jauh ${t}`)).toBeVisible();
  });

  test("GET /api/ucapan: terbaru dulu, paginasi cursor, cursor invalid → 400", async ({
    request,
  }) => {
    const ip = { "x-forwarded-for": uniqueIp() };
    const first = await (await request.get("/api/ucapan", { headers: ip })).json();
    expect(first.ok).toBe(true);
    const ids = first.items.map((i: { id: number }) => i.id);
    expect(ids).toEqual([...ids].sort((a: number, b: number) => b - a));
    expect(first.items.length).toBeLessThanOrEqual(20);
    if (ids.length) {
      const next = await (
        await request.get(`/api/ucapan?cursor=${ids[ids.length - 1]}`, { headers: ip })
      ).json();
      for (const i of next.items) expect(i.id).toBeLessThan(ids[ids.length - 1]);
    }
    expect((await request.get("/api/ucapan?cursor=abc", { headers: ip })).status()).toBe(400);
    expect((await request.get("/api/ucapan?cursor=1;DROP", { headers: ip })).status()).toBe(400);
  });

  test("rate limit ucapan: ke-6 dari IP sama → 429", async ({ request }) => {
    const ip = uniqueIp();
    for (let i = 0; i < 5; i++) {
      expect((await post(request, "/api/ucapan", {}, { "x-forwarded-for": ip })).status()).toBe(
        400,
      );
    }
    expect((await post(request, "/api/ucapan", {}, { "x-forwarded-for": ip })).status()).toBe(429);
  });

  test("paginasi UI: >20 ucapan menampilkan tombol 'Muat ucapan lainnya'", async ({
    page,
    request,
  }) => {
    const base = tag("p");
    for (let i = 0; i < 22; i++) {
      const r = await post(request, "/api/ucapan", {
        name: "Pengirim",
        message: `Ucapan massal ${base} nomor ${i}`,
      });
      expect(r.status()).toBe(201);
    }
    await buka(page);
    await expect(page.getByTestId("daftar-ucapan").locator("li")).toHaveCount(20);
    await page.getByRole("button", { name: "Muat ucapan lainnya" }).click();
    await expect
      .poll(() => page.getByTestId("daftar-ucapan").locator("li").count())
      .toBeGreaterThan(20);
  });
});

test("halaman dengan form tidak overflow horizontal di 360/768/1280", async ({ page }) => {
  await page.route("https://www.google.com/**", (r) => r.abort());
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/?to=Bapak%20Budi%20Santoso%20dan%20Keluarga%20Besar");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(over, `overflow di ${width}px`).toBe(false);
  }
});
