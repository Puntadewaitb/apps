import Database from "better-sqlite3";
import { randomBytes } from "node:crypto";

export const ADMIN_PASSWORD = "e2e-password-bukan-rahasia";

/** IP unik per tes agar rate limiter (per IP, in-memory) tidak saling mengganggu. */
export function uniqueIp(): string {
  const b = randomBytes(3);
  return `10.${b[0]}.${b[1]}.${b[2]}`;
}

export function uniqueTag(prefix = "t"): string {
  return `${prefix}${randomBytes(4).toString("hex")}`;
}

type LeadRow = { id: number; name: string; phone: string; message: string };

/** Baca langsung dari DB e2e (read-only). */
export function leadsWhere(column: "name" | "message", like: string): LeadRow[] {
  const db = new Database("e2e.db", { readonly: true, fileMustExist: true });
  try {
    return db
      .prepare(`SELECT id, name, phone, message FROM Lead WHERE ${column} LIKE ? ORDER BY id`)
      .all(`%${like}%`) as LeadRow[];
  } finally {
    db.close();
  }
}
