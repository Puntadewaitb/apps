import { messageSchema, nameSchema } from "@tpl/core";
import { z } from "zod";

export const RSVP_STATUS = ["HADIR", "TIDAK_HADIR", "RAGU"] as const;
export type RsvpStatus = (typeof RSVP_STATUS)[number];

/** Batas jumlah orang bila tamu tidak punya kode (tamu umum). */
export const DEFAULT_MAX_PAX = 5;
export const KODE_RE = /^[A-Za-z0-9-]{4,20}$/;

export const rsvpSchema = z.object({
  name: nameSchema,
  status: z.enum(RSVP_STATUS, { error: "Pilih salah satu: hadir, tidak hadir, atau masih ragu" }),
  pax: z.coerce
    .number({ error: "Jumlah orang harus berupa angka" })
    .int("Jumlah orang harus bilangan bulat")
    .min(0, "Jumlah orang tidak valid")
    .max(50, "Jumlah orang terlalu banyak")
    .default(1),
  /** Kode tamu (opsional) dari tautan pribadi */
  kode: z
    .string()
    .trim()
    .regex(KODE_RE, "Kode tamu tidak valid")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
export type RsvpInput = z.infer<typeof rsvpSchema>;

export const wishSchema = z.object({
  name: nameSchema,
  message: messageSchema({ min: 3, max: 500 }),
});
export type WishInput = z.infer<typeof wishSchema>;

/** Jumlah orang efektif: tidak hadir → 0; hadir → min 1; dibatasi maxPax. */
export function effectivePax(status: RsvpStatus, pax: number, maxPax: number): number {
  if (status === "TIDAK_HADIR") return 0;
  return Math.min(Math.max(pax, 1), maxPax);
}

const LINK_RE =
  /(https?:\/\/|www\.|\b[a-z0-9-]+\.(?:com|net|org|id|co|io|xyz|info|ru|cn|tk|ml|ga|cf|gq)\b)/i;

/** Heuristik spam sederhana: mengandung tautan/domain → perlu ditinjau dulu. */
export function looksLikeSpam(message: string): boolean {
  return LINK_RE.test(message);
}

/**
 * Apakah ucapan langsung tampil? Tidak tampil bila moderasi aktif (env WISH_MODERATION=on)
 * atau terindikasi spam; ucapan disembunyikan itu menunggu persetujuan admin (U7).
 */
export function wishVisibility(message: string, moderationOn: boolean): boolean {
  return !moderationOn && !looksLikeSpam(message);
}

export function moderationEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.WISH_MODERATION?.toLowerCase() === "on";
}
