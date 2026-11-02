import { expect, test } from "@playwright/test";
import Database from "better-sqlite3";
import { sekolah } from "../content/sekolah";
import { posts } from "../prisma/seed-data";

function query<T>(sql: string): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all() as T[];
  } finally {
    d.close();
  }
}

test("beranda termuat: judul, h1, gambar, bahasa Indonesia", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(`${sekolah.nama} — ${sekolah.tagline}`);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(sekolah.nama);
  const hero = page.locator("main img").first();
  await expect(hero).toHaveAttribute("alt", /placeholder/);
  expect(await hero.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
});

test("berita terbaru dari DB: tiga terbit terbaru, urut menurun, draf tidak tampil", async ({
  page,
}) => {
  await page.goto("/");
  const terbit = posts
    .filter((p) => p.daysAgo !== null)
    .sort((a, b) => a.daysAgo! - b.daysAgo!)
    .slice(0, 3)
    .map((p) => p.title);
  await expect(page.getByTestId("daftar-terbaru").locator("h3")).toHaveText(terbit);
  const draf = posts.find((p) => p.daysAgo === null)!;
  await expect(page.locator("body")).not.toContainText(draf.title);
});

test("seed e2e lengkap & idempotent: jumlah baris sesuai data demo; akun admin dibuat dari env", async () => {
  const n = (t: string) => query<{ c: number }>(`SELECT count(*) c FROM ${t}`)[0]!.c;
  expect(n("Post")).toBe(posts.length);
  expect(query<{ c: number }>("SELECT count(*) c FROM Teacher WHERE active = 1")[0]!.c).toBe(6);
  expect(n("Agenda")).toBe(6);
  expect(n("Gallery")).toBe(3);
  expect(n("GalleryImage")).toBe(7);
  expect(n("DonationProgram")).toBe(3);
  expect(n("Donation")).toBe(7);
  expect(n("Registration")).toBe(0);
  const [admin] = query<{ email: string; role: string; passwordHash: string }>(
    "SELECT email, role, passwordHash FROM User",
  );
  expect(admin).toMatchObject({ email: "admin@sekolah.example", role: "ADMIN" });
  expect(admin!.passwordHash).toMatch(/^\$2[aby]\$12\$/); // bcrypt, bukan teks polos
  expect(admin!.passwordHash).not.toContain("e2e-password");
});

test("404 berbahasa Indonesia dengan tautan kembali", async ({ page }) => {
  const res = await page.goto("/tidak-ada");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Halaman tidak ditemukan");
  await expect(page.getByRole("link", { name: "Kembali ke beranda" })).toHaveAttribute("href", "/");
});

test("header keamanan terpasang", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-powered-by"]).toBeUndefined();
});
