import { validateUpload } from "@tpl/core";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { uploadDir } from "./upload";

/** Dokumen PPDB bersifat PRIVAT (data pribadi): disimpan di subfolder yang TIDAK disajikan oleh /uploads/[nama]. */
export const dokumenDir = () => join(uploadDir(), "dokumen");
export const MAX_DOKUMEN = 2 * 1024 * 1024;
export const NAMA_DOKUMEN = /^[A-Za-z0-9_-]{16,64}\.(png|jpg|webp|pdf)$/;

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
};
export const mimeDokumen = (nama: string) => MIME[nama.slice(nama.lastIndexOf(".") + 1)];

const PESAN: Record<string, string> = {
  empty: "Berkas kosong.",
  too_large: `Ukuran berkas maksimal ${MAX_DOKUMEN / 1024 / 1024} MB.`,
  type_not_allowed: "Format berkas harus PDF, PNG, JPG, atau WebP.",
  type_mismatch: "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
};

export type DokumenSiap = { bytes: Uint8Array; ext: string; mime: string; size: number };

/** Validasi saja (belum menulis ke disk). */
export async function periksaDokumen(
  file: File,
): Promise<{ ok: true; dok: DokumenSiap } | { ok: false; pesan: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cek = validateUpload(bytes, {
    maxBytes: MAX_DOKUMEN,
    allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
    declaredType: file.type || undefined,
  });
  if (!cek.ok) return { ok: false, pesan: PESAN[cek.reason] ?? "Berkas tidak valid." };
  return { ok: true, dok: { bytes, ext: cek.ext, mime: cek.type, size: cek.size } };
}

export async function simpanDokumen(d: DokumenSiap): Promise<string> {
  const nama = `${randomBytes(18).toString("base64url")}.${d.ext}`;
  await mkdir(dokumenDir(), { recursive: true });
  await writeFile(join(dokumenDir(), nama), d.bytes, { flag: "wx", mode: 0o640 });
  return nama;
}

export async function bacaDokumen(nama: string): Promise<Buffer | null> {
  if (!NAMA_DOKUMEN.test(nama)) return null;
  try {
    return await readFile(join(dokumenDir(), nama));
  } catch {
    return null;
  }
}

export async function hapusDokumen(nama: string): Promise<void> {
  if (NAMA_DOKUMEN.test(nama)) await rm(join(dokumenDir(), nama), { force: true });
}

export type DokumenTersimpan = { kind: string; file: string; mime: string; size: number };

/** Parse kolom `documents` (JSON) dengan aman: entri yang bentuknya salah dibuang. */
export function parseDokumen(json: string): DokumenTersimpan[] {
  try {
    const arr: unknown = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is DokumenTersimpan =>
        !!x &&
        typeof x === "object" &&
        typeof (x as DokumenTersimpan).kind === "string" &&
        typeof (x as DokumenTersimpan).file === "string" &&
        NAMA_DOKUMEN.test((x as DokumenTersimpan).file) &&
        typeof (x as DokumenTersimpan).mime === "string" &&
        typeof (x as DokumenTersimpan).size === "number",
    );
  } catch {
    return [];
  }
}
