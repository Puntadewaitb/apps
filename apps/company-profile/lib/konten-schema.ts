import { z } from "zod";

/** Href yang diizinkan: path internal, anchor, atau https. (Cegah javascript:/data: lewat konten.) */
const href = z
  .string()
  .regex(
    /^(\/(?!\/)[^\s]*|#[^\s]*|https:\/\/[^\s]+|WHATSAPP)$/,
    "href harus path internal, #anchor, https://, atau WHATSAPP",
  );

const tautan = z.object({ label: z.string().min(1), href });

export const kontenSchema = z.object({
  tema: z.enum(["netral", "hangat", "hijau"]),
  perusahaan: z.object({
    nama: z.string().min(1),
    namaLengkap: z.string().min(1),
    tagline: z.string().min(1),
    deskripsi: z.string().min(20),
    tahunBerdiri: z.number().int().min(1900).max(2100),
    locale: z.string().regex(/^[a-z]{2}_[A-Z]{2}$/),
  }),
  nav: z.array(tautan).min(1),
  kontak: z.object({
    telepon: z.string().min(1),
    whatsapp: z.string().regex(/^62\d{8,13}$/, "format 62xxxxxxxxxx tanpa +"),
    pesanWhatsapp: z.string().min(1),
    email: z.email(),
    alamat: z.string().min(1),
    jamKerja: z.string().min(1),
  }),
  hero: z.object({
    eyebrow: z.string().min(1),
    judul: z.string().min(1),
    subjudul: z.string().min(1),
    cta: tautan,
    ctaSekunder: tautan,
    gambar: z.object({ src: z.string().startsWith("/"), alt: z.string().min(5) }),
  }),
  ajakan: z.object({ judul: z.string().min(1), teks: z.string().min(1) }),
  footer: z.object({ deskripsi: z.string().min(1), tautan: z.array(tautan) }),
});

export type KontenValid = z.infer<typeof kontenSchema>;
