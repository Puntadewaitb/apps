import { phoneIdSchema, sanitizeText } from "@tpl/core";
import { z } from "zod";
import { kunciKota } from "./checkout";
import { bulat, opsional, teks } from "./validasi";

export const MAKS_REKENING = 5;
export const MAKS_KOTA = 50;
export const MAKS_ONGKIR = 10_000_000;
const TERLARANG = new Set([
  "__proto__",
  "constructor",
  "prototype",
  "hasownproperty",
  "tostring",
  "valueof",
]);

const noRek = z
  .string()
  .transform((v) => v.trim())
  .pipe(
    z
      .string()
      .regex(/^[0-9][0-9 .-]{3,29}$/, "Nomor rekening 4–30 karakter: angka, spasi, titik, strip."),
  );

const rekeningSchema = z.object({
  bank: teks(2, 60, "Nama bank"),
  nomor: noRek,
  atasNama: teks(2, 80, "Atas nama"),
});

const namaKota = z
  .string()
  .transform((v) => sanitizeText(v, { maxLength: 120 }))
  .pipe(
    z
      .string()
      .regex(
        /^[\p{L}\d][\p{L}\d .'’()-]{0,58}[\p{L}\d.)]$|^[\p{L}\d]{2}$/u,
        "Nama kota 2–60 karakter: huruf, angka, spasi, titik, strip.",
      ),
  );

const tarif = bulat("Tarif", 0, MAKS_ONGKIR);

export const tokoSchema = z.object({
  nama: teks(3, 80, "Nama toko"),
  tagline: opsional(200, "Tagline"),
  alamat: opsional(300, "Alamat"),
  catatanBayar: opsional(300, "Catatan pembayaran"),
  whatsapp: z.string().transform((v, ctx) => {
    const s = v.trim();
    if (!s) return "";
    const r = phoneIdSchema.safeParse(s);
    if (!r.success)
      ctx.addIssue({
        code: "custom",
        message: "Nomor WhatsApp tidak valid (contoh: 081234567890).",
      });
    return r.success ? r.data : "";
  }),
  ongkirBawaan: tarif,
});

export type Rekening = z.infer<typeof rekeningSchema>;

/** Baca baris rekening dari field berindeks r{i}_*; baris yang seluruhnya kosong dilewati. */
export function bacaRekening(f: Record<string, string>): {
  rekening: Rekening[];
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const n = /^\d{1,2}$/.test(f.r_count ?? "") ? Number(f.r_count) : 0;
  if (n > MAKS_REKENING) errors.rekening = `Maksimal ${MAKS_REKENING} rekening.`;
  const rekening: Rekening[] = [];
  if (!errors.rekening)
    for (let i = 0; i < n; i++) {
      const mentah = {
        bank: f[`r${i}_bank`] ?? "",
        nomor: f[`r${i}_nomor`] ?? "",
        atasNama: f[`r${i}_atasNama`] ?? "",
      };
      if (!mentah.bank.trim() && !mentah.nomor.trim() && !mentah.atasNama.trim()) continue;
      const r = rekeningSchema.safeParse(mentah);
      if (r.success) rekening.push(r.data);
      else for (const is of r.error.issues) errors[`r${i}_${String(is.path[0])}`] ??= is.message;
    }
  return { rekening, errors };
}

/** Baca tarif kota dari k{i}_nama/k{i}_tarif; baris kosong dilewati; kunci dinormalkan & harus unik; nama berbahaya ditolak. */
export function bacaKota(f: Record<string, string>): {
  kota: Record<string, number>;
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const n = /^\d{1,2}$/.test(f.k_count ?? "") ? Number(f.k_count) : 0;
  if (n > MAKS_KOTA) errors.kota = `Maksimal ${MAKS_KOTA} kota.`;
  const kota: Record<string, number> = Object.create(null) as Record<string, number>;
  if (!errors.kota)
    for (let i = 0; i < n; i++) {
      const nama = f[`k${i}_nama`] ?? "";
      const tr = f[`k${i}_tarif`] ?? "";
      if (!nama.trim() && !tr.trim()) continue;
      const rn = namaKota.safeParse(nama);
      if (!rn.success) {
        errors[`k${i}_nama`] = rn.error.issues[0]!.message;
        continue;
      }
      const kunci = kunciKota(rn.data);
      if (!kunci || TERLARANG.has(kunci)) {
        errors[`k${i}_nama`] = "Nama kota tidak diizinkan.";
        continue;
      }
      if (kunci in kota) {
        errors[`k${i}_nama`] = "Kota ini sudah ada di daftar.";
        continue;
      }
      const rt = tarif.safeParse(tr);
      if (!rt.success) {
        errors[`k${i}_tarif`] = rt.error.issues[0]!.message;
        continue;
      }
      kota[kunci] = rt.data;
    }
  return { kota: { ...kota }, errors };
}
