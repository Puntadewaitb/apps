import { validateUpload } from "@tpl/core";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { db } from "./db";

/** Folder penyimpanan unggahan — DI LUAR public/ (file runtime tidak disajikan oleh `next start`; disajikan lewat /uploads/[name]). */
export const uploadDir = () => resolve(process.env.UPLOAD_DIR || "./uploads");

export const MAX_GAMBAR = 2 * 1024 * 1024; // 2 MB
export const NAMA_UPLOAD = /^[A-Za-z0-9_-]{16,64}\.(png|jpg|webp)$/;
/** Path publik file unggahan, mis. /uploads/abc….jpg */
export const PATH_UPLOAD = /^\/uploads\/([A-Za-z0-9_-]{16,64}\.(?:png|jpg|webp))$/;

const MIME: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp" };
export const mimeDariNama = (nama: string) => MIME[nama.slice(nama.lastIndexOf(".") + 1)];

export type HasilUnggah = { ok: true; path: string } | { ok: false; pesan: string };

const PESAN: Record<string, string> = {
  empty: "File kosong.",
  too_large: `Ukuran gambar maksimal ${MAX_GAMBAR / 1024 / 1024} MB.`,
  type_not_allowed: "Format gambar harus PNG, JPG, atau WebP.",
  type_mismatch: "Isi file tidak sesuai dengan tipe yang dinyatakan.",
};

/** Validasi (magic bytes + ukuran + kecocokan MIME) lalu simpan dengan nama acak server-side. */
export async function simpanGambar(file: File): Promise<HasilUnggah> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const cek = validateUpload(bytes, {
    maxBytes: MAX_GAMBAR,
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

/** Jumlah baris yang masih merujuk path tsb (semua tabel yang menyimpan gambar). */
async function jumlahRujukan(path: string): Promise<number> {
  const [a, b, c, d, e] = await Promise.all([
    db().post.count({ where: { image: path } }),
    db().teacher.count({ where: { photo: path } }),
    db().galleryImage.count({ where: { src: path } }),
    db().gallery.count({ where: { cover: path } }),
    db().donationProgram.count({ where: { image: path } }),
  ]);
  return a + b + c + d + e;
}

/** Hapus file unggahan bila sudah tak dirujuk siapa pun. Path non-unggahan (/img/…) diabaikan. */
export async function bersihkanUpload(path: string | null | undefined): Promise<void> {
  const m = path ? PATH_UPLOAD.exec(path) : null;
  if (!m) return;
  if ((await jumlahRujukan(path!)) > 0) return;
  await rm(join(uploadDir(), m[1]!), { force: true });
}
