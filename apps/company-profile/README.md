# Company Profile (demo)

Template website profil perusahaan berbahasa Indonesia. Nama perusahaan, alamat, dan kontak di dalamnya **fiktif**.

## Menjalankan

```bash
# dari root monorepo
npm ci
cp apps/company-profile/.env.example apps/company-profile/.env   # lalu sesuaikan
npm run setup -w @tpl/company-profile    # prisma generate + migrasi (DB pesan kontak)
npm run dev -w @tpl/company-profile      # http://localhost:3002
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
| `content/blog.id.ts` | Judul & kategori blog |
| `content/blog/*.md` | Artikel blog (Markdown + front matter) — satu berkas = satu artikel |
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
| `/blog` · `/blog/kategori/<id>` · `/blog/<slug>` | Daftar artikel, per kategori, dan detail |
| `/kontak` | Formulir → database (+ email SMTP opsional), info kontak, Google Maps, tombol WhatsApp |
| `/admin/pesan` | Pesan masuk (login `ADMIN_PASSWORD`) + ekspor CSV |
| `/layanan/<slug>` | Detail: deskripsi, manfaat, tahapan kerja, hasil, FAQ, layanan terkait. Hanya slug di konten yang valid, selain itu 404 |

**Menambah proyek:** tambahkan objek di `content/portofolio.id.ts` (kategori harus salah satu id di `kategori`; tiap kategori wajib punya ≥ 1 proyek — diuji). Logo klien & gambar: `public/img/` (SVG placeholder, ganti dengan milik Anda).

**Menambah layanan:** tambahkan satu objek di `content/layanan.id.ts` (slug huruf kecil-tanda hubung, unik). Skema & unit test memeriksa slug unik, layanan terkait valid, dan struktur lengkap. Foto tim: ganti file `public/img/tim-*.svg` atau ubah path-nya di `content/tentang.id.ts`.

## Blog (Markdown)

Tambah artikel: buat `content/blog/<slug>.md` dengan front matter:

```markdown
---
judul: Judul Artikel
tanggal: 2026-10-01
kategori: tips            # salah satu id di content/blog.id.ts
ringkas: Satu-dua kalimat ringkasan (min. 20 karakter).
penulis: Nama Penulis
gambar: /img/proyek-1.svg
---

Isi artikel dalam Markdown…
```

Berkas yang salah format membuat `build` gagal dengan pesan yang menyebut nama berkasnya (bukan hilang diam-diam).

**Mengapa Markdown, bukan MDX?** MDX mengeksekusi JavaScript dari isi artikel. Parser di `lib/markdown.ts` sengaja hanya mendukung subset aman: judul `##`/`###`, paragraf, daftar, kutipan `>`, blok kode, `---`, gambar lokal `/img/…`, serta **tebal**, *miring*, `kode`, dan tautan (`https://`, `/path`, `#anchor`, `mailto:`). HTML mentah tidak diinterpretasi dan tautan `javascript:` dibuang — diuji di `lib/markdown.test.ts`.

## Formulir kontak & email

`POST /api/kontak`: validasi Zod, honeypot, cek Origin, rate limit 5/10 menit/IP → simpan ke tabel `Pesan` → bila SMTP diatur (lihat `.env.example`) kirim email teks polos ke `MAIL_TO` dengan `Reply-To` pengirim. Kegagalan SMTP tidak menggagalkan pesan (tetap tersimpan, ditandai "Tidak terkirim" di admin). Header email dibersihkan dari CR/LF.

Di e2e, SMTP diarahkan ke server sink lokal (`e2e/smtp-sink.ts`, port 2525) sehingga email benar-benar diuji tanpa internet.

## Pengujian

```bash
npm run test -w @tpl/company-profile        # unit (Vitest)
npm run test:e2e -w @tpl/company-profile    # e2e (Playwright)
```

Tanpa unduhan browser: `PW_CHROMIUM_PATH=/path/ke/chromium`.
