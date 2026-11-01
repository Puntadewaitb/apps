/**
 * SEMUA konten landing page ada di file ini. Brand & data di bawah FIKTIF — ganti dengan milik Anda.
 * Nomor WhatsApp: format internasional tanpa "+".
 */
export const site = {
  brand: "Catatin Kas",
  tagline: "Pembukuan UMKM yang beres dalam 5 menit sehari",
  description:
    "Catatin Kas membantu pemilik usaha kecil mencatat pemasukan dan pengeluaran, memantau untung rugi, dan membuat laporan tanpa pusing akuntansi.",
  locale: "id_ID",
  theme: "netral" as "netral" | "hangat" | "hijau",
  whatsapp: {
    phone: "6281234567890",
    message: "Halo Catatin Kas, saya ingin tahu lebih lanjut.",
    label: "Tanya via WhatsApp",
  },
  nav: [
    { label: "Beranda", href: "#beranda" },
    { label: "Masalah", href: "#masalah" },
    { label: "Keunggulan", href: "#keunggulan" },
    { label: "Paket", href: "#paket" },
    { label: "Testimoni", href: "#testimoni" },
    { label: "FAQ", href: "#faq" },
    { label: "Kontak", href: "#kontak" },
  ],
  hero: {
    eyebrow: "Untuk warung, toko, dan usaha rumahan",
    headline: "Tahu untung-rugi usaha Anda tanpa buku besar yang ribet",
    subheadline:
      "Catat transaksi lewat HP, lihat laporan harian otomatis, dan tenang saat musim pajak. Mulai gratis, tanpa kartu kredit.",
    cta: { label: "Coba Gratis 14 Hari", href: "#kontak" },
    secondaryCta: { label: "Lihat Keunggulan", href: "#keunggulan" },
    image: { src: "/img/hero.svg", alt: "Ilustrasi dasbor laporan keuangan Catatin Kas" },
  },
  problem: {
    title: "Masalah yang sering bikin usaha kecil jalan di tempat",
    subtitle: "Kalau salah satu ini terasa akrab, Anda tidak sendirian.",
    items: [
      {
        icon: "📒",
        title: "Catatan tercecer",
        text: "Nota di laci, catatan di buku, transaksi di chat. Akhir bulan bingung uangnya ke mana.",
      },
      {
        icon: "❓",
        title: "Tidak tahu untung sebenarnya",
        text: "Omzet ramai, tapi saldo tipis. Tanpa laporan, sulit tahu produk mana yang benar-benar untung.",
      },
      {
        icon: "⏳",
        title: "Pembukuan makan waktu",
        text: "Rekap manual berjam-jam tiap akhir pekan, padahal waktunya lebih berguna untuk melayani pelanggan.",
      },
    ],
  },
  solution: {
    title: "Catatin Kas merapikan semuanya di satu tempat",
    text: "Catat tiap transaksi dalam hitungan detik. Laporan untung-rugi, arus kas, dan stok tersusun otomatis, siap dibaca atau dikirim ke akuntan.",
    points: [
      "Catat pemasukan & pengeluaran dari HP",
      "Laporan harian, mingguan, bulanan otomatis",
      "Ekspor ke Excel dan PDF dalam sekali klik",
    ],
  },
  features: {
    title: "Keunggulan yang terasa di pekerjaan sehari-hari",
    subtitle: "Dibuat khusus untuk pemilik usaha, bukan akuntan.",
    items: [
      {
        icon: "⚡",
        title: "Catat 10 detik",
        text: "Form ringkas dengan kategori siap pakai, cukup tiga ketukan per transaksi.",
      },
      {
        icon: "📊",
        title: "Laporan otomatis",
        text: "Untung-rugi dan arus kas langsung terhitung, tanpa rumus.",
      },
      {
        icon: "📦",
        title: "Stok terpantau",
        text: "Notifikasi saat stok menipis supaya tidak kehabisan barang laris.",
      },
      {
        icon: "👥",
        title: "Banyak pengguna",
        text: "Ajak kasir dan partner dengan hak akses yang bisa diatur.",
      },
      {
        icon: "🔒",
        title: "Data aman",
        text: "Data terenkripsi dan dicadangkan otomatis setiap hari.",
      },
      {
        icon: "💬",
        title: "Bantuan berbahasa Indonesia",
        text: "Tim kami siap membantu lewat WhatsApp pada jam kerja.",
      },
    ],
  },
  showcase: {
    title: "Pilih paket sesuai ukuran usaha Anda",
    subtitle: "Semua paket termasuk uji coba gratis 14 hari.",
    items: [
      {
        name: "Warung",
        price: "Rp 0",
        period: "selamanya",
        badge: "Gratis",
        image: { src: "/img/paket-warung.svg", alt: "Ilustrasi paket Warung" },
        text: "Untuk usaha yang baru mulai merapikan catatan.",
        points: ["1 pengguna", "100 transaksi/bulan", "Laporan dasar"],
      },
      {
        name: "Toko",
        price: "Rp 59.000",
        period: "/bulan",
        badge: "Terlaris",
        image: { src: "/img/paket-toko.svg", alt: "Ilustrasi paket Toko" },
        text: "Untuk toko dengan transaksi harian dan stok barang.",
        points: ["3 pengguna", "Transaksi tanpa batas", "Stok & laporan lengkap"],
      },
      {
        name: "Cabang",
        price: "Rp 149.000",
        period: "/bulan",
        badge: "Multi-outlet",
        image: { src: "/img/paket-cabang.svg", alt: "Ilustrasi paket Cabang" },
        text: "Untuk usaha dengan beberapa cabang dan tim.",
        points: ["10 pengguna", "Banyak cabang", "Dukungan prioritas"],
      },
    ],
    note: "Harga contoh (fiktif) untuk demo template.",
  },
  /** Countdown promo (opsional). enabled=false atau endsAt lewat → banner tidak tampil. endsAt: ISO 8601 dengan zona waktu. */
  promo: {
    enabled: true,
    endsAt: "2026-12-31T23:59:59+07:00",
    text: "Promo akhir tahun: diskon 30% paket Toko & Cabang",
    cta: { label: "Ambil Promo", href: "#paket" },
  },
  testimonials: {
    title: "Kata mereka yang sudah memakai",
    subtitle: "Cerita pemilik usaha yang pembukuannya kini lebih tenang.",
    note: "Nama dan testimoni di bawah adalah contoh fiktif untuk demo template.",
    items: [
      {
        name: "Bu Ratna",
        role: "Pemilik warung makan, Yogyakarta",
        quote:
          "Dulu akhir bulan saya pusing hitung nota. Sekarang laporan untung-rugi sudah jadi sendiri, tinggal dibaca.",
        rating: 5,
      },
      {
        name: "Pak Dedi",
        role: "Toko bangunan, Medan",
        quote:
          "Notifikasi stok menipis bikin saya tidak pernah kehabisan semen lagi. Kasir juga gampang belajarnya.",
        rating: 5,
      },
      {
        name: "Mbak Sinta",
        role: "Usaha kue rumahan, Bandung",
        quote:
          "Akhirnya tahu produk mana yang paling untung. Harga jual saya atur ulang dan margin naik.",
        rating: 4,
      },
    ],
  },
  faq: {
    title: "Pertanyaan yang sering diajukan",
    subtitle: "Belum menemukan jawabannya? Tanyakan lewat WhatsApp.",
    items: [
      {
        id: "gratis",
        q: "Apakah benar bisa dicoba gratis?",
        a: "Ya. Semua paket punya uji coba 14 hari tanpa kartu kredit. Paket Warung gratis selamanya dengan batas 100 transaksi per bulan.",
      },
      {
        id: "hp",
        q: "Apakah bisa dipakai di HP biasa?",
        a: "Bisa. Catatin Kas berjalan di browser HP maupun komputer, tidak perlu memasang aplikasi tambahan.",
      },
      {
        id: "aman",
        q: "Bagaimana keamanan data usaha saya?",
        a: "Data terenkripsi saat dikirim dan disimpan, serta dicadangkan otomatis setiap hari. Anda bisa mengekspor semua data kapan saja.",
      },
      {
        id: "pindah",
        q: "Saya sudah punya catatan di Excel. Bisa dipindahkan?",
        a: "Bisa. Unggah berkas Excel/CSV dan transaksi lama akan masuk otomatis. Tim kami membantu lewat WhatsApp bila ada yang kurang pas.",
      },
      {
        id: "batal",
        q: "Kalau tidak cocok, bisa berhenti kapan saja?",
        a: "Bisa. Tidak ada kontrak. Berhenti langganan kapan saja dari menu pengaturan, dan data Anda tetap bisa diunduh.",
      },
      {
        id: "pajak",
        q: "Apakah laporannya bisa untuk keperluan pajak?",
        a: "Laporan untung-rugi dan arus kas bisa diekspor ke PDF/Excel sebagai bahan untuk akuntan atau konsultan pajak Anda.",
      },
    ],
  },
  closing: {
    title: "Siap merapikan pembukuan usaha Anda?",
    text: "Mulai uji coba gratis 14 hari. Tanpa kartu kredit, bisa berhenti kapan saja.",
    cta: { label: "Coba Gratis Sekarang", href: "#kontak" },
    secondaryCta: { label: "Lihat Paket", href: "#paket" },
  },
  contact: {
    title: "Mulai catat hari ini",
    text: "Tanya dulu atau langsung coba. Kami balas di jam kerja.",
  },
  footer: {
    description: "Aplikasi pembukuan sederhana untuk usaha kecil Indonesia.",
    links: [
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Syarat & Ketentuan", href: "#" },
    ],
    copyright: `© ${new Date().getFullYear()} Catatin Kas. Brand fiktif untuk demo template.`,
  },
};

export type Site = typeof site;
