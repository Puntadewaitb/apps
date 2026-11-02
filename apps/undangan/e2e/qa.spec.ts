import { expect, test, type Page } from "@playwright/test";
import { huruf, loginAdmin, query, tag, tulis, uniqueIp } from "./helpers";

// Semua tes QA berjalan pada viewport ponsel.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

const XSS_IMG = `<img src=x onerror="window.__xss=(window.__xss||0)+1">`;
const XSS_SCRIPT = `<script>window.__xss=(window.__xss||0)+1</script>`;

async function awasi(page: Page) {
  const masalah: string[] = [];
  page.on("console", (m) => {
    const t = m.text();
    if (m.type() === "error" || /Refused to|Content Security Policy/i.test(t))
      masalah.push(`[${m.type()}] ${t}`);
  });
  page.on("pageerror", (e) => masalah.push(`[pageerror] ${e}`));
  // Maps tidak dimuat dari internet saat tes — permintaan yang sengaja diblok tidak dihitung masalah.
  await page.route("https://www.google.com/**", (r) => r.abort());
  return masalah;
}
const xssJalan = (page: Page) =>
  page.evaluate(() => (window as unknown as { __xss?: number }).__xss ?? 0);

test("alur tamu lengkap di ponsel: buka → baca → RSVP → ucapan, tanpa error konsol/CSP", async ({
  page,
}) => {
  const masalah = await awasi(page);
  const nama = `Tamu ${huruf()}`;
  const doa = `Selamat berbahagia ${tag("q")}`;
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });

  await page.goto("/?to=Bapak%20Budi%20%26%20Keluarga");
  await expect(page.getByTestId("nama-tamu")).toHaveText("Bapak Budi & Keluarga");
  await page.getByRole("button", { name: "Buka Undangan" }).click();
  await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toBeHidden();

  // gulir ke setiap bagian utama (memicu lazy-load) — semuanya harus ada
  for (const id of ["mempelai", "acara", "cerita", "galeri", "amplop", "rsvp", "ucapan"]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await expect(page.locator(`#${id}`), id).toBeVisible();
  }

  // RSVP
  const rsvp = page.getByRole("form", { name: "Form RSVP" });
  await rsvp.getByLabel("Nama").fill(nama);
  await rsvp.getByLabel("Jumlah orang yang hadir").selectOption("2");
  await rsvp.getByRole("button", { name: "Kirim Konfirmasi" }).click();
  await expect(page.getByTestId("rsvp-sukses")).toContainText("2 orang");
  expect(query("SELECT pax FROM Rsvp WHERE name = ?", nama)).toEqual([{ pax: 2 }]);

  // Ucapan
  const form = page.getByRole("form", { name: "Form ucapan" });
  await form.getByLabel("Nama").fill(nama);
  await form.getByLabel("Ucapan & doa").fill(doa);
  await form.getByRole("button", { name: "Kirim Ucapan" }).click();
  await expect(page.getByTestId("daftar-ucapan").getByText(doa)).toBeVisible();

  // Lightbox di layar sentuh
  await page.locator("#galeri ul button").first().tap();
  await expect(page.getByRole("dialog", { name: "Pratinjau gambar" })).toBeVisible();
  await page.getByRole("button", { name: "Tutup" }).tap();

  expect(await xssJalan(page)).toBe(0);
  expect(masalah, masalah.join("\n")).toEqual([]);
  const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(over).toBe(false);
});

