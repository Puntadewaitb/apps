/** Konfigurasi donasi/infaq (FIKTIF). Ganti rekening dengan milik yayasan Anda. */
export const donasi = {
  judul: "Donasi & Infaq",
  pengantar:
    "Bantu program pendidikan sekolah kami. Transfer ke rekening resmi di bawah, lalu kirim konfirmasi beserta bukti transfer agar donasi Anda dapat diverifikasi.",
  rekening: [
    {
      bank: "Bank Nusantara Syariah",
      nomor: "7000 1234 5678",
      atasNama: "Yayasan Cendekia Nusantara",
    },
    {
      bank: "Bank Mandiri Contoh",
      nomor: "137 00 9876543 2",
      atasNama: "Yayasan Cendekia Nusantara",
    },
  ],
  catatan: "Rekening dan nama yayasan di atas fiktif untuk demo template.",
  minimal: 10_000,
  maksimal: 1_000_000_000,
} as const;
