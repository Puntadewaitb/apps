/**
 * Parse nominal rupiah yang diketik admin: "50000", "50.000", "Rp 1.500.000". Hanya bilangan bulat; menolak desimal
 * (koma), huruf/satuan ("1,5 juta"), negatif, dan di luar batas. Hasil: angka atau pesan galat.
 */
export function parseRupiah(
  teks: string,
  min = 1,
  maks = 100_000_000,
): { ok: true; nilai: number } | { ok: false; pesan: string } {
  const s = teks.trim().replace(/^rp\.?\s*/i, "");
  if (!s) return { ok: false, pesan: "Nominal wajib diisi." };
  if (!/^\d{1,3}(?:[. ]\d{3})+$/.test(s) && !/^\d+$/.test(s))
    return { ok: false, pesan: "Hanya angka bulat rupiah, mis. 50000 atau 50.000." };
  const n = Number(s.replace(/[. ]/g, ""));
  if (!Number.isSafeInteger(n)) return { ok: false, pesan: "Nominal tidak valid." };
  if (n < min) return { ok: false, pesan: `Minimal Rp ${min.toLocaleString("id-ID")}.` };
  if (n > maks) return { ok: false, pesan: `Maksimal Rp ${maks.toLocaleString("id-ID")}.` };
  return { ok: true, nilai: n };
}
