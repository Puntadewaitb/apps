# Toko Online (demo)

Template toko online berbahasa Indonesia. Nama toko, produk, rekening, dan seluruh data demo **fiktif**.

> Status: T1–T4 — skema + seed, **katalog**, **keranjang**, **checkout**. Lacak pesanan dan admin dibangun bertahap (T5–T8).

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

## Katalog (T2)

| Halaman | Isi |
|---|---|
| `/` | Hero, kategori, 8 produk terbaru |
| `/produk` | Daftar produk: filter `?kategori=`, pencarian `?q=`, urutan `?urut=terbaru\|termurah\|termahal\|nama`, paginasi `?halaman=` (12/halaman). Form filter memakai GET biasa → jalan **tanpa JavaScript** |
| `/produk/[slug]` | Galeri gambar, pilihan varian (harga & stok mengikuti varian; varian habis tidak bisa dipilih), deskripsi, produk terkait, JSON-LD `Product` |
| `/sitemap.xml`, `/robots.txt` | Hanya produk aktif; `/admin`, keranjang, checkout, lacak tidak diindeks |

Keputusan desain:
- **Hanya produk & varian `active`** yang publik (daftar, pencarian, detail → 404, sitemap). Produk tanpa varian aktif dianggap **habis**.
- Parameter URL divalidasi (`urut`, `halaman`, `kategori`, `q`): nilai aneh diabaikan, bukan error; `halaman` di luar rentang dijepit.
- Pencarian dan pengurutan dilakukan di aplikasi, bukan `contains` Prisma — `contains` **tidak meng-escape wildcard LIKE** (terbukti: `?q=%` mencocokkan semua produk). Cukup untuk katalog skala toko kecil (≤ ribuan produk); untuk katalog besar pindahkan ke FTS5/indeks.
- Galeri: hanya path `/img/…` atau `/uploads/…` yang sah; entri lain (`javascript:`, URL luar) dibuang. Data JSON-LD meng-escape `<`.
- Nama/deskripsi dirender sebagai teks (tidak ada HTML dari data).

## Keranjang (T3)

- Keranjang **client-side** (`localStorage`, kunci `toko.keranjang.v1`) yang hanya menyimpan `{varianId, qty}`. **Harga, nama, dan stok tidak pernah disimpan di klien**: halaman keranjang & mini-cart mengambilnya dari server lewat `POST /api/keranjang` (`{ ids: number[] }`), dan checkout (T4) menghitung ulang semuanya di server.
- Isi `localStorage` dianggap **input tidak tepercaya**: JSON rusak, tipe salah, qty negatif/pecahan/raksasa, properti tambahan (mis. `harga`), duplikat, dan >50 baris dinormalkan/dibuang (`lib/keranjang.ts`, diuji unit).
- Mini-cart di navbar (selalu tampil, termasuk di layar 360 px), badge jumlah, sinkron antar-tab (event `storage`). Penyimpanan diblokir (mode privat) → fallback memori selama tab terbuka.
- Halaman `/keranjang`: ubah jumlah (+/−/ketik; dijepit 1…stok), hapus item, kosongkan (dengan konfirmasi). Produk yang dinonaktifkan / stok habis ditandai dan **tidak dihitung**; jumlah melebihi stok dijepit otomatis.
- `POST /api/keranjang`: hanya `application/json` (415), maks. 4 KB (413), skema ketat (400), 120 permintaan/menit/IP (429 + `Retry-After`, env `KERANJANG_LIMIT`), `Cache-Control: no-store`. Produk/varian nonaktif dijawab `tersedia:false` **tanpa nama/harga**. Endpoint baca-saja.
- `@tpl/ui` `Navbar` mendapat prop opsional `actions` (tampil di bar di luar menu hamburger); aplikasi lain tidak terpengaruh.

## Checkout (T4)

Alur: `/keranjang` → `/checkout` (form pembeli + ringkasan) → konfirmasi (kode pesanan, info pembayaran, tombol WhatsApp).

