/** Konfigurasi PPDB (FIKTIF). Ubah sesuai sekolah Anda. */
export const ppdb = {
  /** false → formulir ditutup (halaman info tetap tampil). */
  dibuka: true,
  tahunAjaran: "2027/2028",
  judul: "Penerimaan Peserta Didik Baru",
  pengantar:
    "Daftar online dalam empat langkah. Simpan nomor pendaftaran dan token akses Anda — keduanya diperlukan untuk memeriksa status pendaftaran.",
  jenjang: ["SMP Kelas 7", "SMA Kelas 10"],
  gelombang: [
    { nama: "Gelombang 1", periode: "1 Januari – 28 Februari 2027" },
    { nama: "Gelombang 2", periode: "1 Maret – 30 April 2027" },
  ],
  alur: [
    "Isi formulir pendaftaran online dan unggah dokumen.",
    "Simpan nomor pendaftaran & token akses yang ditampilkan.",
    "Panitia meninjau berkas; pantau status di halaman Cek Status.",
    "Peserta yang lolos berkas mengikuti tes dan wawancara.",
  ],
  /** Dokumen yang diunggah. `wajib` = harus ada. Format: PDF, PNG, JPG, atau WebP; maks. 2 MB per berkas. */
  dokumen: [
    { kind: "akta", label: "Akta kelahiran", wajib: true },
    { kind: "kk", label: "Kartu keluarga", wajib: true },
    { kind: "rapor", label: "Rapor / ijazah terakhir", wajib: true },
    { kind: "foto", label: "Pas foto 3×4", wajib: false },
  ],
} as const;

export type DokumenKind = (typeof ppdb.dokumen)[number]["kind"];
export const DOKUMEN_KINDS = ppdb.dokumen.map((d) => d.kind) as DokumenKind[];
export const labelDokumen = (kind: string) =>
  ppdb.dokumen.find((d) => d.kind === kind)?.label ?? kind;
