# Cara Memodifikasi Template

Panduan umum untuk kelima template (`landing-page`, `company-profile`, `undangan`, `sekolah`, `toko-online`). Semua teks UI berbahasa Indonesia dan semua brand/data demo **fiktif** — ganti dengan milik Anda sebelum dipakai.

> Pola di bawah adalah konvensi monorepo ini. Nama file spesifik per app (mis. `content/site.ts`) dibuat saat app tersebut dikerjakan; bila belum ada di `apps/<nama>/`, berarti app itu belum selesai dibuat.

## 0. Persiapan

```bash
nvm use            # Node 22
npm ci
npm run setup      # prisma generate + migrate + seed (app yang memakai DB)
npm run dev:all    # semua app: localhost:3001 s.d. 3005
```

| App | Port |
|---|---|
| landing-page | 3001 |
| company-profile | 3002 |
| undangan | 3003 |
| sekolah | 3004 |
| toko-online | 3005 |

Satu app saja: `npm run dev -w apps/<nama>`. Script `dev:all`, `setup`, `build:all` otomatis melewati app yang belum ada.

## 1. Ganti brand (nama, tagline, kontak)

Semua konten teks tiap app dipusatkan di **satu file**: `apps/<nama>/content/site.ts` (nama brand, tagline, alamat, nomor WhatsApp, tautan sosial, isi section). Ubah di sini; komponen membaca dari file ini.

- Nomor WhatsApp memakai format internasional tanpa `+` (mis. `6281234567890`).
- Metadata SEO (title, description, OG) juga bersumber dari file ini.
- Cari sisa teks demo: `grep -ri "fiktif\|contoh" apps/<nama>`.

## 2. Ganti warna / tema

Ada 3 palet bawaan di `packages/ui/theme.css`: **netral**, **hangat**, **hijau** (islami). Pilih dengan atribut pada `<html>`:

```html
<html lang="id" data-theme="hangat">
```

Palet sendiri: tambah blok di `packages/ui/theme.css`:

```css
[data-theme="biru-laut"] {
  --primary: #0369a1;
  --primary-fg: #ffffff;
  --accent: #f59e0b;
  --bg: #ffffff;
  --surface: #f0f9ff;
  --fg: #0c1a2b;
  --muted: #55657a;
  --border: #d6e4f0;
  --success: #15803d;
  --danger: #b91c1c;
}
```

Pastikan kontras teks/latar minimal 4.5:1 (WCAG AA). Font, breakpoint, dan radius bersama ada di `packages/config/theme.css`.

> Mengubah `packages/ui` atau `packages/config` memengaruhi **semua** app. Untuk perubahan satu app saja, override variabel CSS di `app/globals.css` app tersebut.

## 3. Ganti logo

Logo ada di `apps/<nama>/public/img/` (SVG placeholder buatan sendiri). Timpa file logo dengan milik Anda (SVG/PNG, nama file sama) atau ubah path-nya di `content/site.ts`. Ganti juga favicon (`app/icon.svg` atau `public/favicon.ico`).

## 4. Ganti foto / gambar

Gambar demo adalah **SVG placeholder original** (lihat `CREDITS.md`), bukan foto stok. Ganti dengan foto Anda:

1. Letakkan file di `apps/<nama>/public/img/` (disarankan WebP/JPEG, lebar maks ±1600 px).
2. Perbarui path di `content/site.ts` (atau data seed untuk app ber-DB).
3. Isi `alt` yang bermakna untuk setiap gambar.

Hanya gunakan foto yang Anda punya haknya.

## 5. Ganti font

Font memakai `next/font/local` (tanpa CDN/Google Fonts, agar privasi & CSP tetap ketat):

1. Simpan file font (`.woff2`) di `apps/<nama>/app/fonts/`. Gunakan font berlisensi yang mengizinkan (mis. OFL) dan catat di `CREDITS.md`.
2. Muat di `app/layout.tsx`:

```tsx
import localFont from "next/font/local";

const sans = localFont({
  src: "./fonts/NamaFont-Variable.woff2",
  variable: "--font-sans",
  display: "swap",
});
// <html className={sans.variable}> …
```

Tanpa langkah ini aplikasi memakai system font stack dari `packages/config/theme.css`.

## 6. Ganti database (app ber-DB: undangan, sekolah, toko-online)

Default: **SQLite** via Prisma 7 + driver adapter. Ganti ke PostgreSQL / MySQL (MariaDB):

1. Pasang adapter yang sesuai (versi harus sama dengan `prisma`, exact):

```bash
npm install --save-exact -w apps/<nama> @prisma/adapter-pg@7.10.1         # PostgreSQL
npm install --save-exact -w apps/<nama> @prisma/adapter-mariadb@7.10.1     # MySQL / MariaDB
```

