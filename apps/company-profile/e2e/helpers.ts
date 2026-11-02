import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { MAIL_FILE } from "./smtp-sink";

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

export type Surel = { from: string; to: string[]; data: string };
export function suratMasuk(): Surel[] {
  if (!existsSync(MAIL_FILE)) return [];
  return readFileSync(MAIL_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Surel);
}

export async function loginAdmin(page: Page, password = ADMIN_PASSWORD) {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": uniqueIp() });
  await page.goto("/admin/login");
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk" }).click();
}
