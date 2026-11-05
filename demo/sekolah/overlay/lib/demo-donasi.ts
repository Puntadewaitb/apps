// OVERLAY sample statis: pengganti server action kirimKonfirmasi — TIDAK ada server. Validasi memakai skema &
// pemeriksa berkas yang sama dengan versi lengkap; konfirmasi hanya dicatat di localStorage peramban ini.
import { HONEYPOT_FIELD, validateUpload } from "@tpl/core";
import type { HasilKonfirmasi } from "../app/(publik)/donasi/actions";
import { konfirmasiSchema } from "./donasi-schema";
import { dariForm, galatZod } from "./validasi";

const KEY = "demo:sekolah:donasi";
const PESAN_BERKAS: Record<string, string> = {
  empty: "Berkas kosong.",
  too_large: "Ukuran berkas maksimal 2 MB.",
  type_not_allowed: "Format berkas harus PDF, PNG, JPG, atau WebP.",
  type_mismatch: "Isi berkas tidak sesuai dengan tipe yang dinyatakan.",
};

export async function kirimKonfirmasiDemo(
  _prev: HasilKonfirmasi,
  fd: FormData,
): Promise<HasilKonfirmasi> {
  if (String(fd.get(HONEYPOT_FIELD) ?? "").trim() !== "") return { ok: true };
  const nilai = dariForm(fd);
  const p = konfirmasiSchema.safeParse(nilai);
  const galat: Record<string, string> = p.success ? {} : (galatZod(p.error).errors ?? {});

  const f = fd.get("bukti");
  if (f instanceof File && f.size > 0) {
    const cek = validateUpload(new Uint8Array(await f.arrayBuffer()), {
      maxBytes: 2 * 1024 * 1024,
      allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
      declaredType: f.type || undefined,
    });
    if (!cek.ok) galat.bukti = PESAN_BERKAS[cek.reason] ?? "Berkas tidak valid.";
  } else {
    galat.bukti = "Bukti transfer wajib diunggah.";
  }
  if (!p.success || Object.keys(galat).length > 0)
    return { ok: false, pesan: "Periksa kembali isian Anda.", errors: galat, values: nilai };

  try {
    const lama = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown[];
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        ...lama,
        {
          program: String(fd.get("program") ?? ""),
          nama: p.data.anonymous ? "Hamba Allah" : p.data.donorName,
          nominal: p.data.amount,
          waktu: new Date().toISOString(),
        },
      ]),
    );
  } catch {
    /* penyimpanan diblokir: tetap sukses (hanya simulasi) */
  }
  return { ok: true };
}
