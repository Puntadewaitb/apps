import { z } from "zod";
import type { NodeStruktur } from "../content/profil";

const gambar = z
  .string()
  .regex(/^\/img\/[\w.-]+\.(svg|png|jpe?g|webp)$/, "path gambar harus /img/…");
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const node: z.ZodType<NodeStruktur> = z.lazy(() =>
  z.object({ jabatan: z.string().min(3), nama: z.string().min(3), anak: z.array(node) }),
);

export const profilSchema = z.object({
  judul: z.string().min(1),
  pengantar: z.string().min(20),
  sambutan: z.object({
    judul: z.string().min(1),
    nama: z.string().min(3),
    jabatan: z.string().min(3),
    foto: gambar,
    paragraf: z.array(z.string().min(20)).min(1),
  }),
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
  visiMisi: z.object({
    judul: z.string().min(1),
    visi: z.string().min(20),
    misi: z.array(z.string().min(10)).min(2),
  }),
  struktur: z.object({ judul: z.string().min(1), akar: node }),
  lokasi: z.object({ judul: z.string().min(1), mapsUrl: z.string() }),
});

export const programSchema = z
  .object({
    judul: z.string().min(1),
    pengantar: z.string().min(20),
    akademik: z.object({
      judul: z.string().min(1),
      daftar: z
        .array(
          z.object({
            id,
            ikon: z.string().min(1),
            nama: z.string().min(3),
            ringkas: z.string().min(20),
            butir: z.array(z.string().min(3)).min(2),
          }),
        )
        .min(2),
    }),
    ekstrakurikuler: z.object({
      judul: z.string().min(1),
      subjudul: z.string().min(1),
      kategori: z.array(z.object({ id, nama: z.string().min(3) })).min(2),
      daftar: z
        .array(
          z.object({
            id,
            nama: z.string().min(3),
            kategori: id,
            jadwal: z.string().min(5),
            pembina: z.string().min(3),
          }),
        )
        .min(2),
    }),
  })
  .superRefine((p, ctx) => {
    const kat = new Set(p.ekstrakurikuler.kategori.map((k) => k.id));
    p.ekstrakurikuler.daftar.forEach((e, i) => {
      if (!kat.has(e.kategori))
        ctx.addIssue({
          code: "custom",
          path: ["ekstrakurikuler", "daftar", i, "kategori"],
          message: `kategori tidak dikenal: ${e.kategori}`,
        });
    });
    for (const [nama, arr] of [
      ["akademik", p.akademik.daftar.map((x) => x.id)],
      ["ekstrakurikuler", p.ekstrakurikuler.daftar.map((x) => x.id)],
    ] as const) {
      if (new Set(arr).size !== arr.length)
        ctx.addIssue({ code: "custom", path: [nama], message: "id harus unik" });
    }
  });
