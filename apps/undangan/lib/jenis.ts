/** Konfigurasi per jenis acara: judul, sesi, apakah ada mempelai kedua / kisah cinta. */
export const JENIS_LIST = ["pernikahan", "aqiqah", "khitan"] as const;
export type Jenis = (typeof JENIS_LIST)[number];
export const JENIS_DEFAULT: Jenis = "pernikahan";

export type SesiKey = "akad" | "resepsi";

export type JenisConfig = {
  /** Judul di sampul, mis. "Undangan Pernikahan" */
  judul: string;
  /** Sesi yang tampil (1 atau 2). `key` memetakan ke kolom waktu/lokasi di Event. */
  sesi: Array<{ key: SesiKey; nama: string }>;
  /** Judul bagian profil */
  profilJudul: string;
  /** Tampilkan mempelai kedua (brideName)? */
  duaOrang: boolean;
  /** Tampilkan timeline kisah cinta? */
  cerita: boolean;
  /** Judul bagian doa/ucapan pembuka pada kalender (.ics) */
  kataSifat: string;
};

export const JENIS: Record<Jenis, JenisConfig> = {
  pernikahan: {
    judul: "Undangan Pernikahan",
    sesi: [
      { key: "akad", nama: "Akad Nikah" },
      { key: "resepsi", nama: "Resepsi" },
    ],
    profilJudul: "Mempelai",
    duaOrang: true,
    cerita: true,
    kataSifat: "pernikahan",
  },
  aqiqah: {
    judul: "Undangan Aqiqah",
    sesi: [{ key: "akad", nama: "Acara Aqiqah" }],
    profilJudul: "Si Kecil",
    duaOrang: false,
    cerita: false,
    kataSifat: "aqiqah",
  },
  khitan: {
    judul: "Undangan Khitanan",
    sesi: [{ key: "akad", nama: "Acara Khitanan" }],
    profilJudul: "Yang Dikhitan",
    duaOrang: false,
    cerita: false,
    kataSifat: "khitanan",
  },
};

export function resolveJenis(value: string | null | undefined): Jenis {
  const v = value?.trim().toLowerCase();
  return (JENIS_LIST as readonly string[]).includes(v ?? "") ? (v as Jenis) : JENIS_DEFAULT;
}

const depan = (nama: string) => nama.trim().split(/\s+/)[0] ?? nama;

/** Nama di sampul/judul: "Raka & Anisa" (pernikahan) atau nama anak (aqiqah/khitan). */
export function namaAcara(jenis: Jenis, ev: { groomName: string; brideName: string }): string {
  return JENIS[jenis].duaOrang
    ? `${depan(ev.groomName)} & ${depan(ev.brideName)}`
    : depan(ev.groomName);
}
