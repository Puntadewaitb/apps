/**
 * Identitas & konten statis sekolah. Semua nama, alamat, dan kontak di bawah FIKTIF — ganti dengan milik Anda.
 * Halaman publik dibangun di langkah S2–S3; berita/agenda/galeri/guru ada di database (lihat prisma/seed-data.ts).
 */
export const sekolah = {
  tema: "hijau" as "netral" | "hangat" | "hijau",
  nama: "Sekolah Cendekia Nusantara",
  singkatan: "SCN",
  tagline: "Menumbuhkan generasi berilmu, berakhlak, dan peduli",
  deskripsi:
    "Sekolah Cendekia Nusantara (fiktif) adalah sekolah menengah berasrama ringan yang memadukan kurikulum nasional, pendidikan karakter, dan pengembangan bakat.",
  tahunBerdiri: 2005,
  akreditasi: "A",
  kontak: {
    telepon: "(0274) 555 0123",
    whatsapp: "6281234567890",
    email: "info@cendekianusantara.example",
    alamat: "Jl. Pendidikan No. 7, Sleman, DI Yogyakarta 55281 (alamat fiktif untuk demo)",
    jamLayanan: "Senin–Jumat, 07.00–15.00 WIB",
  },
  nav: [
    { label: "Beranda", href: "/" },
    { label: "Profil", href: "/profil" },
    { label: "Guru & Staf", href: "/guru" },
    { label: "Program", href: "/program" },
    { label: "Berita", href: "/berita" },
    { label: "Agenda", href: "/agenda" },
    { label: "Galeri", href: "/galeri" },
    { label: "PPDB", href: "/ppdb" },
    { label: "Donasi", href: "/donasi" },
  ],
};

export type Sekolah = typeof sekolah;