test.describe("XSS: payload tidak pernah tereksekusi", () => {
  test("?to= (query)", async ({ page }) => {
    await awasi(page);
    const payload = encodeURIComponent(`${XSS_IMG}${XSS_SCRIPT}"><svg onload=window.__xss=1>Ani`);
    await page.goto(`/?to=${payload}`);
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    await page.waitForTimeout(300);
    expect(await xssJalan(page)).toBe(0);
    expect(await page.locator("#cover img, #cover script, #cover svg").count()).toBe(0);
    await expect(page.getByTestId("nama-tamu")).toContainText("Ani");
  });

  test("ucapan: tag dibuang saat simpan; entitas HTML tampil sebagai teks", async ({
    page,
    request,
  }) => {
    await awasi(page);
    const t = tag("x");
    const res = await request.post("/api/ucapan", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: {
        name: "Penulis",
        message: `${XSS_IMG}${XSS_SCRIPT} aman ${t} &lt;b&gt;tebal&lt;/b&gt; javascript:alert(1)`,
      },
    });
    expect(res.status()).toBe(201);
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const item = page.getByTestId("daftar-ucapan").locator("li", { hasText: t });
    await expect(item).toContainText("&lt;b&gt;tebal&lt;/b&gt;"); // literal, bukan <b>
    await expect(item).toContainText("javascript:alert(1)"); // teks biasa, bukan tautan
    expect(await item.locator("b, img, script, a").count()).toBe(0);
    expect(await xssJalan(page)).toBe(0);
  });

  test("nama pengirim berisi tag ditolak oleh validasi", async ({ request }) => {
    const res = await request.post("/api/ucapan", {
      headers: { "x-forwarded-for": uniqueIp() },
      data: { name: `<img src=x onerror=alert(1)>`, message: "Pesan biasa saja" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).errors.name).toBeTruthy();
  });

  test("pertahanan berlapis: data 'kotor' langsung di DB tetap di-escape di halaman publik & admin", async ({
    page,
  }) => {
    const t = huruf();
    const kotor = `${XSS_IMG}${XSS_SCRIPT}`;
    tulis((d) => {
      const ev = d.prepare("SELECT id FROM Event WHERE slug = 'raka-anisa'").get() as {
        id: number;
      };
      d.prepare(
        "INSERT INTO Wish (eventId, name, message, visible, createdAt) VALUES (?, ?, ?, 1, ?)",
      ).run(ev.id, `${kotor}Nama${t}`, `${kotor} pesan ${t}`, new Date().toISOString());
      d.prepare(
        "INSERT INTO Guest (eventId, name, code, maxPax, phone, createdAt) VALUES (?, ?, ?, 2, '', ?)",
      ).run(ev.id, `${kotor}Tamu${t}`, `KTR-${t.toUpperCase()}`, new Date().toISOString());
      d.prepare(
        "INSERT INTO Rsvp (eventId, name, status, pax, createdAt) VALUES (?, ?, 'HADIR', 1, ?)",
      ).run(ev.id, `${kotor}Rsvp${t}`, new Date().toISOString());
    });

    await awasi(page);
    // publik: daftar ucapan
    await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const item = page.getByTestId("daftar-ucapan").locator("li", { hasText: t }).first();
    await expect(item).toContainText("<img src=x onerror="); // tampil sebagai teks literal
    expect(await item.locator("img, script").count()).toBe(0);
    expect(await xssJalan(page)).toBe(0);

    // tautan tamu bernama kotor
    await page.goto(`/?kode=KTR-${t.toUpperCase()}`);
    await page.waitForTimeout(200);
    expect(await xssJalan(page)).toBe(0);
    expect(await page.locator("#cover img, #cover script").count()).toBe(0);

    // admin: tamu, RSVP, ucapan
    await loginAdmin(page);
    for (const h of ["/admin/tamu", "/admin/rsvp", "/admin/ucapan"]) {
      await page.goto(h);
      await expect(page.locator("main")).toContainText(t);
      expect(await page.locator("main img, main script").count(), h).toBe(0);
      expect(await xssJalan(page), h).toBe(0);
    }
  });
});

test.describe("QA umum", () => {
  test("404 berbahasa Indonesia & tanpa kebocoran informasi server", async ({ page, request }) => {
    const res = await page.goto("/tidak-ada");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Undangan tidak ditemukan");
    await expect(page.locator("body")).not.toContainText(/could not be found|stack|prisma|sqlite/i);
    const h = (await request.get("/")).headers();
    expect(h["x-powered-by"]).toBeUndefined();
    expect(h["server"] ?? "").not.toMatch(/\d+\.\d+/);
  });

  test("aksesibilitas dasar: bahasa, satu h1, landmark, alt, label input, fokus keyboard", async ({
    page,
  }) => {
    await awasi(page);
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    for (const img of await page.locator("img").all()) {
      expect(
        (await img.getAttribute("alt"))?.trim(),
        String(await img.getAttribute("src")),
      ).toBeTruthy();
    }
    const tanpaLabel = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLInputElement>("input, textarea, select")]
        .filter((el) => el.offsetParent !== null && el.type !== "hidden")
        .filter((el) => !(el.labels && el.labels.length > 0) && !el.getAttribute("aria-label"))
        .map((el) => el.name),
    );
    expect(tanpaLabel).toEqual([]);
    // tombol & tautan yang terlihat punya nama aksesibel
    const tanpaNama = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("button, a[href]")]
        .filter((el) => el.offsetParent !== null)
        .filter((el) => !(el.textContent?.trim() || el.getAttribute("aria-label")))
        .map((el) => el.outerHTML.slice(0, 80)),
    );
    expect(tanpaNama).toEqual([]);
  });

  test("tautan: anchor internal valid, tautan eksternal memakai rel aman", async ({ page }) => {
    await awasi(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    const eksternal = await page
      .locator('a[target="_blank"]')
      .evaluateAll((els) => els.map((e) => e.getAttribute("rel") ?? ""));
    expect(eksternal.length).toBeGreaterThan(0);
    for (const rel of eksternal) expect(rel).toMatch(/noopener/);
    const anchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((els) => [...new Set(els.map((e) => e.getAttribute("href")!))]);
    for (const h of anchors) if (h !== "#") await expect(page.locator(h), h).toHaveCount(1);
  });

  test("keyboard: Tab dari awal menjangkau tombol Buka Undangan; Enter membuka", async ({
    page,
  }) => {
    await awasi(page);
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Buka Undangan" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: "Sampul undangan" })).toBeHidden();
    await expect(page.locator("#isi")).toBeFocused();
  });

  test("ukuran sentuh: tombol utama ≥ 40px tingginya", async ({ page }) => {
    await awasi(page);
    await page.goto("/");
    const box = await page.getByRole("button", { name: "Buka Undangan" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(40);
    await page.getByRole("button", { name: "Buka Undangan" }).click();
    for (const nama of ["Kirim Konfirmasi", "Kirim Ucapan"]) {
      const b = await page.getByRole("button", { name: nama }).boundingBox();
      expect(b!.height, nama).toBeGreaterThanOrEqual(40);
    }
  });
});
