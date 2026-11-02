# Company Profile (demo)

Template website profil perusahaan berbahasa Indonesia. Nama perusahaan, alamat, dan kontak di dalamnya **fiktif**.

## Menjalankan

```bash
# dari root monorepo
npm ci
npm run dev -w @tpl/company-profile     # http://localhost:3002
```

## Struktur konten

Semua teks ada di folder `content/` (berbasis file, tanpa database; form kontak memakai DB di langkah C4):

| File | Isi |
|---|---|
| `content/id.ts` | Perusahaan, navigasi, kontak, hero, keunggulan, footer (Bahasa Indonesia) |
| `content/layanan.id.ts` | Daftar layanan — tiap entri otomatis punya halaman `/layanan/<slug>` |
| `content/tentang.id.ts` | Sejarah, visi-misi, nilai, tim |
| `content/portofolio.id.ts` | Kategori & proyek portofolio (tiap proyek otomatis punya `/portofolio/<slug>`) |
| `content/kredibilitas.id.ts` | Angka pencapaian, logo klien/mitra, testimoni |
| `lib/konten-schema.ts` | Skema Zod untuk memvalidasi konten (dijalankan di `npm test`) |
| `public/img/` | Gambar demo (SVG placeholder — ganti dengan milik Anda) |

`href` di konten hanya boleh path internal (`/…`), `#anchor`, `https://…`, atau `WHATSAPP` (diubah menjadi tautan wa.me berisi pesan awal). Skema menolak `javascript:` dan sejenisnya.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Hero, ringkasan layanan, keunggulan, kontak |
| `/tentang` | Visi & misi, nilai, perjalanan (timeline), tim |
| `/layanan` | Daftar layanan |
| `/portofolio` | Daftar proyek + filter kategori (`?kategori=<id>`, berbasis URL sehingga jalan tanpa JavaScript) |
| `/portofolio/<slug>` | Detail proyek: tantangan, solusi, hasil, proyek serupa |
| `/layanan/<slug>` | Detail: deskripsi, manfaat, tahapan kerja, hasil, FAQ, layanan terkait. Hanya slug di konten yang valid, selain itu 404 |

**Menambah proyek:** tambahkan objek di `content/portofolio.id.ts` (kategori harus salah satu id di `kategori`; tiap kategori wajib punya ≥ 1 proyek — diuji). Logo klien & gambar: `public/img/` (SVG placeholder, ganti dengan milik Anda).

**Menambah layanan:** tambahkan satu objek di `content/layanan.id.ts` (slug huruf kecil-tanda hubung, unik). Skema & unit test memeriksa slug unik, layanan terkait valid, dan struktur lengkap. Foto tim: ganti file `public/img/tim-*.svg` atau ubah path-nya di `content/tentang.id.ts`.

## Pengujian

```bash
npm run test -w @tpl/company-profile        # unit (Vitest)
npm run test:e2e -w @tpl/company-profile    # e2e (Playwright)
```

Tanpa unduhan browser: `PW_CHROMIUM_PATH=/path/ke/chromium`.
