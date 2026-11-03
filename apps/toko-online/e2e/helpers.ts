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
