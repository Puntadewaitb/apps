import { emailSchema, messageSchema, nameSchema, phoneIdSchema, sanitizeText } from "@tpl/core";
import { z } from "zod";
import { MAKS_BARIS, MAKS_QTY } from "./keranjang";

const idInt = z.number().int().positive().max(2_147_483_647);

/** Baris keranjang: HANYA id varian + jumlah. Harga/stok/nama tidak punya tempat di permintaan. */
export const itemSchema = z
  .object({ varianId: idInt, qty: z.number().int().min(1).max(MAKS_QTY) })
  .strict();

/** Gabungkan varian ganda (jumlah dijumlah, dijepit MAKS_QTY) — duplikat tidak boleh melewati batas per-baris. */
export const itemsSchema = z
  .array(itemSchema)
  .min(1, "Keranjang kosong")
  .max(MAKS_BARIS)
  .transform((a) => {
    const m = new Map<number, number>();
    for (const x of a) m.set(x.varianId, Math.min(MAKS_QTY, (m.get(x.varianId) ?? 0) + x.qty));
    return [...m].map(([varianId, qty]) => ({ varianId, qty }));
  });

const teksPendek = (min: number, max: number, pesan: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2 }))
    .pipe(z.string().min(min, pesan).max(max, pesan));

export const kotaSchema = teksPendek(2, 60, "Kota wajib diisi (2–60 karakter)").pipe(
  z
    .string()
    .regex(
      /^[\p{L}\p{M}\d][\p{L}\p{M}\d\s.'’,()-]*$/u,
      "Nama kota mengandung karakter yang tidak diizinkan",
    ),
);

const kodeVoucher = z
  .string()
  .max(64)
  .optional()
  .transform((v) => (v ?? "").trim());

export const ringkasanSchema = z
  .object({
    items: itemsSchema,
    kota: z.string().max(100).optional().default(""),
    voucher: kodeVoucher,
  })
  .strict();

export const pesananSchema = z
  .object({
    kunci: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, "Kunci tidak valid"),
    items: itemsSchema,
    nama: nameSchema,
    telepon: phoneIdSchema,
    email: z
      .union([z.literal(""), emailSchema])
      .optional()
      .default(""),
    alamat: messageSchema({ min: 10, max: 300 }),
    kota: kotaSchema,
    catatan: z
      .string()
      .max(600)
      .optional()
      .default("")
      .transform((v) => sanitizeText(v, { maxLength: 300, multiline: true })),
    voucher: kodeVoucher,
    /** Total yang DILIHAT pembeli. Hanya pembanding: bila beda dengan hitungan server → pesanan ditolak, bukan dipakai. */
    totalPreview: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    dibuka: z.number().optional(),
    website_url: z.string().max(200).optional().default(""),
  })
  .strict();

export type PesananInput = z.infer<typeof pesananSchema>;
export type RingkasanInput = z.infer<typeof ringkasanSchema>;

/** Peta galat per-field dari ZodError (path pertama) — dikirim ke klien untuk ditampilkan di samping field. */
export function galatField(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "form");
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}
