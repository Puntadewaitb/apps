import { z } from "zod";

/** Href yang diizinkan: path internal, anchor, atau https. (Cegah javascript:/data: lewat konten.) */
const href = z
  .string()
  .regex(
    /^(\/(?!\/)[^\s]*|#[^\s]*|https:\/\/[^\s]+|WHATSAPP)$/,
    "href harus path internal, #anchor, https://, atau WHATSAPP",
  );

const tautan = z.object({ label: z.string().min(1), href });

const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug: huruf kecil, angka, dan tanda hubung");
const gambarPath = z
  .string()
  .regex(/^\/img\/[\w.-]+\.(svg|png|jpe?g|webp)$/, "path gambar harus /img/…");

export const layananSchema = z.object({
  slug,
  nama: z.string().min(3),
  ikon: z.string().min(1),
  ringkas: z.string().min(20),
  deskripsi: z.array(z.string().min(20)).min(1),
  manfaat: z.array(z.string().min(5)).min(3),
  tahapan: z.array(z.object({ judul: z.string().min(2), teks: z.string().min(10) })).min(3),
  hasil: z.array(z.string().min(3)).min(2),
  faq: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        q: z.string().min(8),
        a: z.string().min(20),
      }),
    )
    .min(2),
  terkait: z.array(slug),
});

export const tentangSchema = z.object({
  judul: z.string().min(1),
  pengantar: z.string().min(20),
  sejarah: z.object({
    judul: z.string().min(1),
    peristiwa: z
      .array(
        z.object({
          tahun: z.string().regex(/^\d{4}$/),
          judul: z.string().min(2),
          teks: z.string().min(10),
        }),
      )
      .min(2),
  }),
  visiMisi: z.object({ visi: z.string().min(20), misi: z.array(z.string().min(10)).min(2) }),
  nilai: z.array(z.object({ judul: z.string().min(2), teks: z.string().min(10) })).min(2),
  tim: z.object({
    judul: z.string().min(1),
    anggota: z
      .array(
        z.object({
          nama: z.string().min(3),
          jabatan: z.string().min(3),
          bio: z.string().min(20),
          foto: gambarPath,
        }),
      )
      .min(1),
  }),
});

const idKategori = z.string().regex(/^[a-z0-9-]+$/);

export const portofolioSchema = z.object({
  judul: z.string().min(1),
  pengantar: z.string().min(10),
  catatan: z.string().min(10),
  filter: z.object({
    semua: z.string().min(1),
    label: z.string().min(5),
    kosong: z.string().min(5),
  }),
  kategori: z.array(z.object({ id: idKategori, nama: z.string().min(3), layanan: slug })).min(2),
  proyek: z
    .array(
      z.object({
        slug,
        judul: z.string().min(5),
        klien: z.string().min(3),
        kategori: idKategori,
        tahun: z.number().int().min(2000).max(2100),
        ringkas: z.string().min(20),
        tantangan: z.string().min(20),
        solusi: z.string().min(20),
        hasil: z.array(z.string().min(5)).min(2),
        teknologi: z.array(z.string().min(2)).min(1),
        gambar: gambarPath,
      }),
    )
    .min(2),
});

export const kredibilitasSchema = z.object({
  angka: z.object({
    judul: z.string().min(1),
    butir: z.array(z.object({ nilai: z.string().min(1), label: z.string().min(3) })).min(3),
    catatan: z.string().min(5),
  }),
  klien: z.object({
    judul: z.string().min(1),
    subjudul: z.string().min(1),
    daftar: z.array(z.object({ nama: z.string().min(2), logo: gambarPath })).min(3),
  }),
  testimoni: z.object({
    judul: z.string().min(1),
    catatan: z.string().min(5),
    daftar: z
      .array(
        z.object({
          nama: z.string().min(3),
          jabatan: z.string().min(3),
          perusahaan: z.string().min(3),
          teks: z.string().min(30),
          rating: z.number().int().min(1).max(5),
        }),
      )
      .min(1),
  }),
});

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
    mapsUrl: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string().min(1),
    judul: z.string().min(1),
    subjudul: z.string().min(1),
    cta: tautan,
    ctaSekunder: tautan,
    gambar: z.object({ src: z.string().startsWith("/"), alt: z.string().min(5) }),
  }),
  keunggulan: z.object({
    judul: z.string().min(1),
    subjudul: z.string().min(1),
    butir: z
      .array(
        z.object({ ikon: z.string().min(1), judul: z.string().min(2), teks: z.string().min(10) }),
      )
      .min(3),
  }),
  layananRingkas: z.object({ judul: z.string().min(1), subjudul: z.string().min(1), tautan }),
  layananHalaman: z.object({
    judul: z.string().min(1),
    pengantar: z.string().min(1),
    cta: z.string().min(1),
    terkaitJudul: z.string().min(1),
    faqJudul: z.string().min(1),
    tahapanJudul: z.string().min(1),
    manfaatJudul: z.string().min(1),
    hasilJudul: z.string().min(1),
    breadcrumbBeranda: z.string().min(1),
    ajakanJudul: z.string().min(1),
    ajakanTeks: z.string().min(1),
  }),
  tentang: tentangSchema,
  layanan: z.array(layananSchema).min(1),
  portofolio: portofolioSchema,
  kredibilitas: kredibilitasSchema,
  ajakan: z.object({ judul: z.string().min(1), teks: z.string().min(1) }),
  footer: z.object({ deskripsi: z.string().min(1), tautan: z.array(tautan) }),
});

export type KontenValid = z.infer<typeof kontenSchema>;
