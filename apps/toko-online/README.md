# Toko Online (demo)

Template toko online berbahasa Indonesia. Nama toko, produk, rekening, dan seluruh data demo **fiktif**.

> Status: fondasi (T1) — skema database, seed 20 produk, dan beranda sementara. Katalog, keranjang, checkout, lacak pesanan, dan admin dibangun bertahap (T2–T8).

## Menjalankan

```bash
# dari root monorepo
npm ci
cp apps/toko-online/.env.example apps/toko-online/.env      # lalu isi ADMIN_PASSWORD (min. 12 karakter)
npm run setup -w @tpl/toko-online                           # prisma generate + migrate + seed demo
npm run dev -w @tpl/toko-online                             # http://localhost:3005
```

## Data

| Model | Isi |
|---|---|
| `User` | Akun admin/staf (password **bcrypt**; dibuat seed dari env — tidak ada password bawaan) |
| `Category`, `Product`, `Variant` | Katalog. Stok **per varian** (tiap produk ≥ 1 varian, mis. "Standar"); varian boleh menimpa harga produk |
| `Order`, `OrderItem` | Pesanan dengan **snapshot** nama & harga saat dibeli (mengubah produk tidak mengubah pesanan lama); kode pesanan acak |
| `Voucher` | Potongan persen/nominal, minimal belanja, maksimal diskon, kuota, masa berlaku |
| `Setting` | Pengaturan toko (kunci–nilai): nama, WhatsApp, rekening, tabel ongkir |

Kolom status/peran bertipe `String` (SQLite tanpa enum); nilai sahnya ada di `lib/domain.ts` dan diuji terhadap `schema.prisma`. Uang = `Int` rupiah.

**Seed** (`prisma/seed.ts`, data di `prisma/seed-data.ts`): idempotent dan **tidak menimpa** baris yang sudah ada. Berisi 5 kategori, 20 produk (33 varian; ada contoh stok habis & harga varian berbeda), 5 voucher (aktif, kedaluwarsa, kuota habis, nonaktif), dan pengaturan awal. Akun dashboard hanya dibuat bila `ADMIN_PASSWORD` / `STAFF_PASSWORD` diisi (≥ 12 karakter). Gambar demo = SVG placeholder di `public/img/`.

## Pengujian

```bash
npm run test -w @tpl/toko-online        # unit (Vitest)
npm run test:e2e -w @tpl/toko-online    # e2e (Playwright; DB e2e dibuat ulang tiap run)
```
