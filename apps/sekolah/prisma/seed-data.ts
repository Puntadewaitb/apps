// Data demo FIKTIF. Murni data (tanpa Prisma) supaya bisa diimpor oleh seed (Node type stripping) dan oleh unit test.
// Hanya sintaks TypeScript yang bisa dihapus (tanpa enum/namespace).

const DAY = 86_400_000;
/** Tanggal demo relatif terhadap waktu seed, supaya data demo tidak pernah "basi". */
export const daysFromNow = (now: Date, days: number, hour = 8, minute = 0): Date => {
  const d = new Date(now.getTime() + days * DAY);
  // jam dinding WIB (UTC+7) pada tanggal tsb
  const wib = new Date(d.getTime() + 7 * 3_600_000);
  return new Date(
    Date.UTC(wib.getUTCFullYear(), wib.getUTCMonth(), wib.getUTCDate(), hour - 7, minute),
  );
};

export const DEMO_ADMIN_EMAIL = "admin@sekolah.example";

export const teachers = [
  {
    id: 1,
    name: "Dr. Siti Rahmawati, M.Pd.",
    position: "Kepala Sekolah",
    subject: "Manajemen Pendidikan",
    bio: "Memimpin sekolah sejak 2018; berfokus pada budaya literasi dan pembelajaran bermakna.",
    photo: "/img/guru-1.svg",
    sort: 1,
  },
  {
    id: 2,
    name: "Budi Hartono, S.Pd.",
    position: "Wakil Kepala Bidang Kurikulum",
    subject: "Matematika",
    bio: "Pengajar matematika dengan pengalaman 15 tahun dan pembina olimpiade sains.",
    photo: "/img/guru-2.svg",
    sort: 2,
  },
  {
    id: 3,
    name: "Rina Marlina, S.S.",
    position: "Guru",
    subject: "Bahasa Indonesia",
    bio: "Pembina jurnalistik sekolah dan penulis buku cerita anak.",
    photo: "/img/guru-3.svg",
    sort: 3,
  },
  {
    id: 4,
    name: "Ahmad Fauzi, Lc.",
    position: "Guru",
    subject: "Pendidikan Agama Islam",
    bio: "Mengampu tahfiz dan pembinaan karakter di asrama.",
    photo: "/img/guru-4.svg",
    sort: 4,
  },
  {
    id: 5,
    name: "Dewi Anggraini, S.Si.",
    position: "Guru",
    subject: "Biologi",
    bio: "Pembina klub sains dan kebun sekolah.",
    photo: "/img/guru-5.svg",
    sort: 5,
  },
  {
    id: 6,
    name: "Hendra Gunawan, S.Kom.",
    position: "Staf TI & Laboratorium Komputer",
    subject: "Informatika",
    bio: "Mengelola laboratorium komputer dan pembina klub robotika.",
    photo: "/img/guru-6.svg",
    sort: 6,
  },
];

export const users = [
  // Password TIDAK ada di sini: akun admin dibuat dari env ADMIN_PASSWORD (lihat seed.ts).
  { email: DEMO_ADMIN_EMAIL, name: "Admin Sekolah", role: "ADMIN" },
  { email: "editor@sekolah.example", name: "Editor Konten", role: "EDITOR" },
];

