// OVERLAY sample statis: rentang bulan agenda yang dibuat sebagai halaman statis. Dihitung dari SATU waktu acuan
// (DEMO_BUILD_TIME, diset skrip build) agar halaman agenda & navigasi Kalender selalu sepakat.
import { kunciBulan } from "./agenda";

export const BULAN_SEBELUM = 6;
export const BULAN_SESUDAH = 12;

export function daftarBulan(): string[] {
  const acuan = new Date(process.env.DEMO_BUILD_TIME ?? Date.now());
  return Array.from({ length: BULAN_SEBELUM + BULAN_SESUDAH + 1 }, (_, i) => {
    const d = new Date(
      Date.UTC(acuan.getUTCFullYear(), acuan.getUTCMonth() + i - BULAN_SEBELUM, 1),
    );
    return kunciBulan(d.getUTCFullYear(), d.getUTCMonth() + 1);
  });
}

export const bulanTersedia = (tahun: number, bulan: number) =>
  daftarBulan().includes(kunciBulan(tahun, bulan));
