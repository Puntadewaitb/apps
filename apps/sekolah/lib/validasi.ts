import { sanitizeText } from "@tpl/core";
import { z } from "zod";
import { POST_KINDS } from "./domain";
import { parseWaktuWib } from "./waktu";

/** Path gambar yang boleh disimpan di DB: aset demo /img/… atau hasil unggahan /uploads/… */
export const PATH_GAMBAR =
  /^\/(?:img\/[\w.-]+\.(?:svg|png|jpe?g|webp)|uploads\/[A-Za-z0-9_-]{16,64}\.(?:png|jpg|webp))$/;
export const pathGambar = z.string().regex(PATH_GAMBAR, "Path gambar tidak valid.");

const teks = (min: number, max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2 }))
    .pipe(
      z
        .string()
        .min(min, `${label} minimal ${min} karakter.`)
        .max(max, `${label} maksimal ${max} karakter.`),
    );

/** Isi artikel: Markdown mentah (tag HTML tidak dihapus — renderer tidak menafsirkan HTML), hanya dibatasi panjang & kontrol. */
const markdown = (min: number, max: number) =>
  z
    .string()
    .transform((v) =>
      v
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trim(),
    )
    .pipe(
      z.string().min(min, `Isi minimal ${min} karakter.`).max(max, `Isi maksimal ${max} karakter.`),
    );

const opsional = (max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2, multiline: true }))
    .pipe(z.string().max(max, `${label} maksimal ${max} karakter.`));

const waktu = (label: string) =>
  z.string().transform((v, ctx) => {
    const d = parseWaktuWib(v);
    if (!d) ctx.addIssue({ code: "custom", message: `${label} tidak valid.` });
    return d as Date;
  });
const waktuOpsional = (label: string) =>
  z.string().transform((v, ctx) => {
    if (!v.trim()) return null;
    const d = parseWaktuWib(v);
    if (!d) ctx.addIssue({ code: "custom", message: `${label} tidak valid.` });
    return d;
  });
const centang = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const beritaSchema = z.object({
  title: teks(5, 150, "Judul"),
  kind: z.enum(POST_KINDS, "Jenis tidak valid."),
  excerpt: teks(20, 300, "Ringkasan"),
  body: markdown(30, 20_000),
  published: centang,
  publishedAt: waktuOpsional("Tanggal terbit"),
});

export const agendaSchema = z
  .object({
    title: teks(3, 150, "Judul"),
    description: opsional(2000, "Deskripsi"),
    location: opsional(200, "Lokasi"),
    startsAt: waktu("Waktu mulai"),
    endsAt: waktuOpsional("Waktu selesai"),
  })
  .superRefine((a, ctx) => {
    if (a.endsAt && a.startsAt && a.endsAt < a.startsAt)
      ctx.addIssue({
        code: "custom",
        path: ["endsAt"],
        message: "Waktu selesai tidak boleh sebelum waktu mulai.",
      });
  });

export const guruSchema = z.object({
  name: teks(3, 100, "Nama"),
  position: teks(3, 100, "Jabatan"),
  subject: opsional(100, "Mata pelajaran"),
  bio: opsional(500, "Bio"),
  sort: z
    .string()
    .regex(/^\d{1,4}$/, "Urutan harus bilangan bulat 0–9999.")
    .transform(Number),
  active: centang,
});

export const albumSchema = z.object({
  title: teks(3, 100, "Judul"),
  description: opsional(500, "Deskripsi"),
});

export const keteranganSchema = opsional(150, "Keterangan");

/** FormData → objek string (File diabaikan) untuk divalidasi zod. */
export function dariForm(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries())
    if (typeof v === "string" && !k.startsWith("$ACTION")) o[k] = v;
  return o;
}

export type FormState = {
  ok?: boolean;
  pesan?: string;
  errors?: Record<string, string>;
  /**
   * Isian yang dikirim, dikembalikan saat gagal. React 19 mereset field tak terkontrol setelah action selesai
   * (termasuk saat gagal validasi) — tanpa ini pengguna kehilangan semua yang sudah diketik.
   */
  values?: Record<string, string>;
};

export function galatZod(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
  values?: Record<string, string>,
): FormState {
  const errors: Record<string, string> = {};
  for (const i of error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
  return { ok: false, errors, pesan: "Periksa kembali isian Anda.", values };
}

/** Pembaca nilai form: isian yang dikirim (bila gagal) atau nilai awal. */
export function pembacaForm(s: FormState) {
  return {
    v: (k: string, awal: string) => (s.values ? (s.values[k] ?? "") : awal),
    c: (k: string, awal: boolean) => (s.values ? s.values[k] === "on" : awal),
  };
}