export const posts = [
  {
    slug: "penerimaan-peserta-didik-baru-2027",
    kind: "PENGUMUMAN",
    title: "Pendaftaran Peserta Didik Baru 2027/2028 Dibuka",
    excerpt:
      "Pendaftaran gelombang pertama dibuka mulai 1 Januari hingga 28 Februari 2027 secara online.",
    body: "Pendaftaran peserta didik baru (PPDB) tahun ajaran 2027/2028 resmi dibuka.\n\n## Jadwal\n\n- Gelombang 1: 1 Januari – 28 Februari 2027\n- Gelombang 2: 1 Maret – 30 April 2027\n\n## Persyaratan\n\n1. Mengisi formulir pendaftaran online\n2. Mengunggah akta kelahiran dan rapor terakhir\n3. Mengikuti tes seleksi dan wawancara\n\nInformasi lengkap tersedia di halaman PPDB.",
    image: "/img/berita-1.svg",
    daysAgo: 3,
  },
  {
    slug: "juara-olimpiade-sains-kabupaten",
    kind: "BERITA",
    title: "Tim Olimpiade Sains Raih Juara Umum Tingkat Kabupaten",
    excerpt: "Tiga siswa kami meraih medali emas pada bidang Matematika, Fisika, dan Biologi.",
    body: "Tim olimpiade sains Sekolah Cendekia Nusantara meraih **juara umum** pada Olimpiade Sains Tingkat Kabupaten 2026.\n\nTiga medali emas diraih pada bidang Matematika, Fisika, dan Biologi. Para pemenang akan mewakili kabupaten ke tingkat provinsi.\n\n> Kerja keras dan bimbingan guru adalah kunci keberhasilan kami.",
    image: "/img/berita-2.svg",
    daysAgo: 10,
  },
  {
    slug: "kegiatan-bakti-sosial-desa-binaan",
    kind: "BERITA",
    title: "Bakti Sosial di Desa Binaan: Berbagi dan Belajar",
    excerpt: "Seratus siswa kelas 8 mengikuti bakti sosial dan kelas inspirasi di desa binaan.",
    body: "Sebanyak 100 siswa kelas 8 mengikuti kegiatan bakti sosial di desa binaan sekolah.\n\nKegiatan meliputi:\n\n- Kerja bakti membersihkan sarana umum\n- Kelas inspirasi untuk anak-anak desa\n- Penyerahan paket buku dan alat tulis\n\nKegiatan ini menjadi bagian dari program pendidikan karakter.",
    image: "/img/berita-3.svg",
    daysAgo: 21,
  },
  {
    slug: "libur-semester-ganjil",
    kind: "PENGUMUMAN",
    title: "Jadwal Libur Semester Ganjil dan Pembagian Rapor",
    excerpt: "Libur semester ganjil dimulai 21 Desember 2026; pembagian rapor 19 Desember.",
    body: "Diberitahukan kepada seluruh orang tua/wali murid:\n\n- Pembagian rapor: **Sabtu, 19 Desember 2026**\n- Libur semester: 21 Desember 2026 – 3 Januari 2027\n- Masuk kembali: 4 Januari 2027\n\nTerima kasih atas perhatian dan kerja samanya.",
    image: "/img/berita-4.svg",
    daysAgo: 1,
  },
  {
    slug: "peluncuran-perpustakaan-digital",
    kind: "BERITA",
    title: "Peluncuran Perpustakaan Digital Sekolah",
    excerpt: "Siswa kini dapat mengakses ribuan buku elektronik dari rumah.",
    body: "Sekolah meluncurkan **perpustakaan digital** yang berisi lebih dari 3.000 judul buku elektronik.\n\nSiswa dapat masuk menggunakan akun sekolah. Pelatihan penggunaan diberikan pada pekan orientasi.",
    image: "/img/berita-5.svg",
    daysAgo: 45,
  },
  // Draf: tidak boleh tampil di publik (diuji)
  {
    slug: "draf-pengumuman-internal",
    kind: "PENGUMUMAN",
    title: "Draf: Pengumuman Rapat Internal Guru",
    excerpt: "Draf yang belum diterbitkan — tidak boleh terlihat di situs publik.",
    body: "Catatan internal. Belum diterbitkan.",
    image: "",
    daysAgo: null,
  },
];

export const agendas = [
  {
    id: 1,
    title: "Pembagian Rapor Semester Ganjil",
    description: "Pengambilan rapor oleh orang tua/wali di kelas masing-masing.",
    location: "Ruang kelas",
    startDay: 5,
    startHour: 8,
    endDay: 5,
    endHour: 12,
  },
  {
    id: 2,
    title: "Libur Semester Ganjil",
    description: "Libur semester; kegiatan belajar dimulai kembali setelah dua pekan.",
    location: "",
    startDay: 7,
    startHour: 0,
    endDay: 20,
    endHour: 23,
  },
  {
    id: 3,
    title: "Pembukaan PPDB Gelombang 1",
    description: "Pendaftaran online dibuka.",
    location: "Online",
    startDay: 14,
    startHour: 8,
    endDay: 60,
    endHour: 23,
  },
  {
    id: 4,
    title: "Pentas Seni & Bazar Tahunan",
    description: "Penampilan siswa dan bazar karya; terbuka untuk umum.",
    location: "Aula Utama",
    startDay: 30,
    startHour: 9,
    endDay: 30,
    endHour: 16,
  },
  {
    id: 5,
    title: "Tes Seleksi PPDB Gelombang 1",
    description: "Tes akademik dan wawancara calon peserta didik.",
    location: "Gedung A",
    startDay: 45,
    startHour: 8,
    endDay: 45,
    endHour: 13,
  },
  {
    id: 6,
    title: "Seminar Parenting",
    description: "Seminar bagi orang tua: mendampingi remaja di era digital.",
    location: "Aula Utama",
    startDay: 60,
    startHour: 9,
    endDay: null,
    endHour: null,
  },
];

