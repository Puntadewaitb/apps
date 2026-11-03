import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";

export const tag = (p = "t") => `${p}${randomBytes(4).toString("hex")}`;
/** Huruf saja (a–p) — aman dipakai sebagai bagian slug/nama agar unik antar tes paralel. */
export const huruf = () =>
  [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 16))).join("");

/** Format DateTime yang dipakai Prisma + SQLite (teks ISO "…+00:00"). */
export const dbDate = (d: Date | number) => new Date(d).toISOString().replace("Z", "+00:00");

export function query<T>(sql: string, ...args: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...args) as T[];
  } finally {
    d.close();
  }
}

/** Tulis langsung ke DB e2e (menyisipkan data nonaktif/"kotor" untuk uji pertahanan berlapis). */
export function tulis<T = void>(fn: (db: Database.Database) => T): T {
  const d = new Database("e2e.db", { fileMustExist: true });
  try {
    return fn(d);
  } finally {
    d.close();
  }
}

export type ProdukUji = {
  slug?: string;
  name?: string;
  description?: string;
  price?: number;
  image?: string;
  images?: string;
  active?: boolean;
  kategoriSlug?: string;
  varian?: Array<{ name: string; price?: number | null; stock: number; active?: boolean }>;
};

/** Sisipkan produk (+ varian) langsung ke DB. Mengembalikan slug/nama/id. */
export function buatProduk(o: ProdukUji = {}) {
  const t = huruf();
  const slug = o.slug ?? `uji-${t}`;
  const name = o.name ?? `Produk Uji ${t}`;
  return tulis((d) => {
    const kat = d
      .prepare("SELECT id FROM Category WHERE slug = ?")
      .get(o.kategoriSlug ?? "kopi-teh") as { id: number };
    const now = dbDate(Date.now());
    const r = d
      .prepare(
        "INSERT INTO Product (slug, name, description, categoryId, price, image, images, active, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        slug,
        name,
        o.description ?? "Deskripsi uji.",
        kat.id,
        o.price ?? 50000,
        o.image ?? "/img/produk-1.svg",
        o.images ?? "[]",
        o.active === false ? 0 : 1,
        now,
        now,
      );
    const id = Number(r.lastInsertRowid);
    const varian = o.varian ?? [{ name: "Standar", stock: 5 }];
    varian.forEach((v, i) =>
      d
        .prepare(
          "INSERT INTO Variant (productId, name, sku, price, stock, active) VALUES (?,?,?,?,?,?)",
        )
        .run(
          id,
          v.name,
          `UJI-${t}-${i}`.toUpperCase(),
          v.price ?? null,
          v.stock,
          v.active === false ? 0 : 1,
        ),
    );
    return { id, slug, name };
  });
}

/** Awasi error konsol/JS, pelanggaran CSP, respons ≥400 aset same-origin, dan permintaan ke origin luar. */
export async function awasi(page: Page, base = "http://localhost:3005") {
  const p = { masalah: [] as string[], luar: [] as string[], gagal: [] as string[] };
  page.on("console", (m) => {
    const t = m.text();
    if (/Failed to load resource/.test(t)) return;
    if (m.type() === "error" || /Refused to|Content Security Policy/i.test(t))
      p.masalah.push(`[${m.type()}] ${t}`);
  });
  page.on("pageerror", (e) => p.masalah.push(`[pageerror] ${e}`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== base && u.protocol.startsWith("http")) p.luar.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400 && r.request().resourceType() !== "document")
      p.gagal.push(`${r.status()} ${r.url()}`);
  });
  return p;
}

/** Angka rupiah dari teks "Rp 85.000" → 85000. */
export const angka = (t: string) => Number((t.match(/[\d.]+/)?.[0] ?? "").replace(/\./g, ""));

/** IP unik per tes (dipakai lewat X-Forwarded-For) agar rate limit antar tes paralel tidak saling mengganggu. */
export const uniqueIp = () => {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
};

/** ID varian (urutan id) milik produk dengan slug tertentu. */
export const varianIds = (slug: string) =>
  query<{ id: number }>(
    "SELECT v.id FROM Variant v JOIN Product p ON p.id = v.productId WHERE p.slug = ? ORDER BY v.id",
    slug,
  ).map((r) => r.id);

