import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";

export const uniqueIp = () => {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
};
/** Huruf saja (a–p). */
export const huruf = () =>
  [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 16))).join("");
export const tag = (p = "t") => `${p}${randomBytes(4).toString("hex")}`;

/** Format DateTime yang dipakai Prisma + SQLite (teks ISO "…+00:00") — wajib sama agar perbandingan di DB benar. */
export const dbDate = (d: Date | number) => new Date(d).toISOString().replace("Z", "+00:00");

export function query<T>(sql: string, ...args: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...args) as T[];
  } finally {
    d.close();
  }
}

/** Tulis langsung ke DB e2e (mis. menyisipkan data "kotor"/nonaktif untuk uji pertahanan berlapis). */
export function tulis(fn: (db: Database.Database) => void) {
  const d = new Database("e2e.db", { fileMustExist: true });
  try {
    fn(d);
  } finally {
    d.close();
  }
}

/** Awasi error konsol/JS, pelanggaran CSP, respons ≥400 aset same-origin, dan permintaan ke origin luar. */
export async function awasi(page: Page, base = "http://localhost:3004") {
  const p = { masalah: [] as string[], luar: [] as string[], gagal: [] as string[] };
  await page.route("https://www.google.com/**", (r) => r.abort());
  page.on("console", (m) => {
    const t = m.text();
    if (/Failed to load resource/.test(t)) return;
    if (m.type() === "error" || /Refused to|Content Security Policy/i.test(t))
      p.masalah.push(`[${m.type()}] ${t}`);
  });
  page.on("pageerror", (e) => p.masalah.push(`[pageerror] ${e}`));
  page.on("request", (r) => {
    const u = new URL(r.url());
    if (u.origin !== base && u.protocol.startsWith("http") && u.hostname !== "www.google.com")
      p.luar.push(r.url());
  });
  page.on("response", (r) => {
    if (r.url().startsWith(base) && r.status() >= 400 && r.request().resourceType() !== "document")
      p.gagal.push(`${r.status()} ${r.url()}`);
  });
  return p;
}

export const ADMIN_EMAIL = "admin@sekolah.example";
export const ADMIN_PASSWORD = "e2e-password-bukan-rahasia";
export const EDITOR_EMAIL = "editor@sekolah.example";
export const EDITOR_PASSWORD = "e2e-editor-bukan-rahasia";
/** Sama dengan NEXTAUTH_SECRET di playwright.config.mjs (hanya untuk tes). */
export const E2E_SECRET = "e2e-nextauth-secret-0123456789abcdef-xyz";

/** Login lewat UI; tiap panggilan memakai IP berbeda agar rate limit antar tes tidak saling mengganggu. */
export async function masuk(
  page: Page,
  email = ADMIN_EMAIL,
  password = ADMIN_PASSWORD,
  callbackUrl?: string,
) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto(
    callbackUrl ? `/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/admin/login",
  );
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}
