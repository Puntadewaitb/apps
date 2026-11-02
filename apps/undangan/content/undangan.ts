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
};
