import { sanitizeText } from "@tpl/core";
import { z } from "zod";
import { parseRupiah } from "./rupiah";

/** Path gambar yang boleh disimpan di DB: aset demo /img/… atau hasil unggahan /uploads/… */
export const PATH_GAMBAR =
  /^\/(?:img\/[\w.-]+\.(?:svg|png|jpe?g|webp)|uploads\/[A-Za-z0-9_-]{16,64}\.(?:png|jpg|webp))$/;

export const teks = (min: number, max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2 }))
    .pipe(
      z
        .string()
        .min(min, `${label} minimal ${min} karakter.`)
        .max(max, `${label} maksimal ${max} karakter.`),
    );

export const opsional = (max: number, label: string) =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max * 2, multiline: true }))
    .pipe(z.string().max(max, `${label} maksimal ${max} karakter.`));

export const centang = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

export const rupiah = (label: string, min = 1, maks = 100_000_000) =>
  z.string().transform((v, ctx) => {
    const r = parseRupiah(v, min, maks);
    if (!r.ok) ctx.addIssue({ code: "custom", message: `${label}: ${r.pesan}` });
    return r.ok ? r.nilai : 0;
  });

export const rupiahOpsional = (label: string, min = 1, maks = 100_000_000) =>
  z.string().transform((v, ctx) => {
    if (!v.trim()) return null;
    const r = parseRupiah(v, min, maks);
    if (!r.ok) ctx.addIssue({ code: "custom", message: `${label}: ${r.pesan}` });
    return r.ok ? r.nilai : null;
  });

export const bulat = (label: string, min: number, maks: number) =>
  z
    .string()
    .regex(/^-?\d{1,9}$/, `${label} harus bilangan bulat.`)
    .transform(Number)
    .pipe(z.number().min(min, `${label} minimal ${min}.`).max(maks, `${label} maksimal ${maks}.`));

export const kategoriSchema = z.object({
  name: teks(2, 60, "Nama"),
  sort: bulat("Urutan", 0, 9999),
});

export const SKU = /^[A-Z0-9][A-Z0-9._-]{1,39}$/;
export const MAKS_VARIAN = 20;
export const MAKS_GALERI = 8;
export const MAKS_STOK = 1_000_000;

const varianSchema = z.object({
  id: z.number().int().positive().optional(),
  name: teks(1, 60, "Nama varian"),
  sku: z
    .string()
    .transform((v) => v.trim().toUpperCase())
    .pipe(
      z.string().regex(SKU, "SKU 2–40 karakter: huruf besar, angka, titik, strip, garis bawah."),
    ),
  price: rupiahOpsional("Harga varian"),
  stock: bulat("Stok", 0, MAKS_STOK),
  active: z.boolean(),
});
export type VarianInput = z.infer<typeof varianSchema>;

export const produkSchema = z.object({
  name: teks(3, 120, "Nama produk"),
  categoryId: z
    .string()
    .regex(/^\d{1,9}$/, "Pilih kategori.")
    .transform(Number),
  description: z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: 4000, multiline: true }))
    .pipe(
      z
        .string()
        .min(10, "Deskripsi minimal 10 karakter.")
        .max(2000, "Deskripsi maksimal 2000 karakter."),
    ),
  price: rupiah("Harga"),
  active: centang,
});

/** Baca varian dari field berindeks v{i}_* (jumlah dari v_count). Mengembalikan daftar + peta galat per-field. */
export function bacaVarian(f: Record<string, string>): {
  varian: VarianInput[];
  errors: Record<string, string>;
} {
  const errors: Record<string, string> = {};
  const n = /^\d{1,2}$/.test(f.v_count ?? "") ? Number(f.v_count) : 0;
  if (n < 1) errors.varian = "Minimal satu varian.";
  if (n > MAKS_VARIAN) errors.varian = `Maksimal ${MAKS_VARIAN} varian.`;
  const varian: VarianInput[] = [];
  const sku = new Set<string>();
  if (!errors.varian)
    for (let i = 0; i < n; i++) {
      const idRaw = f[`v${i}_id`] ?? "";
      const r = varianSchema.safeParse({
        id: /^\d{1,9}$/.test(idRaw) ? Number(idRaw) : undefined,
        name: f[`v${i}_name`] ?? "",
        sku: f[`v${i}_sku`] ?? "",
        price: f[`v${i}_price`] ?? "",
        stock: f[`v${i}_stock`] ?? "0",
        active: f[`v${i}_active`] === "on",
      });
      if (!r.success) {
        for (const is of r.error.issues)
          errors[`v${i}_${String(is.path[0] ?? "name")}`] ??= is.message;
        continue;
      }
      if (sku.has(r.data.sku)) errors[`v${i}_sku`] = "SKU dipakai dua varian dalam produk ini.";
      sku.add(r.data.sku);
      varian.push(r.data);
    }
  return { varian, errors };
}

/** FormData → objek string (File diabaikan) untuk divalidasi zod. */
export function dariForm(fd: FormData): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of fd.entries())
    if (typeof v === "string" && !k.startsWith("$ACTION")) o[k] = v;
  return o;
}

export type FormState = {
  ok?: boolean;
  pesan?: string;
  errors?: Record<string, string>;
  /** Isian yang dikirim, dikembalikan saat gagal (React 19 mereset field tak terkontrol setelah action). */
  values?: Record<string, string>;
};

export function galatZod(
  error: { issues: Array<{ path: PropertyKey[]; message: string }> },
  values?: Record<string, string>,
): FormState {
  const errors: Record<string, string> = {};
  for (const i of error.issues) errors[String(i.path[0] ?? "form")] ??= i.message;
  return { ok: false, errors, pesan: "Periksa kembali isian Anda.", values };
}

export function pembacaForm(s: FormState) {
  return {
    v: (k: string, awal: string) => (s.values ? (s.values[k] ?? "") : awal),
    c: (k: string, awal: boolean) => (s.values ? s.values[k] === "on" : awal),
  };
}
