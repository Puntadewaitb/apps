import { randomCode } from "@tpl/core";
import { createHash, timingSafeEqual } from "node:crypto";

/** Nomor pendaftaran ACAK (bukan urutan → tak bisa ditebak/di-enumerasi), mis. PPDB-2027-K7M2XQ. */
export const buatNomor = (tahun = new Date().getFullYear()) => `PPDB-${tahun}-${randomCode(6)}`;
/** Token akses 12 karakter (alfabet tanpa 0/O/1/I/L; ±59 bit), ditampilkan XXXX-XXXX-XXXX. */
export const buatToken = () => randomCode(12).replace(/(.{4})(?=.)/g, "$1-");

/** Bentuk kanonik token yang diketik pengguna: huruf besar, tanpa spasi/tanda hubung. */
export const normalisasiToken = (t: string) => t.toUpperCase().replace(/[\s-]/g, "");
export const normalisasiNomor = (n: string) => n.trim().toUpperCase();
export const NOMOR_RE = /^PPDB-\d{4}-[2-9A-HJKMNP-Z]{6}$/;
export const TOKEN_RE = /^[2-9A-HJKMNP-Z]{12}$/;

/** SHA-256 hex dari token kanonik. Token polos tidak pernah disimpan. */
export const hashToken = (t: string) =>
  createHash("sha256").update(normalisasiToken(t)).digest("hex");

/** Perbandingan hash waktu-konstan; panjang berbeda → false tanpa melempar. */
export function samaHash(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

const DUMMY = hashToken("TIDAK-ADA-PENDAFTAR");

export type RegistrasiRingkas = {
  regNo: string;
  tokenHash: string;
  status: string;
  adminNote: string;
  studentName: string;
  targetGrade: string;
  createdAt: Date;
  documents: string;
};

export type HasilCek =
  | { ok: true; data: RegistrasiRingkas }
  | { ok: false; galat: "FORMAT" | "TIDAK_COCOK" | "RATE_LIMIT" };

export type CekDeps = {
  cari: (regNo: string) => Promise<RegistrasiRingkas | null>;
  limiterIp: (key: string) => { allowed: boolean };
  limiterNomor: (key: string) => { allowed: boolean };
};

/**
 * Cek status: butuh nomor DAN token. Nomor tak dikenal & token salah menghasilkan galat yang sama (TIDAK_COCOK),
 * dan hash selalu dibandingkan (dengan hash palsu bila nomor tak ada) agar waktu respons tak membocorkan keberadaan nomor.
 */
export async function periksaStatus(
  nomor: string,
  token: string,
  ip: string,
  deps: CekDeps,
): Promise<HasilCek> {
  const no = normalisasiNomor(nomor);
  const tk = normalisasiToken(token);
  if (!NOMOR_RE.test(no) || !TOKEN_RE.test(tk)) return { ok: false, galat: "FORMAT" };
  if (!deps.limiterIp(`ip:${ip}`).allowed) return { ok: false, galat: "RATE_LIMIT" };
  if (!deps.limiterNomor(`no:${no}`).allowed) return { ok: false, galat: "RATE_LIMIT" };
  const row = await deps.cari(no);
  const cocok = samaHash(hashToken(tk), row?.tokenHash ?? DUMMY);
  return row && cocok ? { ok: true, data: row } : { ok: false, galat: "TIDAK_COCOK" };
}
