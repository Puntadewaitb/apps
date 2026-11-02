# Sekolah / Pesantren / Yayasan (demo)

Template website sekolah berbahasa Indonesia. Nama sekolah, alamat, kontak, dan seluruh data demo **fiktif**.

> Status: fondasi, halaman publik, informasi, login admin, CRUD konten, dan PPDB (S1–S6). Donasi dan QA akhir dibangun bertahap (S7–S8).

## Menjalankan

```bash
# dari root monorepo
npm ci
cp apps/sekolah/.env.example apps/sekolah/.env      # lalu isi ADMIN_PASSWORD (min. 12 karakter)
npm run setup -w @tpl/sekolah                       # prisma generate + migrate + seed demo
npm run dev -w @tpl/sekolah                         # http://localhost:3004
```

## Halaman

| Rute | Isi |
|---|---|
| `/` | Hero, angka, sambutan, program unggulan, berita & pengumuman terbaru (DB) |
| `/profil` | Sambutan kepala sekolah, visi-misi, sejarah, struktur organisasi, lokasi (Google Maps embed) |
| `/guru` | Guru & staf dari database (hanya yang `active`, urut kolom `sort`) |
| `/program` | Program akademik + ekstrakurikuler per kategori |
| `/berita` · `/berita/<slug>` | Daftar berita & pengumuman (filter `?jenis=`, halaman `?halaman=` — berbasis URL, jalan tanpa JavaScript) dan detail (isi Markdown aman: tanpa HTML mentah, tautan `javascript:` dibuang). Hanya yang `published` **dan** tanggal terbitnya sudah lewat; draf/terjadwal → 404 |
| `/agenda` | Kalender bulanan (tabel, `?bulan=YYYY-MM`, minggu mulai Senin, zona WIB) + daftar kegiatan bulan itu; kegiatan multi-hari tampil di tiap harinya |
| `/galeri` · `/galeri/<slug>` | Album foto dan detail dengan lightbox (panah/Esc, fokus kembali ke thumbnail) |

Konten statis ada di `content/` (`sekolah.ts`, `profil.ts`, `program.ts`; divalidasi `lib/konten-schema.ts`). Menu (`nav` di `content/sekolah.ts`) hanya memuat halaman yang sudah ada. Embed Maps hanya merender URL `https://www.google.com/maps/embed…`/`?output=embed` (`lib/maps.ts`).

## Admin (login & otorisasi)

- Login `/admin/login` (email + password) memakai **NextAuth v4 (credentials) + bcrypt**; sesi JWT dalam cookie `httpOnly`, `SameSite=Strict`, berlaku 8 jam. Tanpa `NEXTAUTH_SECRET` (≥ 32 karakter) login **nonaktif** (fail closed).
- **Berlapis**: (1) `proxy.ts` (Next 16 — pengganti `middleware.ts`) menolak `/admin/*` & `/api/admin/*` tanpa JWT valid (halaman → redirect login, API → 401); (2) setiap halaman/route handler/server action memanggil `requireAdmin()` / `apiAdmin()` (`lib/session.ts`) yang **memeriksa ulang ke DB** — akun yang dihapus atau diturunkan perannya langsung kehilangan akses, hak mengikuti peran di DB (bukan klaim di token).
- Peran: `ADMIN` (semua area) dan `EDITOR` (berita, agenda, galeri, guru) — matriks di `lib/auth-core.ts` (`can()`).
- Rate limit login: 10 percobaan/15 menit/IP + 20/15 menit/akun (in-memory; ganti store dengan Redis untuk multi-instance). Atur `TRUSTED_PROXIES` sesuai jumlah reverse proxy agar IP klien benar. Email tak terdaftar & password salah → pesan identik; waktu respons disamakan (hash palsu).
- `callbackUrl` hanya boleh path `/admin…` (anti open redirect). Halaman & API admin: `Cache-Control: no-store`, `X-Robots-Tag: noindex`.

## Kelola konten (admin)

`/admin/berita` · `/admin/agenda` · `/admin/galeri` · `/admin/guru` — tambah, ubah, hapus. Semua aksi (server action) memanggil `requireAdmin(area)` lebih dulu, memvalidasi dengan Zod (`lib/validasi.ts`), dan menolak ID/slug tak valid.

