import { nameSchema, sanitizeText } from "@tpl/core";
import { z } from "zod";
import { parseRupiah } from "./rupiah";

const centang = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const konfirmasiSchema = z.object({
  donorName: nameSchema,
  amount: z.string().transform((v, ctx) => {
    const r = parseRupiah(v);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.pesan });
      return z.NEVER;
    }
    return r.nilai;
  }),
  message: z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: 600, multiline: true }))
    .pipe(z.string().max(300, "Pesan maksimal 300 karakter.")),
  anonymous: centang,
});

export type Konfirmasi = z.infer<typeof konfirmasiSchema>;

/** Form program donasi (admin). */
export const programSchema = z.object({
  title: z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: 300 }))
    .pipe(z.string().min(5, "Judul minimal 5 karakter.").max(120, "Judul maksimal 120 karakter.")),
  description: z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: 2400, multiline: true }))
    .pipe(
      z
        .string()
        .min(20, "Deskripsi minimal 20 karakter.")
        .max(1200, "Deskripsi maksimal 1200 karakter."),
    ),
  target: z.string().transform((v, ctx) => {
    const r = parseRupiah(v, 100_000, 100_000_000_000);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.pesan });
      return z.NEVER;
    }
    return r.nilai;
  }),
  deadline: z.string().transform((v, ctx) => {
    if (!v.trim()) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
    const d = m ? new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, 16, 59)) : null; // 23:59 WIB
    if (!m || !d || d.getUTCMonth() !== +m[2]! - 1) {
      ctx.addIssue({ code: "custom", message: "Batas waktu tidak valid." });
      return z.NEVER;
    }
    return d;
  }),
  active: centang,
});
