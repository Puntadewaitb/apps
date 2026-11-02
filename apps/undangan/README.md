# Undangan Digital (demo)

Template undangan pernikahan digital berbahasa Indonesia. Nama, tanggal, dan alamat di dalamnya **fiktif**.

## Menjalankan

```bash
# dari root monorepo
npm ci
cp apps/undangan/.env.example apps/undangan/.env
npm run setup -w @tpl/undangan   # prisma generate + migrasi + seed acara demo
npm run dev -w @tpl/undangan     # http://localhost:3003
```

## Nama tamu di sampul

Kirim tautan berbeda per tamu dengan parameter `to`:

```
http://localhost:3003/?to=Bapak%20Budi%20%26%20Keluarga
```

Nama dibersihkan (tag HTML & karakter kontrol dibuang), dipotong 60 karakter, dan dirender sebagai teks. Tanpa `to` tampil "Tamu Undangan".

## Musik latar

Pemutar memakai `public/audio/latar.wav`. **File bawaan adalah placeholder senyap** (2 detik, ±16 KB) karena template tidak mengunduh aset dari luar.

Mengganti musik:

1. Siapkan lagu yang Anda punya hak pakainya (milik sendiri / berlisensi bebas). Format MP3 atau M4A disarankan, ≤ 3 MB.
2. Simpan di `public/audio/` (mis. `latar.mp3`).
3. Ubah nilai default `audioSrc` di `components/Cover.tsx` (atau kirim prop `audioSrc` dari `app/page.tsx`).

Musik baru mulai setelah tamu menekan **Buka Undangan** (kebijakan autoplay browser); tombol musik di kanan bawah untuk menyalakan/mematikan.

## Data acara

Data acara ada di database (tabel `Event`, lihat `prisma/schema.prisma`). Demo di-seed oleh `prisma/seed.ts` (aman dijalankan berulang: `npm run db:seed -w @tpl/undangan`). Slug acara yang tampil diatur env `EVENT_SLUG`. Ganti DB ke MySQL/PostgreSQL: lihat [`docs/CARA-MODIF.md`](../../docs/CARA-MODIF.md) §6.

## Pengujian

```bash
npm run test -w @tpl/undangan        # unit (Vitest)
npm run test:e2e -w @tpl/undangan    # e2e (Playwright, DB e2e sekali pakai)
```

Tanpa unduhan browser: tambahkan `PW_CHROMIUM_PATH=/path/ke/chromium`.
