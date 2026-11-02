/** Layanan perusahaan (FIKTIF). Halaman detail dibuat otomatis dari `slug`. */
export const layanan = [
  {
    slug: "konsultasi-proses-bisnis",
    nama: "Konsultasi Proses Bisnis",
    ikon: "🧭",
    ringkas:
      "Petakan, sederhanakan, dan standarkan proses kerja agar lebih cepat dan minim kesalahan.",
    deskripsi: [
      "Banyak perusahaan tumbuh lebih cepat daripada prosesnya. Pekerjaan yang dulu cukup diingat di kepala kini melibatkan banyak orang dan sistem, sehingga muncul pekerjaan ganda, keterlambatan, dan kesalahan berulang.",
      "Tim konsultan kami memetakan proses yang berjalan sekarang, menemukan hambatan yang paling mahal, lalu merancang alur baru yang realistis untuk dijalankan tim Anda.",
    ],
    manfaat: [
      "Waktu penyelesaian pekerjaan lebih singkat",
      "Tanggung jawab tiap peran jelas",
      "Kesalahan dan pekerjaan ulang berkurang",
      "Dasar yang rapi sebelum digitalisasi",
    ],
    tahapan: [
      {
        judul: "Diagnosis",
        teks: "Wawancara dan observasi untuk memetakan proses saat ini (as-is).",
      },
      {
        judul: "Analisis",
        teks: "Mengukur hambatan, biaya, dan risiko untuk menentukan prioritas.",
      },
      {
        judul: "Perancangan",
        teks: "Menyusun proses target (to-be) beserta SOP dan indikator kinerja.",
      },
      {
        judul: "Pendampingan",
        teks: "Uji coba bersama tim dan penyesuaian hingga proses berjalan stabil.",
      },
    ],
    hasil: ["Peta proses (as-is & to-be)", "SOP siap pakai", "Dasbor indikator kinerja"],
    faq: [
      {
        id: "durasi",
        q: "Berapa lama proyek biasanya berjalan?",
        a: "Umumnya 6–12 minggu tergantung jumlah proses yang dibahas. Kami menyepakati ruang lingkup dan jadwal sebelum mulai.",
      },
      {
        id: "tim",
        q: "Apakah tim kami perlu meluangkan banyak waktu?",
        a: "Kami merancang sesi singkat dan terjadwal. Rata-rata 2–3 jam per minggu per perwakilan unit.",
      },
      {
        id: "lanjut",
        q: "Apakah bisa dilanjutkan ke pembuatan sistem?",
        a: "Bisa. Hasil analisis menjadi dasar kebutuhan sistem, sehingga transisi ke pengembangan lebih cepat dan tepat sasaran.",
      },
    ],
    terkait: ["pengembangan-sistem", "pelatihan-sdm"],
  },
  {
    slug: "pengembangan-sistem",
    nama: "Pengembangan Sistem Digital",
    ikon: "💻",
    ringkas:
      "Aplikasi web dan integrasi sistem yang dibangun sesuai proses bisnis Anda, bukan sebaliknya.",
    deskripsi: [
      "Kami membangun aplikasi internal, portal pelanggan, dan integrasi antar sistem yang sesuai dengan cara kerja perusahaan Anda — dibangun bertahap supaya manfaatnya terasa sejak rilis pertama.",
      "Kode dan dokumentasi menjadi milik Anda. Kami menggunakan teknologi umum sehingga mudah dirawat oleh tim internal maupun vendor lain.",
    ],
    manfaat: [
      "Rilis bertahap, manfaat cepat terasa",
      "Kode & dokumentasi menjadi milik klien",
      "Teknologi umum, mudah dirawat",
      "Keamanan dan pencadangan data sejak awal",
    ],
    tahapan: [
      {
        judul: "Penetapan kebutuhan",
        teks: "Menyepakati fitur prioritas dan ukuran keberhasilan.",
      },
      { judul: "Desain", teks: "Prototipe alur dan antarmuka yang diuji bersama pengguna." },
      { judul: "Pembangunan", teks: "Pengembangan per iterasi dua mingguan dengan demo rutin." },
      {
        judul: "Peluncuran & dukungan",
        teks: "Migrasi data, pelatihan pengguna, dan masa dukungan awal.",
      },
    ],
    hasil: [
      "Aplikasi siap produksi",
      "Dokumentasi teknis & panduan pengguna",
      "Pengujian dan skrip pencadangan",
    ],
    faq: [
      {
        id: "kepemilikan",
        q: "Siapa pemilik kode sumbernya?",
        a: "Anda. Seluruh kode, desain, dan dokumentasi diserahkan setelah proyek selesai.",
      },
      {
        id: "rawat",
        q: "Apakah ada layanan perawatan?",
        a: "Ada paket perawatan bulanan: perbaikan bug, pembaruan keamanan, dan penyesuaian kecil.",
      },
      {
        id: "integrasi",
        q: "Bisakah terhubung dengan sistem yang sudah ada?",
        a: "Bisa, selama sistem tersebut menyediakan API atau ekspor data. Kami menilai kelayakannya di tahap awal.",
      },
    ],
    terkait: ["konsultasi-proses-bisnis", "analitik-data"],
  },
  {
    slug: "analitik-data",
    nama: "Analitik & Dasbor Data",
    ikon: "📊",
    ringkas:
      "Gabungkan data dari berbagai sumber menjadi dasbor yang membantu pimpinan mengambil keputusan.",
    deskripsi: [
      "Data penjualan, keuangan, dan operasional sering tersebar di banyak berkas dan sistem. Kami merapikan sumbernya dan membangun dasbor yang menjawab pertanyaan yang benar-benar ditanyakan pimpinan.",
      "Fokus kami pada sedikit indikator yang penting dan dapat dipercaya, bukan puluhan grafik yang tidak dipakai.",
    ],
    manfaat: [
      "Satu sumber kebenaran untuk angka penting",
      "Laporan otomatis, bukan rekap manual",
      "Tren dan anomali lebih cepat terlihat",
      "Keputusan berbasis data, bukan perkiraan",
    ],
    tahapan: [
      {
        judul: "Penetapan indikator",
        teks: "Memilih pertanyaan bisnis dan indikator utama bersama pimpinan.",
      },
      {
        judul: "Penyatuan data",
        teks: "Membersihkan dan menggabungkan data dari berbagai sumber.",
      },
      { judul: "Dasbor", teks: "Membangun visualisasi yang ringkas dan mudah dibaca." },
      { judul: "Serah terima", teks: "Pelatihan pengguna dan panduan memperbarui indikator." },
    ],
    hasil: ["Dasbor interaktif", "Kamus data & definisi indikator", "Laporan berkala otomatis"],
    faq: [
      {
        id: "sumber",
        q: "Sumber data apa saja yang didukung?",
        a: "Berkas Excel/CSV, basis data umum, dan sistem yang menyediakan API.",
      },
      {
        id: "keamanan",
        q: "Bagaimana keamanan data kami?",
        a: "Akses berbasis peran, enkripsi saat transit, dan data tetap berada di lingkungan yang Anda tentukan.",
      },
      {
        id: "realtime",
        q: "Apakah datanya real-time?",
        a: "Tergantung kebutuhan: dari pembaruan harian hingga hampir real-time untuk indikator tertentu.",
      },
    ],
    terkait: ["pengembangan-sistem", "konsultasi-proses-bisnis"],
  },
  {
    slug: "pelatihan-sdm",
    nama: "Pelatihan & Pengembangan SDM",
    ikon: "🎓",
    ringkas:
      "Program pelatihan praktis agar tim siap memakai proses dan sistem baru dengan percaya diri.",
    deskripsi: [
      "Sistem sebaik apa pun tidak berguna bila tim tidak terbiasa memakainya. Kami menyiapkan pelatihan berbasis kasus nyata di perusahaan Anda, lengkap dengan modul dan latihan.",
      "Pelatihan dapat dilakukan di kantor Anda atau secara daring, untuk kelompok kecil maupun seluruh unit.",
    ],
    manfaat: [
      "Materi memakai kasus nyata perusahaan",
      "Pengguna lebih cepat produktif",
      "Modul dan rekaman menjadi aset internal",
      "Pengukuran hasil sebelum dan sesudah pelatihan",
    ],
    tahapan: [
      {
        judul: "Analisis kebutuhan",
        teks: "Mengukur kemampuan awal dan menentukan sasaran pelatihan.",
      },
      { judul: "Penyusunan modul", teks: "Menyiapkan materi, studi kasus, dan latihan." },
      { judul: "Pelaksanaan", teks: "Sesi tatap muka atau daring yang interaktif." },
      { judul: "Evaluasi", teks: "Uji kompetensi dan rekomendasi tindak lanjut." },
    ],
    hasil: ["Modul pelatihan", "Rekaman sesi (bila daring)", "Laporan evaluasi peserta"],
    faq: [
      {
        id: "peserta",
        q: "Berapa jumlah peserta ideal per sesi?",
        a: "10–25 peserta agar tetap interaktif. Untuk kelompok lebih besar kami bagi menjadi beberapa sesi.",
      },
      {
        id: "sertifikat",
        q: "Apakah peserta mendapat sertifikat?",
        a: "Ya, sertifikat kehadiran; sertifikat kompetensi tersedia bagi peserta yang lolos evaluasi.",
      },
      {
        id: "daring",
        q: "Apakah bisa dilakukan secara daring?",
        a: "Bisa, lengkap dengan latihan kelompok dan sesi tanya jawab langsung.",
      },
    ],
    terkait: ["konsultasi-proses-bisnis", "pengembangan-sistem"],
  },
];
