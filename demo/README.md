# Sample statis (GitHub Pages)

Versi **statis** kelima template untuk dilihat calon klien: `https://<owner>.github.io/<repo>/<template>/`.
Tampilan dan alurnya sama dengan versi lengkap; yang tidak ada hanya server (database, panel admin, API).
Versi lengkap dikembangkan setelah pemesanan.

| Template | URL | Yang disimulasikan di peramban |
|---|---|---|
| Landing page | `/landing-page/` | Form kontak: divalidasi, lalu menampilkan pesan WhatsApp yang akan terkirim (tidak dikirim/disimpan) |
| Company profile | `/company-profile/` (`/id/`, `/en/`) | Form kontak (validasi ID/EN yang sama); filter portofolio jadi halaman statis |
| Undangan | `/undangan/?to=Nama+Tamu` atau `?kode=DEMO-0001` | RSVP & ucapan (localStorage, skema validasi sama, spam bertaut tidak tampil); `.ics` dibuat saat build |
| Sekolah | `/sekolah/` | PPDB (wizard, nomor+token, cek status) dan donasi (bukti transfer divalidasi magic bytes); agenda/berita/galeri dari data seed |
| Toko online | `/toko-online/` | Katalog (cari/kategori/urut/halaman), keranjang, checkout (voucher, ongkir per kota), konfirmasi + WhatsApp, lacak pesanan, unggah bukti |

Setiap halaman memuat banner **Versi demo**, ber-`noindex` (tidak diindeks mesin pencari), dan tidak mengandung `/admin` maupun `/api`.

## Cara kerja

App asli **tidak diubah**. `scripts/demo/build.mjs <template|all>` menurunkan sample dari kodenya:

1. Menyalin `apps/<template>` ke `.demo/<template>` dan membuang bagian server (admin, API, `proxy.ts`, unggahan, Prisma yang tak perlu).
2. Menimpa bagian dinamis dengan **overlay** dari `demo/<template>/overlay/` (mis. form → simulasi di peramban) dan menerapkan **patch** string persis dari `demo/<template>/config.mjs`. Patch **gagal keras** bila kode asli berubah (teks tak ditemukan/ambigu), jadi divergensi terdeteksi saat build, bukan diam-diam rusak.
3. Untuk app ber-DB: membuat DB sementara (`prisma generate` → `migrate deploy` → seed) dan **merender halaman dari data seed** saat build. DB tidak ikut ke hasil akhir. Kredensial seed di `config.mjs` hanya untuk DB sekali pakai itu.
4. Membungkus `<a href>` / `<img src>` / `<form action>` dengan `withBase()` (codemod AST; `@tpl/ui` juga sadar base path) karena template memakai tag HTML biasa, bukan `next/link`, sehingga `basePath` Next saja tidak cukup di sub-path.
5. `next build` dengan `output: "export"`, lalu menambah `noindex`. Banner demo dirender React (menempel HTML ke `<body>` memicu hydration error #418).
6. Modul yang mencampur logika murni dan akses DB (mis. `lib/katalog.ts`) diturunkan otomatis bagian murninya (`scripts/demo/derive.mjs`), bukan disalin manual.

## Perintah

```bash
npm run demo:build -- all          # semua template → dist-demo/ (± 1 menit); atau: -- toko-online
npm run demo:verify                # cek statis: URL tanpa base path, tautan putus, sisa /admin & fetch("/api…"), noindex, banner
npm run demo:serve                 # server yang meniru GitHub Pages di http://localhost:4100/apps/
npm run demo:e2e                   # smoke test Playwright terhadap server tiruan (PW_CHROMIUM_PATH di cloud)
npm run test:demo                  # tes unit codemod / derive / verify
```

Variabel opsional: `DEMO_ORIGIN` (default `https://puntadewaitb.github.io`), `DEMO_BASE_ROOT` (default `/apps`, = nama repo),
`DEMO_CONTACT_URL` (tautan "Pesan versi lengkap" di banner dan galeri; di GitHub: Settings → Variables → `DEMO_CONTACT_URL`).

## Publikasi

Repo ini **privat** dan berisi source versi lengkap yang akan dijual, jadi **jangan dijadikan public** hanya demi Pages. Pilih salah satu:

**Mode B — repo publik terpisah (disarankan; gratis; source tetap privat).** Hanya hasil statis (`dist-demo/`) yang didorong ke repo publik.

1. Buat repo publik kosong (dengan README awal), mis. `<owner>/template-demo`. Di repo itu: **Settings → Pages → Deploy from a branch → `main` / `(root)`** (ini branch di repo PUBLIK itu).
2. Buat *fine-grained personal access token* yang **hanya** mencakup repo itu, izin **Contents: Read and write**.
3. Di repo ini: **Settings → Secrets and variables → Actions** → secret `DEMO_PUBLISH_TOKEN` (token tadi) dan variabel `DEMO_PUBLISH_REPO` = `<owner>/template-demo`. Opsional variabel `DEMO_CONTACT_URL` (mis. `https://wa.me/62…`).
4. Jalankan workflow *Pages (sample statis)* dari tab Actions (*Run workflow*) pada **branch default repo ini**, atau tunggu push/jadwal harian berikutnya. Hasil: `https://<owner>.github.io/template-demo/` (galeri) dan `/<template>/`.

**Mode A — Pages dari repo ini.** Hanya bila repo public atau akun memakai plan yang mengizinkan Pages untuk repo privat (Pro/Team; situsnya tetap dapat diakses publik). **Settings → Pages → Source: GitHub Actions**; aktif otomatis bila repo public (repo privat dengan plan berbayar: isi variabel `DEMO_PAGES_SAME_REPO=true`); biarkan `DEMO_PUBLISH_REPO` kosong.

Kedua mode bersifat **opt-in** (tanpa variabel di atas workflow hanya build + verify, dan run terjadwal dilewati) dan deploy **hanya dari branch default repo** (`github.event.repository.default_branch`; saat ini `claude/determined-turing-qzp8w9` karena belum ada `main`). Pemicu: push, manual, dan jadwal harian untuk menyegarkan tanggal data seed. Branch lain/PR hanya build + verify + e2e. Base path otomatis mengikuti nama repo tujuan.

## Batasan yang disengaja

- Stok & kuota voucher toko **tidak berkurang** pada demo (halaman produk statis); pesanan, RSVP, ucapan, PPDB, dan donasi hanya tersimpan di localStorage peramban pengunjung.
- GitHub Pages tidak bisa menyetel header HTTP, jadi CSP/header keamanan versi lengkap tidak berlaku di sample. Sample tidak punya rahasia, akun, atau data pribadi.
- Agenda sekolah memakai jendela bulan (-6…+12 dari waktu build); berita dibuat 1 halaman (ada tes penjaga bila seed melebihi itu).
- 404 yang disajikan GitHub Pages hanya satu (`404.html` di akar situs = halaman galeri).

## Menambah / mengubah template

Tambah entri di `demo/apps.mjs`, buat `demo/<template>/config.mjs` (+ `overlay/`), jalankan `demo:build`. Bila `next build` gagal, galatnya
biasanya menunjuk bagian yang butuh server (`searchParams`, server action, `fetch('/api…')`) — ganti dengan halaman statis atau simulasi.
`demo:verify` dan `demo:e2e` menangkap sisanya.
