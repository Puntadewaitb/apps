# Sekolah / Pesantren / Yayasan (demo)

Template website sekolah berbahasa Indonesia. Nama sekolah, alamat, kontak, dan seluruh data demo **fiktif**.

> Status: fondasi + halaman publik inti (S1–S2). Berita/agenda/galeri, admin, PPDB, dan donasi dibangun bertahap (S3–S8).

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

Konten statis ada di `content/` (`sekolah.ts`, `profil.ts`, `program.ts`; divalidasi `lib/konten-schema.ts`). Menu (`nav` di `content/sekolah.ts`) hanya memuat halaman yang sudah ada. Embed Maps hanya merender URL `https://www.google.com/maps/embed…`/`?output=embed` (`lib/maps.ts`).

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