2. Ubah `provider` di `prisma/schema.prisma` (`sqlite` → `postgresql` / `mysql`).
3. Ubah `DATABASE_URL` di `.env` (lihat `.env.example`).
4. Ganti pembuatan client (biasanya `lib/db.ts`):

```ts
// SQLite (bawaan)
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });

// PostgreSQL
import { PrismaPg } from "@prisma/adapter-pg";
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });

export const prisma = new PrismaClient({ adapter });
```

5. Buat ulang migrasi untuk provider baru (migrasi SQLite tidak portabel): hapus folder `prisma/migrations`, lalu `npx prisma migrate dev --name init`.
6. Jalankan `npm run setup` ulang untuk seed.

> Pada hosting serverless/read-only filesystem, SQLite tidak cocok — pakai PostgreSQL/MySQL.

## 7. Environment & kredensial

- Salin `.env.example` → `.env` per app. **Jangan commit `.env`** (sudah di `.gitignore`).
- Kredensial admin di seed hanya untuk development. **Ganti sebelum produksi**: set password kuat dan `NEXTAUTH_SECRET` acak (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`).

### Landing page: form lead & `/admin/leads`

- Form kontak → `POST /api/leads` (Zod, honeypot, rate limit 5/10 menit/IP) → tersimpan di tabel `Lead` → pengunjung diarahkan ke WhatsApp dengan pesan terisi. Nomor tujuan & teks diatur di `content/site.ts`.
- Admin: `/admin/login` → `/admin/leads` (daftar + **Ekspor CSV**). Diatur lewat `ADMIN_PASSWORD` dan `ADMIN_SESSION_SECRET` (≥ 32 karakter); bila salah satu kosong, login dinonaktifkan. Ganti nilai contoh di `.env.example` sebelum produksi.
- IP klien untuk rate limit diambil dari `X-Forwarded-For` (entri ke-`TRUSTED_PROXIES` dari kanan; default 1) lalu `X-Real-IP`. **Pasang app di belakang reverse proxy yang menimpa header ini**; bila app terekspos langsung ke internet, klien bisa memalsukan header dan menghindari batas. Tanpa header sama sekali semua klien berbagi satu bucket (`unknown`).
- Setelah `npm ci` jalankan `npm run setup -w @tpl/landing-page` (generate client + migrasi). `generated/` tidak di-commit.

### Landing page: SEO, tema, tracking

- Metadata, canonical, Open Graph/Twitter, `robots.txt`, `sitemap.xml`, dan JSON-LD (Organization, WebSite, SoftwareApplication+Offer, FAQPage) dibangun dari `content/site.ts`. Set `NEXT_PUBLIC_SITE_URL` ke domain produksi sebelum build. Gambar OG dibuat saat build di `app/opengraph-image.tsx` (tanpa fetch eksternal). JSON-LD sengaja tanpa `aggregateRating` — testimoni demo fiktif; jangan menambah rating palsu.
- Tema: `site.theme` atau env `NEXT_PUBLIC_THEME` (`netral` / `hangat` / `hijau`).
- GA4 / Meta Pixel: isi `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` lalu build ulang. Kosong = tidak ada skrip pihak ketiga dan CSP tetap ketat. Pastikan kebijakan privasi & persetujuan pengunjung sesuai aturan yang berlaku (UU PDP) sebelum mengaktifkan.

## 8. Keamanan yang sudah tersedia

Dari `packages/core` (lihat `packages/core/README.md`): security headers + CSP, validasi Zod (nama, HP Indonesia, email), sanitasi teks, honeypot, rate limiter, validator upload (magic bytes), token acak.

Sebelum produksi:

- Set `frameSrc` pada `nextSecurityHeaders({ frameSrc: [...] })` bila memakai embed (mis. Google Maps), jangan melonggarkan CSP lebih dari perlu.
- Rate limiter bawaan **in-memory** (per proses). Untuk lebih dari satu instance, implementasikan `RateLimitStore` dengan Redis.
- Pasang HTTPS; HSTS aktif otomatis di `NODE_ENV=production`.

## 9. Build & deploy

```bash
npm run build:all           # build semua app
npm run build -w apps/<nama>
npm run start -w apps/<nama>   # next start (port sesuai tabel)
```

Deploy ke VPS (Node 22) di belakang reverse proxy, atau platform Node lain. Set semua variabel `.env` di server, bukan di repo.

## 10. Pengujian

```bash
npm run lint && npm run typecheck && npm test     # cepat, tanpa browser
npm run test:e2e                                   # Playwright (butuh Chromium)
```

Di lingkungan tanpa unduhan browser, arahkan ke Chromium yang ada: `PW_CHROMIUM_PATH=/path/ke/chromium npm run test:e2e`. Di mesin biasa/CI: `npx playwright install --with-deps chromium` lalu jalankan tanpa variabel itu.
