/** Portofolio proyek (FIKTIF — klien, angka, dan hasil hanya contoh untuk demo template). */
export const portofolio = {
  judul: "Portofolio",
  pengantar: "Beberapa proyek yang pernah kami kerjakan bersama klien dari berbagai industri.",
  catatan: "Seluruh klien, proyek, dan angka di halaman ini fiktif untuk keperluan demo template.",
  filter: {
    semua: "Semua",
    label: "Filter kategori proyek",
    kosong: "Belum ada proyek pada kategori ini.",
  },
  kategori: [
    { id: "proses", nama: "Proses Bisnis", layanan: "konsultasi-proses-bisnis" },
    { id: "sistem", nama: "Sistem Digital", layanan: "pengembangan-sistem" },
    { id: "data", nama: "Analitik Data", layanan: "analitik-data" },
    { id: "pelatihan", nama: "Pelatihan SDM", layanan: "pelatihan-sdm" },
  ],
  proyek: [
    {
      slug: "standarisasi-pergudangan-nusa",
      judul: "Standarisasi Proses Pergudangan",
      klien: "PT Nusa Distribusi",
      kategori: "proses",
      tahun: 2023,
      ringkas: "Memetakan dan menyederhanakan alur penerimaan hingga pengiriman di tiga gudang.",
      tantangan:
        "Setiap gudang memakai cara kerja berbeda sehingga stok sering selisih dan pengiriman terlambat.",
      solusi:
        "Kami memetakan proses di ketiga gudang, menetapkan satu alur standar beserta SOP, dan mendampingi uji coba selama delapan minggu.",
      hasil: [
        "Selisih stok turun 42%",
        "Waktu penyiapan pesanan turun 28%",
        "SOP seragam di 3 gudang",
      ],
      teknologi: ["Pemetaan proses", "SOP", "Indikator kinerja"],
      gambar: "/img/proyek-1.svg",
    },
    {
      slug: "portal-pemesanan-sentosa",
      judul: "Portal Pemesanan Mitra",
      klien: "CV Sentosa Abadi",
      kategori: "sistem",
      tahun: 2024,
      ringkas:
        "Portal web agar mitra dapat memesan, melacak, dan menagih tanpa lewat pesan berantai.",
      tantangan:
        "Pesanan mitra masuk lewat chat dan telepon sehingga mudah terlewat dan sulit dilacak.",
      solusi:
        "Portal pemesanan dengan katalog, riwayat pesanan, dan notifikasi status, terhubung ke sistem stok yang sudah ada.",
      hasil: [
        "Pesanan salah input turun 60%",
        "Waktu konfirmasi pesanan dari 1 hari menjadi 2 jam",
        "120 mitra aktif dalam 3 bulan",
      ],
      teknologi: ["Aplikasi web", "Integrasi API", "Notifikasi WhatsApp"],
      gambar: "/img/proyek-2.svg",
    },
    {
      slug: "dasbor-penjualan-lestari",
      judul: "Dasbor Penjualan Multi-Cabang",
      klien: "Lestari Retail",
      kategori: "data",
      tahun: 2024,
      ringkas: "Satu dasbor untuk memantau penjualan, margin, dan stok 18 cabang secara harian.",
      tantangan: "Laporan cabang dikirim lewat Excel dan baru terkumpul di akhir pekan.",
      solusi:
        "Kami menyatukan data kasir semua cabang, menetapkan definisi indikator, dan membangun dasbor harian yang dapat dibuka dari ponsel.",
      hasil: [
        "Laporan harian otomatis, bukan mingguan",
        "Produk lambat laku terdeteksi 3× lebih cepat",
        "Rekap manual 15 jam/minggu dihapus",
      ],
      teknologi: ["Penyatuan data", "Dasbor", "Laporan otomatis"],
      gambar: "/img/proyek-3.svg",
    },
    {
      slug: "pelatihan-erp-karya",
      judul: "Program Pelatihan Pengguna ERP",
      klien: "Karya Manufaktur",
      kategori: "pelatihan",
      tahun: 2022,
      ringkas: "Pelatihan bertahap untuk 240 pengguna agar peralihan ke ERP baru berjalan mulus.",
      tantangan:
        "Sistem ERP baru diluncurkan tetapi banyak pengguna enggan memakainya dan kembali ke berkas manual.",
      solusi:
        "Modul pelatihan berbasis kasus nyata perusahaan, sesi per unit, dan evaluasi kompetensi sebelum serta sesudah pelatihan.",
      hasil: [
        "92% peserta lulus evaluasi",
        "Tiket bantuan turun 55% dalam 2 bulan",
        "Modul menjadi aset pelatihan internal",
      ],
      teknologi: ["Modul pelatihan", "Studi kasus", "Evaluasi kompetensi"],
      gambar: "/img/proyek-4.svg",
    },
    {
      slug: "antrian-klinik-sehat-prima",
      judul: "Sistem Antrian & Rekam Kunjungan",
      klien: "Klinik Sehat Prima",
      kategori: "sistem",
      tahun: 2023,
      ringkas:
        "Pendaftaran daring, nomor antrian, dan rekam kunjungan untuk klinik dengan lima poli.",
      tantangan: "Pasien menunggu lama tanpa kepastian dan data kunjungan tercatat di buku.",
      solusi:
        "Pendaftaran daring dengan estimasi waktu tunggu, layar antrian di ruang tunggu, dan rekam kunjungan terpusat dengan akses berbasis peran.",
      hasil: [
        "Waktu tunggu rata-rata turun 35%",
        "Pendaftaran daring dipakai 64% pasien",
        "Data kunjungan tersimpan aman & dapat dicari",
      ],
      teknologi: ["Aplikasi web", "Akses berbasis peran", "Layar antrian"],
      gambar: "/img/proyek-5.svg",
    },
    {
      slug: "pemetaan-pengiriman-samudra",
      judul: "Pemetaan Proses Pengiriman",
      klien: "Samudra Logistik",
      kategori: "proses",
      tahun: 2022,
      ringkas:
        "Menemukan titik hambatan pada alur pengiriman antarkota dan merancang ulang serah terimanya.",
      tantangan: "Pengiriman sering tertahan di titik transit tanpa penanggung jawab yang jelas.",
      solusi:
        "Pemetaan alur end-to-end, penetapan penanggung jawab di tiap titik serah terima, dan indikator keterlambatan mingguan.",
      hasil: [
        "Keterlambatan turun 31%",
        "Penanggung jawab jelas di 9 titik transit",
        "Indikator mingguan dipantau pimpinan",
      ],
      teknologi: ["Pemetaan proses", "Matriks tanggung jawab", "Indikator kinerja"],
      gambar: "/img/proyek-6.svg",
    },
  ],
};