**Prinsip: server tidak percaya angka dari klien.** Permintaan hanya membawa `{varianId, qty}`, data pembeli, kota, kode voucher, dan `totalPreview`. Harga, ongkir, diskon, dan total dihitung ulang dari DB di satu tempat (`hitungRingkasan`, `lib/checkout-server.ts`).

| Endpoint | Fungsi |
|---|---|
| `POST /api/checkout/ringkasan` | Pratinjau yang dihitung server (baca-saja). 120/menit/IP; yang membawa voucher juga dibatasi 20/10 menit/IP (cegah tebak kode) |
| `POST /api/pesanan` | Buat pesanan. 10/jam/IP dan 6/jam/nomor HP |

Jaminan keamanan & integritas (semuanya diuji e2e, termasuk balapan bersamaan):
- **Skema ketat**: properti asing (`harga`, `total`, `ongkir`, `diskon`, `stok`, `status`, …) → 400, bukan diabaikan diam-diam.
- **`totalPreview` hanya pembanding**: bila beda dari hitungan server (mis. harga/ongkir berubah, atau dimanipulasi) → 409 `harga-berubah`, tidak ada pesanan, ringkasan terbaru dikirim balik.
- **Transaksi atomik**: hitung ulang → kunci stok dengan `UPDATE … WHERE stock >= qty` (stok tak pernah negatif; 8 pesanan bersamaan untuk stok 3 → tepat 3 berhasil) → pakai kuota voucher dengan `UPDATE … WHERE quota IS NULL OR used < quota` → simpan `Order` + `OrderItem` (snapshot nama & harga). Gagal di mana pun → semua dibatalkan.
- **Idempotensi**: `kunci` per percobaan; klik ganda / kirim ulang bersamaan → satu pesanan (in-memory per proses; multi-instance → simpan di DB/Redis).
- **Ongkir** dari tabel manual (`toko.ongkir`): kunci kota dinormalkan (huruf kecil, awalan "Kota/Kab." dibuang); kota lain → tarif bawaan; kunci prototipe (`constructor`, `__proto__`) tidak dianggap tarif.
- **Voucher**: PERSEN (dibulatkan ke bawah, dibatasi `maxDiscount`) / NOMINAL; atas subtotal barang (bukan ongkir), tidak pernah melebihi subtotal; minimal belanja, masa berlaku (inklusif), kuota. Pesan galat **generik** untuk kode tidak ada/nonaktif/kedaluwarsa (tidak membocorkan status kode); hanya "minimal belanja" & "kuota habis" yang spesifik (konsekuensi: kode yang valid bisa dibedakan dari yang tidak — dimitigasi rate limit 20/10 menit).
- **CSRF**: JSON-only (415), `Origin` harus sama dengan host (403), badan ≤ 8 KB (413).
- **Anti-bot**: honeypot (tampak sukses, tidak menyimpan apa pun), batas per-IP & per-nomor.
- Total maksimum Rp 1 miliar (Prisma `Int` 32-bit). Data pembeli disanitasi (HTML dibuang); telepon dinormalkan ke `62…`.
- Konfirmasi ditampilkan **di halaman yang sama** (tanpa URL per-pesanan yang bisa ditebak); pelacakan lewat kode + nomor HP (T5). Tombol WhatsApp berupa tautan yang diklik pengguna (bukan redirect otomatis — WCAG 3.2.5).
- **Risiko yang diketahui**: stok dikunci saat pesanan dibuat, sehingga pesanan palsu bisa "menahan" stok. Mitigasi: batas laju + pembatalan oleh admin mengembalikan stok (T7).
- QRIS di demo = gambar placeholder (`/img/qris.svg`), bukan kode QR sungguhan.

## Pengujian

```bash
npm run test -w @tpl/toko-online        # unit (Vitest)
npm run test:e2e -w @tpl/toko-online    # e2e (Playwright; DB e2e dibuat ulang tiap run)
```