export const galleries = [
  {
    slug: "pentas-seni-2026",
    title: "Pentas Seni 2026",
    description: "Dokumentasi pentas seni dan bazar tahunan.",
    cover: "/img/galeri-1.svg",
    images: [
      { src: "/img/galeri-1.svg", caption: "Pembukaan pentas seni" },
      { src: "/img/galeri-2.svg", caption: "Penampilan paduan suara" },
      { src: "/img/galeri-3.svg", caption: "Bazar karya siswa" },
    ],
  },
  {
    slug: "kegiatan-belajar",
    title: "Kegiatan Belajar",
    description: "Suasana belajar di kelas, laboratorium, dan perpustakaan.",
    cover: "/img/galeri-4.svg",
    images: [
      { src: "/img/galeri-4.svg", caption: "Praktikum di laboratorium sains" },
      { src: "/img/galeri-5.svg", caption: "Pojok baca perpustakaan" },
    ],
  },
  {
    slug: "bakti-sosial",
    title: "Bakti Sosial",
    description: "Kegiatan bakti sosial di desa binaan.",
    cover: "/img/galeri-6.svg",
    images: [
      { src: "/img/galeri-6.svg", caption: "Kerja bakti bersama warga" },
      { src: "/img/galeri-1.svg", caption: "Kelas inspirasi" },
    ],
  },
];

export const programs = [
  {
    slug: "beasiswa-siswa-berprestasi",
    title: "Beasiswa Siswa Berprestasi",
    description: "Membantu biaya pendidikan siswa berprestasi dari keluarga kurang mampu.",
    image: "/img/donasi-1.svg",
    target: 150_000_000,
    active: true,
    deadlineDays: 150,
  },
  {
    slug: "renovasi-musala",
    title: "Renovasi Musala Sekolah",
    description:
      "Perbaikan atap, lantai, dan tempat wudu musala yang digunakan seluruh warga sekolah.",
    image: "/img/donasi-2.svg",
    target: 75_000_000,
    active: true,
    deadlineDays: null,
  },
  {
    slug: "buku-perpustakaan",
    title: "Pengadaan Buku Perpustakaan",
    description: "Menambah koleksi buku bacaan untuk meningkatkan minat literasi siswa.",
    image: "/img/donasi-3.svg",
    target: 30_000_000,
    active: true,
    deadlineDays: 90,
  },
];

/** Donasi demo (nama fiktif). program = slug program. */
export const donations = [
  {
    program: "beasiswa-siswa-berprestasi",
    donorName: "Hamba Allah",
    anonymous: true,
    amount: 5_000_000,
    message: "Semoga bermanfaat.",
    status: "TERVERIFIKASI",
  },
  {
    program: "beasiswa-siswa-berprestasi",
    donorName: "Keluarga Bapak Hendra",
    anonymous: false,
    amount: 2_500_000,
    message: "",
    status: "TERVERIFIKASI",
  },
  {
    program: "beasiswa-siswa-berprestasi",
    donorName: "Alumni Angkatan 2010",
    anonymous: false,
    amount: 10_000_000,
    message: "Dari alumni untuk adik-adik.",
    status: "TERVERIFIKASI",
  },
  {
    program: "beasiswa-siswa-berprestasi",
    donorName: "Calon Donatur",
    anonymous: false,
    amount: 1_000_000,
    message: "",
    status: "MENUNGGU",
  },
  {
    program: "renovasi-musala",
    donorName: "Ibu Sari",
    anonymous: false,
    amount: 1_500_000,
    message: "Untuk musala.",
    status: "TERVERIFIKASI",
  },
  {
    program: "renovasi-musala",
    donorName: "Donatur Ditolak",
    anonymous: false,
    amount: 100_000,
    message: "",
    status: "DITOLAK",
  },
  {
    program: "buku-perpustakaan",
    donorName: "Komunitas Literasi",
    anonymous: false,
    amount: 3_000_000,
    message: "",
    status: "TERVERIFIKASI",
  },
];
