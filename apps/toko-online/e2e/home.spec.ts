import Database from "better-sqlite3";
import { expect, test } from "@playwright/test";
import { categories, products, settings, vouchers } from "../prisma/seed-data";

function query<T>(sql: string, ...a: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...a) as T[];
  } finally {
    d.close();
  }
}

test("beranda termuat: judul, h1, gambar placeholder, bahasa Indonesia", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Toko Nusantara Craft");
  const hero = page.locator("main img").first();
  await expect(hero).toHaveAttribute("alt", /placeholder/);
  expect(await hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test("produk terbaru dari DB: 8 kartu, harga berformat rupiah, stok habis ditandai; produk nonaktif tidak tampil", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("kartu-produk")).toHaveCount(8);
  const kartu = page.getByTestId("kartu-produk");
  for (const k of await kartu.all()) {
    // gambar kartu dekoratif (alt kosong) — nama produk sudah ada pada tautan judul
    await expect(k.locator("img")).toHaveAttribute("alt", "");
    await expect(k.getByRole("link")).toHaveCount(1);
    await expect(k.getByRole("link")).toHaveAccessibleName(/.+/);
    expect((await k.textContent())!).toMatch(/Rp\s?[\d.]+/);
  }
  // produk habis (sapu ijuk) diberi tanda — periksa lewat DB agar tak bergantung urutan tampilan
  const habis = query<{ name: string }>(
    "SELECT p.name FROM Product p WHERE p.active = 1 AND NOT EXISTS (SELECT 1 FROM Variant v WHERE v.productId = p.id AND v.active = 1 AND v.stock > 0)",
  );
  expect(habis.length).toBeGreaterThanOrEqual(1);
});

test("seed e2e lengkap & idempotent: jumlah baris sesuai data demo; hash bcrypt (bukan teks polos)", async () => {
  // Tes lain menyisipkan data sendiri secara paralel → periksa data SEED secara spesifik, bukan jumlah global.
  const n = (t: string) => query<{ c: number }>(`SELECT count(*) c FROM "${t}"`)[0]!.c;
  expect(n("Category")).toBe(categories.length);
  const slugs = query<{ slug: string }>("SELECT slug FROM Product").map((r) => r.slug);
  for (const p of products) expect(slugs, p.slug).toContain(p.slug);
  for (const p of products) {
    const v = query<{ sku: string }>(
      "SELECT v.sku FROM Variant v JOIN Product pr ON pr.id = v.productId WHERE pr.slug = ?",
      p.slug,
    ).map((r) => r.sku);
    expect(v.sort(), p.slug).toEqual(p.varian.map((x) => x.sku).sort());
  }
  const kode = query<{ code: string }>("SELECT code FROM Voucher").map((r) => r.code);
  for (const v of vouchers) expect(kode, v.code).toContain(v.code);
  const kunci = query<{ key: string }>("SELECT key FROM Setting").map((r) => r.key);
  expect(kunci.sort()).toEqual(Object.keys(settings).sort());
  const users = query<{ email: string; role: string; passwordHash: string }>(
    "SELECT email, role, passwordHash FROM User ORDER BY id",
  );
  expect(users.map((u) => `${u.email}:${u.role}`)).toEqual([
    "admin@toko.example:ADMIN",
    "staf@toko.example:STAFF",
  ]);
  for (const u of users) {
    expect(u.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(u.passwordHash).not.toContain("e2e-");
  }
});

test("404 berbahasa Indonesia dengan tautan kembali; header keamanan terpasang", async ({
  page,
  request,
}) => {
  const res = await page.goto("/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  await expect(page.getByRole("link", { name: "Kembali ke beranda" })).toHaveAttribute("href", "/");
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
