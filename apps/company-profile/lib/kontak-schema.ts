import { emailSchema, messageSchema, nameSchema, phoneIdSchema } from "@tpl/core";
import { z } from "zod";
import { konten } from "../content/id";
import { fmt, type Lang } from "./i18n";
import { getUi } from "./konten";

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

type Issue = {
  path: PropertyKey[];
  message: string;
  code?: string;
  maximum?: unknown;
  minimum?: unknown;
};

/** Pesan galat per field; untuk "id" memakai pesan asli skema, untuk bahasa lain dipetakan dari kode isu. */
function pesanLokal(i: Issue, lang: Lang): string {
  if (lang === "id") return i.message;
  const g = getUi(lang).galat;
  const f = String(i.path[0] ?? "form");
  const kecil = i.code === "too_small";
  const besar = i.code === "too_big";
  switch (f) {
    case "nama":
      return kecil ? g.namaMin : besar ? g.namaMaks : g.namaFormat;
    case "email":
      return besar ? g.emailPanjang : g.emailTidakValid;
    case "telepon":
      return g.telepon;
    case "layanan":
      return g.layanan;
    case "isi":
      return besar
        ? fmt(g.pesanMaks, { n: String(i.maximum ?? 2000) })
        : fmt(g.pesanMin, { n: String(i.minimum ?? 10) });
    default:
      return g.dataTidakValid;
  }
}

export function fieldErrors(error: { issues: Issue[] }, lang: Lang = "id"): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0] ?? "form")] ??= pesanLokal(i, lang);
  return out;
}