- **Berita**: editor teks kaya berbasis **Markdown aman** (toolbar + tab Pratinjau yang memakai renderer yang sama dengan situs publik — tanpa HTML mentah). Draf / terbit / terjadwal (tanggal terbit di masa depan). Slug dibuat dari judul, unik, dan **tidak berubah** saat judul diedit (URL publik stabil).
- **Agenda**: waktu diisi dalam WIB (`datetime-local` ⇄ UTC di `lib/waktu.ts`).
- **Galeri**: unggah banyak foto sekaligus (maks. 10; satu berkas tidak valid → seluruh unggahan dibatalkan), keterangan, sampul otomatis/pilihan.
- **Guru**: foto, urutan tampil, sembunyikan tanpa menghapus.
- **Unggah gambar** (`lib/upload.ts`): PNG/JPG/WebP ≤ 2 MB; tipe diperiksa dari **magic bytes** (bukan ekstensi) dan harus cocok dengan MIME yang dinyatakan; SVG/GIF/PDF ditolak; nama file acak buatan server. Disimpan di `UPLOAD_DIR` (bawaan `./uploads`, **di luar `public/`**) dan disajikan lewat `/uploads/<nama>` (nama dibatasi regex ketat; `nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, cache immutable). File dihapus otomatis saat data/penggantinya dihapus bila tak dirujuk lagi.
- Setelah validasi gagal, isian yang sudah diketik **dipertahankan** (React 19 mereset field tak terkontrol; action mengembalikan nilai yang dikirim).

## PPDB online

`/ppdb` (info) · `/ppdb/daftar` (formulir 4 langkah) · `/ppdb/status` (cek status) · admin `/admin/ppdb` (hanya `ADMIN`). Konfigurasi (dibuka/ditutup, jenjang, dokumen) di `content/ppdb.ts`.

- **Nomor & token**: nomor pendaftaran **acak** (`PPDB-2027-K7M2XQ`, bukan urutan → tak bisa ditebak) dan token akses 12 karakter (`ABCD-EFGH-JKMN`, ±59 bit) dibuat dengan CSPRNG. Token ditampilkan **sekali**; yang disimpan hanya **hash SHA-256**-nya (DB bocor ≠ token bocor). Cek status wajib nomor **dan** token (bukan ID berurutan), dibandingkan waktu-konstan; nomor tak dikenal & token salah → pesan **identik** (anti-enumerasi). Rate limit: 10 percobaan/15 menit/IP + 8/15 menit/nomor; pendaftaran 5/jam/IP + honeypot.
- **Dokumen** (akta, KK, rapor, pas foto): PDF/PNG/JPG/WebP ≤ 2 MB, tipe dari magic bytes & harus cocok MIME; **semua divalidasi dulu** — satu gagal → tidak ada yang tersimpan (tanpa berkas yatim). Disimpan **privat** di `UPLOAD_DIR/dokumen/` (tidak terjangkau `/uploads`) dan hanya bisa dibuka admin lewat `/admin/ppdb/dokumen/<id>/<jenis>` (CSP sandbox, `nosniff`, `no-store`; PDF diunduh).
- **Wizard**: tanpa JavaScript semua bagian tampil sekaligus dan tetap bisa dikirim; dengan JavaScript ada validasi per langkah, ringkasan sebelum kirim, dan isian + berkas tidak hilang saat server menolak.
- **Admin**: daftar + filter status + cari, detail, ubah status + catatan (catatan terlihat pendaftar), ekspor CSV (sel berawalan `= + - @` dinetralkan). Status/catatan divalidasi ulang di server (nilai di luar daftar ditolak).

## Data

| Model | Isi |
|---|---|
| `User` | Akun admin/editor (password **bcrypt**; dibuat seed dari env — tidak ada password bawaan) |
| `Post` | Berita & pengumuman (`published` + `publishedAt`; draf tidak pernah tampil publik) |
| `Agenda` | Agenda kegiatan |
| `Gallery`, `GalleryImage` | Album & foto |
| `Teacher` | Guru & staf |
| `Registration` | Pendaftar PPDB — nomor pendaftaran acak + **hash** token cek status (token polos tak disimpan) |
| `DonationProgram`, `Donation` | Program donasi dengan target; donasi dihitung hanya bila `TERVERIFIKASI` |

Kolom status/peran bertipe `String` (SQLite tanpa enum); nilai sahnya ada di `lib/domain.ts` dan diuji terhadap `schema.prisma`. Uang disimpan sebagai `Int` rupiah.

**Seed** (`prisma/seed.ts`, data di `prisma/seed-data.ts`): idempotent dan **tidak menimpa** baris yang sudah ada (mis. berita yang sudah diedit admin). Tanggal demo relatif terhadap waktu seed sehingga tidak pernah "basi". Akun admin hanya dibuat bila `ADMIN_PASSWORD` diisi (≥ 12 karakter); akun editor bila `EDITOR_PASSWORD` diisi.

Konten statis (nama sekolah, kontak, navigasi) ada di `content/sekolah.ts`. Gambar demo = SVG placeholder di `public/img/`.

## Pengujian

```bash
npm run test -w @tpl/sekolah        # unit (Vitest)
npm run test:e2e -w @tpl/sekolah    # e2e (Playwright; DB e2e dibuat ulang tiap run)
```
