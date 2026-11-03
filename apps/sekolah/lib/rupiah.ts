import { donasi } from "../content/donasi";

/**
 * Parse nominal yang diketik donatur: "150000", "150.000", "Rp 1.500.000", "1 500 000". Hanya bilangan bulat rupiah.
 * Menolak desimal, huruf/satuan ("1,5 juta"), negatif, dan di luar batas min/maks. Hasil: angka atau pesan galat.
 */
export function parseRupiah(
  teks: string,
  min: number = donasi.minimal,
  maks: number = donasi.maksimal,
): { ok: true; nilai: number } | { ok: false; pesan: string } {
  const s = teks.trim().replace(/^rp\.?\s*/i, "");
  if (!s) return { ok: false, pesan: "Nominal wajib diisi." };
  // hanya digit dengan pemisah ribuan titik/spasi (koma = desimal → ditolak)
  if (!/^\d{1,3}(?:[. ]\d{3})+$/.test(s) && !/^\d+$/.test(s))
    return {
      ok: false,
      pesan: "Nominal hanya berisi angka bulat rupiah, mis. 150000 atau 150.000.",
    };
  const n = Number(s.replace(/[. ]/g, ""));
  if (!Number.isSafeInteger(n)) return { ok: false, pesan: "Nominal tidak valid." };
  if (n < min) return { ok: false, pesan: `Nominal minimal Rp ${min.toLocaleString("id-ID")}.` };
  if (n > maks) return { ok: false, pesan: `Nominal maksimal Rp ${maks.toLocaleString("id-ID")}.` };
  return { ok: true, nilai: n };
}

/** Persen terkumpul (bilangan bulat, dipotong ke bawah; tidak dibatasi 100 agar kelebihan tetap terlihat). */
export function persen(terkumpul: number, target: number): number {
  if (!(target > 0) || !(terkumpul > 0)) return 0;
  return Math.floor((terkumpul / target) * 100);
}
