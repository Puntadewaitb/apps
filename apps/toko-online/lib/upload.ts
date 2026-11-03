import { validateUpload } from "@tpl/core";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { db } from "./db";
import { uploadDir } from "./env";

export const MAKS_GAMBAR = 2 * 1024 * 1024; // 2 MB
export const NAMA_UPLOAD = /^[A-Za-z0-9_-]{16,64}\.(png|jpg|webp)$/;
/** Path publik file unggahan, mis. /uploads/abc….jpg */
export const PATH_UPLOAD = /^\/uploads\/([A-Za-z0-9_-]{16,64}\.(?:png|jpg|webp))$/;

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
export const mimeDariNama = (nama: string) => MIME[nama.slice(nama.lastIndexOf(".") + 1)];

export type HasilUnggah = { ok: true; path: string } | { ok: false; pesan: string };

const PESAN: Record<string, string> = {
  empty: "File kosong.",
  too_large: `Ukuran gambar maksimal ${MAKS_GAMBAR / 1024 / 1024} MB.`,
  type_not_allowed: "Format gambar harus PNG, JPG, atau WebP.",
  type_mismatch: "Isi file tidak sesuai dengan tipe yang dinyatakan.",
};

/** Validasi (magic bytes + ukuran + kecocokan MIME) lalu simpan dengan nama acak server-side. SVG/GIF ditolak. */
export async function simpanGambar(file: File): Promise<HasilUnggah> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cek = validateUpload(bytes, {
    maxBytes: MAKS_GAMBAR,
    allowed: ["image/png", "image/jpeg", "image/webp"],
    declaredType: file.type || undefined,
  });
  if (!cek.ok) return { ok: false, pesan: PESAN[cek.reason] ?? "File tidak valid." };
  const nama = `${randomBytes(18).toString("base64url")}.${cek.ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(join(uploadDir(), nama), bytes, { flag: "wx", mode: 0o640 });
  return { ok: true, path: `/uploads/${nama}` };
}

export async function bacaUpload(nama: string): Promise<Buffer | null> {
  if (!NAMA_UPLOAD.test(nama)) return null;
  try {
    return await readFile(join(uploadDir(), nama));
  } catch {
    return null;
  }
}

/** Jumlah baris yang masih merujuk path tsb (gambar utama, galeri JSON, pengaturan mis. QRIS). */
async function jumlahRujukan(path: string): Promise<number> {
  const [a, b, c] = await Promise.all([
    db().product.count({ where: { image: path } }),
    db().product.count({ where: { images: { contains: path } } }),
    db().setting.count({ where: { value: path } }),
  ]);
  return a + b + c;
}

/** Hapus file unggahan bila sudah tak dirujuk siapa pun. Path non-unggahan (/img/…) diabaikan. */
export async function bersihkanUpload(path: string | null | undefined): Promise<void> {
  const m = path ? PATH_UPLOAD.exec(path) : null;
  if (!m) return;
  if ((await jumlahRujukan(path!)) > 0) return;
  await rm(join(uploadDir(), m[1]!), { force: true });
}

export type GambarSiap = { bytes: Uint8Array; ext: string };

/** Validasi saja (belum menulis ke disk) — dipakai agar semua berkas diperiksa SEBELUM ada yang ditulis (atomik). */
export async function periksaGambar(
  file: File,
): Promise<{ ok: true; gambar: GambarSiap } | { ok: false; pesan: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cek = validateUpload(bytes, {
    maxBytes: MAKS_GAMBAR,
    allowed: ["image/png", "image/jpeg", "image/webp"],
    declaredType: file.type || undefined,
  });
  if (!cek.ok) return { ok: false, pesan: PESAN[cek.reason] ?? "File tidak valid." };
  return { ok: true, gambar: { bytes, ext: cek.ext } };
}

export async function tulisGambar(g: GambarSiap): Promise<string> {
  const nama = `${randomBytes(18).toString("base64url")}.${g.ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(join(uploadDir(), nama), g.bytes, { flag: "wx", mode: 0o640 });
  return `/uploads/${nama}`;
}
