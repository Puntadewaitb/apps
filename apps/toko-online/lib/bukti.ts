import { validateUpload } from "@tpl/core";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadDir } from "./env";

/** Bukti bayar = data pribadi: subfolder privat yang TIDAK disajikan oleh route publik mana pun. */
export const buktiDir = () => join(uploadDir(), "bukti");
export const MAKS_BUKTI = 2 * 1024 * 1024;
export const NAMA_BUKTI = /^[A-Za-z0-9_-]{16,64}\.(png|jpg|webp|pdf)$/;

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};
export const mimeBukti = (nama: string) => MIME[nama.slice(nama.lastIndexOf(".") + 1)];

const PESAN: Record<string, string> = {
  empty: "Berkas kosong.",
  too_large: `Ukuran berkas maksimal ${MAKS_BUKTI / 1024 / 1024} MB.`,
  type_not_allowed: "Format berkas harus PNG, JPG, WebP, atau PDF.",
  type_mismatch: "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
};

export type BuktiSiap = { bytes: Uint8Array; ext: string };

/** Validasi saja (magic bytes + ukuran + kecocokan MIME). SVG/GIF/HTML ditolak karena bukan tipe yang diizinkan. */
export function periksaBukti(
  bytes: Uint8Array,
  declaredType?: string,
): { ok: true; bukti: BuktiSiap } | { ok: false; pesan: string } {
  const cek = validateUpload(bytes, {
    maxBytes: MAKS_BUKTI,
    allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    declaredType: declaredType || undefined,
  });
  if (!cek.ok) return { ok: false, pesan: PESAN[cek.reason] ?? "Berkas tidak valid." };
  return { ok: true, bukti: { bytes, ext: cek.ext } };
}

export async function simpanBukti(b: BuktiSiap): Promise<string> {
  const nama = `${randomBytes(18).toString("base64url")}.${b.ext}`;
  await mkdir(buktiDir(), { recursive: true });
  await writeFile(join(buktiDir(), nama), b.bytes, { flag: "wx", mode: 0o640 });
  return nama;
}

export async function bacaBukti(nama: string): Promise<Buffer | null> {
  if (!NAMA_BUKTI.test(nama)) return null;
  try {
    return await readFile(join(buktiDir(), nama));
  } catch {
    return null;
  }
}

export async function hapusBukti(nama: string): Promise<void> {
  if (NAMA_BUKTI.test(nama)) await rm(join(buktiDir(), nama), { force: true });
}
