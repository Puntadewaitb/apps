/** Program akademik & ekstrakurikuler (FIKTIF). */
export const program = {
  judul: "Program & Ekstrakurikuler",
  pengantar:
    "Kurikulum nasional yang diperkaya program unggulan dan kegiatan pengembangan diri sesuai minat siswa.",
  akademik: {
    judul: "Program Akademik",
    daftar: [
      {
        id: "sains",
        ikon: "🔬",
        nama: "Sains & Teknologi",
        ringkas: "Praktikum rutin, klub riset, dan pembinaan olimpiade sains.",
        butir: ["Laboratorium IPA & komputer", "Pembinaan olimpiade", "Proyek riset siswa"],
      },
      {
        id: "tahfiz",
        ikon: "📖",
        nama: "Tahfiz & Literasi Al-Qur'an",
        ringkas: "Pembiasaan membaca dan menghafal Al-Qur'an dengan target bertahap.",
        butir: ["Halaqah pagi", "Target hafalan per semester", "Munaqasyah tahunan"],
      },
      {
        id: "bahasa",
        ikon: "🌍",
        nama: "Bahasa & Literasi",
        ringkas: "Penguatan bahasa Indonesia, Inggris, dan Arab serta budaya baca.",
        butir: ["Kelas percakapan", "Perpustakaan digital", "Jurnalistik sekolah"],
      },
      {
        id: "karakter",
        ikon: "🤝",
        nama: "Pendidikan Karakter",
        ringkas: "Pembinaan akhlak, kepemimpinan, dan kepedulian sosial.",
        butir: ["Mentoring wali asuh", "Bakti sosial", "Kepemimpinan OSIS"],
      },
    ],
  },
  ekstrakurikuler: {
    judul: "Ekstrakurikuler",
    subjudul: "Pilih kegiatan sesuai minat — setiap siswa mengikuti minimal satu.",
    kategori: [
      { id: "olahraga", nama: "Olahraga" },
      { id: "seni", nama: "Seni & Budaya" },
      { id: "sains", nama: "Sains & Teknologi" },
      { id: "organisasi", nama: "Organisasi" },
    ],
    daftar: [
      {
        id: "futsal",
        nama: "Futsal",
        kategori: "olahraga",
        jadwal: "Selasa & Kamis, 15.30–17.00",
        pembina: "Ahmad Fauzi, Lc.",
      },
      {
        id: "panahan",
        nama: "Panahan",
        kategori: "olahraga",
        jadwal: "Rabu, 15.30–17.00",
        pembina: "Pelatih tamu",
      },
      {
        id: "paduan-suara",
        nama: "Paduan Suara",
        kategori: "seni",
        jadwal: "Senin, 15.30–17.00",
        pembina: "Rina Marlina, S.S.",
      },
      {
        id: "teater",
        nama: "Teater",
        kategori: "seni",
        jadwal: "Jumat, 14.00–16.00",
        pembina: "Rina Marlina, S.S.",
      },
      {
        id: "robotika",
        nama: "Robotika",
        kategori: "sains",
        jadwal: "Rabu, 15.30–17.30",
        pembina: "Hendra Gunawan, S.Kom.",
      },
      {
        id: "klub-sains",
        nama: "Klub Sains & Kebun",
        kategori: "sains",
        jadwal: "Kamis, 15.30–17.00",
        pembina: "Dewi Anggraini, S.Si.",
      },
      {
        id: "pramuka",
        nama: "Pramuka",
        kategori: "organisasi",
        jadwal: "Jumat, 15.00–17.00",
        pembina: "Budi Hartono, S.Pd.",
      },
      {
        id: "jurnalistik",
        nama: "Jurnalistik",
        kategori: "organisasi",
        jadwal: "Selasa, 15.30–17.00",
        pembina: "Rina Marlina, S.S.",
      },
    ],
  },
};