export const kunciBaru = () => randomBytes(16).toString("hex");
/** Nomor HP seluler acak (08 + 10 digit) — unik per tes agar batas per-nomor tidak saling mengganggu. */
export const teleponAcak = () =>
  `08${[...randomBytes(5)].map((b) => String(b % 100).padStart(2, "0")).join("")}`;
export const idVarian = (produkId: number) =>
  tulis((d) =>
    (
      d.prepare("SELECT id FROM Variant WHERE productId = ? ORDER BY id").all(produkId) as {
        id: number;
      }[]
    ).map((r) => r.id),
  );
export const ambilOrder = (kode: string) =>
  query<
    Record<string, unknown> & {
      id: number;
      total: number;
      subtotal: number;
      shippingCost: number;
      discount: number;
    }
  >('SELECT * FROM "Order" WHERE code = ?', kode)[0];
export const stokVarian = (id: number) =>
  query<{ stock: number }>("SELECT stock FROM Variant WHERE id = ?", id)[0]!.stock;
export const jumlahOrder = () => query<{ c: number }>('SELECT count(*) c FROM "Order"')[0]!.c;

const ALFABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const kodeAcak = () =>
  `TKO-${[...randomBytes(8)].map((b) => ALFABET[b % ALFABET.length]).join("")}`;

/** Sisipkan pesanan langsung ke DB (status/HP/isi bebas) — untuk menguji lacak, bukti bayar, dan admin tanpa lewat checkout. */
export function buatOrder(
  o: {
    status?: string;
    telepon?: string;
    nama?: string;
    kota?: string;
    proof?: string;
    adminNote?: string;
    kode?: string;
    total?: number;
  } = {},
) {
  const kode = o.kode ?? kodeAcak();
  const telepon =
    o.telepon ??
    `628${[...randomBytes(5)].map((b) => String(b % 10)).join("")}${[...randomBytes(2)].map((b) => String(b % 10)).join("")}`;
  const now = dbDate(Date.now());
  const total = o.total ?? 60_000;
  const id = tulis((d) => {
    const r = d
      .prepare(
        'INSERT INTO "Order" (code, status, customerName, customerPhone, customerEmail, address, city, note, subtotal, shippingCost, discount, total, voucherCode, paymentProof, adminNote, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      )
      .run(
        kode,
        o.status ?? "MENUNGGU_BAYAR",
        o.nama ?? "Pembeli Uji",
        telepon,
        "rahasia@contoh.test",
        "Jl. Rahasia No. 99, Sleman",
        o.kota ?? "Sleman",
        "catatan-pribadi",
        total - 10_000,
        10_000,
        0,
        total,
        "",
        o.proof ?? "",
        o.adminNote ?? "",
        now,
        now,
      );
    const oid = Number(r.lastInsertRowid);
    d.prepare(
      "INSERT INTO OrderItem (orderId, productName, variantName, unitPrice, qty, lineTotal) VALUES (?,?,?,?,?,?)",
    ).run(oid, "Kopi Uji", "Standar", 25_000, 2, 50_000);
    return oid;
  });
  return { id, kode, telepon };
}

export const ADMIN_EMAIL = "admin@toko.example";
export const ADMIN_PASSWORD = "e2e-password-bukan-rahasia";
export const STAFF_EMAIL = "staf@toko.example";
export const STAFF_PASSWORD = "e2e-staf-bukan-rahasia";
/** Sama dengan NEXTAUTH_SECRET di playwright.config.mjs (hanya untuk tes). */
export const E2E_SECRET = "e2e-nextauth-secret-0123456789abcdef-xyz";

/** Login lewat UI sampai benar-benar masuk panel; tiap panggilan memakai IP berbeda agar batas laju antar tes tidak saling mengganggu. */
export async function login(page: Page, email = ADMIN_EMAIL, password = ADMIN_PASSWORD) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
  await page.waitForURL(/\/admin$/);
}

/** PNG 1×1 valid (bisa ditampilkan browser). */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);
export const berkasPng = (name = "foto.png") => ({ name, mimeType: "image/png", buffer: PNG_1X1 });
