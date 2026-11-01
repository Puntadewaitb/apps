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
