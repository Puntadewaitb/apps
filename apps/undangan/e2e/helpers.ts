import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import type { Page } from "@playwright/test";

export const ADMIN_PASSWORD = "e2e-password-bukan-rahasia";

export const uniqueIp = () => {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
};
/** Huruf saja (a–p): aman untuk skema nama yang hanya menerima huruf. */
export const huruf = () =>
  [...randomBytes(6)].map((b) => String.fromCharCode(97 + (b % 16))).join("");
export const tag = (p = "t") => `${p}${randomBytes(4).toString("hex")}`;

export function query<T>(sql: string, ...args: unknown[]): T[] {
  const d = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return d.prepare(sql).all(...args) as T[];
  } finally {
    d.close();
  }
}

/** Login admin; tiap tes memakai IP unik agar rate limit tidak saling mengganggu. */
export async function loginAdmin(page: Page, password = ADMIN_PASSWORD) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}

/** Koneksi tulis ke DB e2e — hanya untuk menyuntik data "kotor" yang tak mungkin lewat API (uji escaping saat output). */
export function tulis(fn: (db: Database.Database) => void) {
  const d = new Database("e2e.db", { fileMustExist: true });
  try {
    fn(d);
  } finally {
    d.close();
  }
}
