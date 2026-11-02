import { emailSchema, messageSchema, nameSchema, phoneIdSchema } from "@tpl/core";
import { z } from "zod";
import { konten } from "../content/id";

const slugLayanan = konten.layanan.map((l) => l.slug);

export const kontakSchema = z.object({
  nama: nameSchema,
  email: emailSchema,
  /** Opsional: kosong atau nomor HP Indonesia (dinormalkan ke 62…) */
  telepon: z
    .string()
    .trim()
    .transform((v) => v)
    .pipe(z.union([z.literal(""), phoneIdSchema]))
    .default(""),
  /** Opsional: slug layanan yang diminati */
  layanan: z
    .string()
    .trim()
    .refine((v) => v === "" || slugLayanan.includes(v), "Layanan tidak dikenal")
    .default(""),
  isi: messageSchema({ min: 10, max: 2000 }),
});

export type KontakInput = z.infer<typeof kontakSchema>;

export function fieldErrors(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= i.message;
  return out;
}
