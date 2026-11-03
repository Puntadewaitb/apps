/**
 * Penjaga kirim-ganda (klik dua kali / jaringan mengulang): permintaan dengan KUNCI yang sama dalam jendela TTL
 * mendapat hasil yang sama dan fungsi hanya dijalankan SEKALI — termasuk bila datang bersamaan (promise dipakai bersama).
 * In-memory per proses (cukup untuk 1 instance; multi-instance → simpan kunci di DB/Redis).
 */
const TTL = 15 * 60_000;
const MAKS = 2000;
const g = globalThis as unknown as {
  __idem?: Map<string, { at: number; hasil: Promise<unknown> }>;
};

export async function sekali<T>(
  kunci: string,
  fn: () => Promise<T>,
  opsi: { simpanBila?: (hasil: T) => boolean; now?: number } = {},
): Promise<T> {
  const now = opsi.now ?? Date.now();
  const peta = (g.__idem ??= new Map());
  if (peta.size >= MAKS) {
    for (const [k, v] of peta) if (now - v.at > TTL) peta.delete(k);
    while (peta.size >= MAKS) peta.delete(peta.keys().next().value!);
  }
  const ada = peta.get(kunci);
  if (ada && now - ada.at <= TTL) return ada.hasil as Promise<T>;
  const hasil = fn();
  peta.set(kunci, { at: now, hasil });
  // Hasil yang GAGAL (exception) atau tidak memenuhi `simpanBila` (mis. pesanan ditolak karena stok) tidak disimpan
  // → klien boleh memperbaiki isian dan mengirim ulang dengan kunci yang sama.
  const lepas = () => {
    if (peta.get(kunci)?.hasil === hasil) peta.delete(kunci);
  };
  hasil.then((h) => opsi.simpanBila && !opsi.simpanBila(h) && lepas(), lepas);
  return hasil;
}
