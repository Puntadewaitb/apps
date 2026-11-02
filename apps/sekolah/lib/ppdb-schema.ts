import { emailSchema, nameSchema, phoneIdSchema, sanitizeText } from "@tpl/core";
import { z } from "zod";
import { ppdb } from "../content/ppdb";
import { GENDERS } from "./domain";

const teks = (min: number, max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2 }))
    .pipe(
      z
        .string()
        .min(min, `${label} minimal ${min} karakter.`)
        .max(max, `${label} maksimal ${max} karakter.`),
    );

const opsional = (max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2 }))
    .pipe(z.string().max(max, `${label} maksimal ${max} karakter.`));

const DAY = 86_400_000;
const TAHUN = 365.25 * DAY;

/** Tanggal lahir "YYYY-MM-DD" yang nyata dan usianya 3–25 tahun terhadap `sekarang`. */
export function tanggalLahir(sekarang: () => number = Date.now) {
  return z.string().transform((v, ctx) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
    const d = m ? new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!)) : null;
    if (
      !m ||
      !d ||
      d.getUTCFullYear() !== +m[1]! ||
      d.getUTCMonth() !== +m[2]! - 1 ||
      d.getUTCDate() !== +m[3]!
    ) {
      ctx.addIssue({ code: "custom", message: "Tanggal lahir tidak valid." });
      return z.NEVER;
    }
    const umur = (sekarang() - d.getTime()) / TAHUN;
    if (umur < 3 || umur > 25) {
      ctx.addIssue({
        code: "custom",
        message: "Usia calon peserta didik harus antara 3 dan 25 tahun.",
      });
      return z.NEVER;
    }
    return d;
  });
}

export const pendaftaranSchema = z.object({
  studentName: nameSchema,
  birthPlace: teks(2, 60, "Tempat lahir"),
  birthDate: tanggalLahir(),
  gender: z.enum(GENDERS, "Pilih jenis kelamin."),
  previousSchool: opsional(100, "Asal sekolah"),
  address: teks(10, 300, "Alamat"),
  targetGrade: z.enum(ppdb.jenjang, "Pilih jenjang tujuan."),
  parentName: nameSchema,
  parentPhone: phoneIdSchema,
  parentEmail: z
    .string()
    .trim()
    .pipe(z.union([z.literal(""), emailSchema])),
  parentJob: opsional(60, "Pekerjaan"),
});

export type Pendaftaran = z.infer<typeof pendaftaranSchema>;
