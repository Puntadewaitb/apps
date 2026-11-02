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
| `lib/konten-schema.ts` | Skema Zod untuk memvalidasi konten (dijalankan di `npm test`) |
| `public/img/` | Gambar demo (SVG placeholder — ganti dengan milik Anda) |

`href` di konten hanya boleh path internal (`/…`), `#anchor`, `https://…`, atau `WHATSAPP` (diubah menjadi tautan wa.me berisi pesan awal). Skema menolak `javascript:` dan sejenisnya.

## Halaman

| Rute | Isi |
|---|---|
| `/` | Hero, ringkasan layanan, keunggulan, kontak |
| `/tentang` | Visi & misi, nilai, perjalanan (timeline), tim |
| `/layanan` | Daftar layanan |
| `/layanan/<slug>` | Detail: deskripsi, manfaat, tahapan kerja, hasil, FAQ, layanan terkait. Hanya slug di konten yang valid, selain itu 404 |

**Menambah layanan:** tambahkan satu objek di `content/layanan.id.ts` (slug huruf kecil-tanda hubung, unik). Skema & unit test memeriksa slug unik, layanan terkait valid, dan struktur lengkap. Foto tim: ganti file `public/img/tim-*.svg` atau ubah path-nya di `content/tentang.id.ts`.

## Pengujian

```bash
npm run test -w @tpl/company-profile        # unit (Vitest)
npm run test:e2e -w @tpl/company-profile    # e2e (Playwright)
```

Tanpa unduhan browser: `PW_CHROMIUM_PATH=/path/ke/chromium`.
