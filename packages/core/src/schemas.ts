import { z } from "zod";
import { sanitizeText } from "./sanitize";

/** Nama orang: huruf (unicode), spasi, titik, apostrof, tanda hubung. 2–100 karakter. */
export const nameSchema = z
  .string()
  .transform((v) => sanitizeText(v, { maxLength: 200 }))
  .pipe(
    z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .regex(
        /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u,
        "Nama hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung",
      ),
  );

/**
 * No HP seluler Indonesia. Terima 08xx, +628xx, 628xx (spasi/strip/kurung diabaikan).
 * Hasil dinormalisasi ke format internasional tanpa plus: 628xxxxxxxxx.
 */
export const phoneIdSchema = z
  .string()
  .transform((v) => v.replace(/[\s().-]/g, ""))
  .pipe(
    z
      .string()
      .regex(/^(?:\+62|62|0)8\d{7,11}$/, "Nomor HP tidak valid (contoh: 081234567890)")
      .transform((v) => "62" + v.replace(/^(?:\+62|62|0)/, "")),
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email terlalu panjang")
  .pipe(z.email("Email tidak valid"));

/** Pesan bebas (plain text) — disanitasi, panjang dibatasi. */
export function messageSchema(opts: { min?: number; max?: number } = {}) {
  const { min = 1, max = 2000 } = opts;
  return z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2, multiline: true }))
    .pipe(
      z
        .string()
        .min(min, `Pesan minimal ${min} karakter`)
        .max(max, `Pesan maksimal ${max} karakter`),
    );
}
