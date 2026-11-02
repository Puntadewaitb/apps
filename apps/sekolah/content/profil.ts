/** Konten halaman Profil (FIKTIF). Struktur divalidasi oleh lib/konten-schema.ts (unit test). */
export const profil = {
  judul: "Profil Sekolah",
  pengantar:
    "Mengenal sejarah, visi dan misi, serta susunan organisasi Sekolah Cendekia Nusantara.",
  sambutan: {
    judul: "Sambutan Kepala Sekolah",
    nama: "Dr. Siti Rahmawati, M.Pd.",
    jabatan: "Kepala Sekolah",
    foto: "/img/guru-1.svg",
    paragraf: [
      "Assalamu'alaikum warahmatullahi wabarakatuh. Selamat datang di Sekolah Cendekia Nusantara.",
      "Kami percaya setiap anak memiliki potensi unik. Tugas sekolah adalah menyediakan lingkungan yang aman, teladan yang baik, dan kesempatan belajar yang bermakna agar potensi itu tumbuh.",
      "Terima kasih atas kepercayaan orang tua. Mari bersama-sama mendidik generasi yang berilmu, berakhlak, dan peduli.",
    ],
  },
  sejarah: {
    judul: "Sejarah Singkat",
    peristiwa: [
      {
        tahun: "2005",
        judul: "Pendirian",
        teks: "Sekolah didirikan oleh yayasan dengan 3 rombongan belajar dan 90 siswa angkatan pertama.",
      },
      {
        tahun: "2010",
        judul: "Gedung Baru",
        teks: "Peresmian gedung A dan laboratorium sains; jumlah siswa melampaui 400.",
      },
      {
        tahun: "2015",
        judul: "Akreditasi A",
        teks: "Memperoleh akreditasi A dari badan akreditasi nasional.",
      },
      {
        tahun: "2020",
        judul: "Belajar Daring",
        teks: "Mengembangkan pembelajaran daring dan perpustakaan digital selama masa pembatasan kegiatan.",
      },
      {
        tahun: "2024",
        judul: "Program Unggulan",
        teks: "Meluncurkan program Sains & Teknologi serta Tahfiz sebagai program unggulan.",
      },
    ],
  },
  visiMisi: {
    judul: "Visi & Misi",
    visi: "Menjadi sekolah yang melahirkan lulusan berilmu, berakhlak mulia, mandiri, dan peduli terhadap sesama dan lingkungan.",
    misi: [
      "Menyelenggarakan pembelajaran yang aktif, kreatif, dan menyenangkan.",
      "Menanamkan nilai keimanan, kejujuran, dan tanggung jawab dalam keseharian.",
      "Mengembangkan minat dan bakat melalui kegiatan ekstrakurikuler yang beragam.",
      "Membangun kemitraan yang erat dengan orang tua dan masyarakat.",
      "Menjaga lingkungan sekolah yang aman, bersih, dan ramah anak.",
    ],
  },
  struktur: {
    judul: "Struktur Organisasi",
    // Hierarki sederhana: tiap node bisa punya anak. Nama fiktif.
    akar: {
      jabatan: "Ketua Yayasan",
      nama: "H. Abdul Karim, S.E.",
      anak: [
        {
          jabatan: "Kepala Sekolah",
          nama: "Dr. Siti Rahmawati, M.Pd.",
          anak: [
            { jabatan: "Wakil Kepala Bidang Kurikulum", nama: "Budi Hartono, S.Pd.", anak: [] },
            { jabatan: "Wakil Kepala Bidang Kesiswaan", nama: "Rina Marlina, S.S.", anak: [] },
            { jabatan: "Wakil Kepala Bidang Sarana", nama: "Hendra Gunawan, S.Kom.", anak: [] },
            { jabatan: "Kepala Tata Usaha", nama: "Yulia Safitri, S.E.", anak: [] },
          ],
        },
        { jabatan: "Bendahara Yayasan", nama: "Ir. Mulyadi", anak: [] },
      ],
    },
  },
  lokasi: {
    judul: "Lokasi",
    mapsUrl: "https://www.google.com/maps?q=Sleman+Yogyakarta&output=embed",
  },
};

export type NodeStruktur = { jabatan: string; nama: string; anak: NodeStruktur[] };
