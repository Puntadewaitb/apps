import { hariWib } from "./format";

/** Parameter ?bulan=YYYY-MM yang valid; selain itu → null (tampilkan bulan ini). */
export function parseBulan(
  v: string | string[] | undefined,
): { tahun: number; bulan: number } | null {
  const s = Array.isArray(v) ? v[0] : v;
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(s ?? "");
  if (!m) return null;
  const tahun = Number(m[1]);
  if (tahun < 2000 || tahun > 2100) return null;
  return { tahun, bulan: Number(m[2]) };
}

export const kunciBulan = (tahun: number, bulan: number) =>
  `${tahun}-${String(bulan).padStart(2, "0")}`;

/** Bulan sebelum/sesudah (bulan 1–12). */
export function geserBulan(tahun: number, bulan: number, delta: number) {
  const idx = tahun * 12 + (bulan - 1) + delta;
  return { tahun: Math.floor(idx / 12), bulan: (idx % 12) + 1 };
}

export type Sel = { tanggal: string; hari: number; diBulanIni: boolean };

/** Grid kalender bulan (minggu mulai Senin), tiap minggu 7 sel. Murni (tanpa zona waktu). */
export function gridBulan(tahun: number, bulan: number): Sel[][] {
  const pertama = new Date(Date.UTC(tahun, bulan - 1, 1));
  const geser = (pertama.getUTCDay() + 6) % 7; // Senin = 0
  const jumlahHari = new Date(Date.UTC(tahun, bulan, 0)).getUTCDate();
  const total = Math.ceil((geser + jumlahHari) / 7) * 7;
  const sel: Sel[] = [];
  for (let i = 0; i < total; i++) {
    const d = new Date(Date.UTC(tahun, bulan - 1, 1 - geser + i));
    sel.push({
      tanggal: d.toISOString().slice(0, 10),
      hari: d.getUTCDate(),
      diBulanIni: d.getUTCMonth() === bulan - 1,
    });
  }
  return Array.from({ length: total / 7 }, (_, w) => sel.slice(w * 7, w * 7 + 7));
}

export type AgendaItem = { id: number; startsAt: Date; endsAt: Date | null };

/** Daftar tanggal WIB yang dilewati kegiatan (inklusif), maksimal 62 hari untuk keamanan. */
export function hariKegiatan(a: AgendaItem): string[] {
  const awal = hariWib(a.startsAt);
  const akhir = a.endsAt && a.endsAt >= a.startsAt ? hariWib(a.endsAt) : awal;
  const out: string[] = [];
  const cur = new Date(`${awal}T00:00:00Z`);
  const end = new Date(`${akhir}T00:00:00Z`);
  while (cur <= end && out.length < 62) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/** Peta tanggal → id kegiatan pada hari itu. */
export function petaPerHari(items: AgendaItem[]): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const a of items) for (const h of hariKegiatan(a)) m.set(h, [...(m.get(h) ?? []), a.id]);
  return m;
}

/** Rentang UTC [mulai, akhir) yang mencakup seluruh bulan WIB tsb (dipakai untuk query DB). */
export function rentangBulanWib(tahun: number, bulan: number): { mulai: Date; akhir: Date } {
  const wib = 7 * 3_600_000;
  return {
    mulai: new Date(Date.UTC(tahun, bulan - 1, 1) - wib),
    akhir: new Date(Date.UTC(tahun, bulan, 1) - wib),
  };
}
