/**
 * Konten statis undangan (galeri, cerita, video). Data acara (nama, tanggal, lokasi) ada di database.
 * Semua nama/cerita di bawah FIKTIF — ganti dengan milik Anda.
 */
export const undangan = {
  galeri: {
    judul: "Galeri",
    subjudul: "Potret kebersamaan kami.",
    // Placeholder SVG di public/img/. Ganti dengan foto Anda (WebP/JPEG, lebar maks ±1600 px).
    foto: [1, 2, 3, 4, 5, 6].map((n) => ({
      src: `/img/galeri-${n}.svg`,
      alt: `Foto galeri ${n}`,
    })),
  },
  cerita: {
    judul: "Kisah Kami",
    subjudul: "Perjalanan dari bertemu hingga hari ini.",
    peristiwa: [
      {
        waktu: "2019",
        judul: "Pertama Bertemu",
        teks: "Kami berkenalan di sebuah kegiatan kampus. Obrolan singkat tentang kopi dan buku menjadi awal segalanya.",
      },
      {
        waktu: "2021",
        judul: "Mulai Dekat",
        teks: "Jarak dan kesibukan tidak menghalangi. Kami saling menguatkan melewati masa-masa sulit dan belajar saling memahami.",
      },
      {
        waktu: "2024",
        judul: "Lamaran",
        teks: "Di hadapan keluarga tercinta, Raka menyampaikan niat baiknya dan Anisa menerimanya dengan bahagia.",
      },
      {
        waktu: "2027",
        judul: "Hari Bahagia",
        teks: "Dengan restu orang tua dan doa sahabat, kami melangkah ke jenjang pernikahan.",
      },
    ],
  },
  /**
   * Video opsional (mis. video prewedding). Isi URL/ID YouTube untuk menampilkan; kosongkan untuk menyembunyikan.
   * Saat diisi, CSP otomatis mengizinkan frame dari youtube-nocookie.com (lihat next.config.ts).
   */
  video: {
    judul: "Video Kami",
    youtube: "",
  },
  /**
   * Amplop digital. SEMUA data di bawah FIKTIF (nama bank/e-wallet, nomor, atas nama).
   * Ganti dengan data asli sebelum dipakai; hapus blok yang tidak diperlukan.
   */
  amplop: {
    judul: "Amplop Digital",
    subjudul:
      "Doa restu Anda adalah hadiah terbaik. Namun jika ingin memberikan tanda kasih, kami menyediakan beberapa cara berikut.",
    rekening: [
      {
        id: "bank",
        jenis: "Bank",
        nama: "Bank Nusantara (contoh)",
        nomor: "1234567890",
        atasNama: "Raka Pratama",
      },
      {
        id: "ewallet",
        jenis: "E-Wallet",
        nama: "DompetKu (contoh)",
        nomor: "081234567890",
        atasNama: "Anisa Putri",
      },
    ],
    qris: {
      src: "/img/qris-placeholder.svg",
      alt: "Contoh kode QR (placeholder, bukan QRIS asli)",
      catatan: "Pindai dengan aplikasi pembayaran Anda. Gambar ini hanya placeholder.",
    },
    hadiah: {
      judul: "Kirim Hadiah",
      penerima: "Raka & Anisa",
      alamat: "Jl. Melati Raya No. 12, Yogyakarta 55281 (alamat fiktif untuk demo)",
      telepon: "081234567890",
    },
  },
};
