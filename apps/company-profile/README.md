# Company Profile (demo)

Template website profil perusahaan **dua bahasa (Indonesia & English)**. Nama perusahaan, alamat, dan kontak di dalamnya **fiktif**.

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
| `content/id.ts` · `content/en.ts` | Perusahaan, navigasi, kontak (+ alamat terstruktur untuk JSON-LD), hero, keunggulan, footer. **`en.ts` bertipe sama dengan `id.ts`** — field yang kurang/lebih = error TypeScript |
| `content/ui.id.ts` · `ui.en.ts` | Teks antarmuka (tombol, label form, pesan galat, 404, dll.) |
| `content/layanan.{id,en}.ts` | Daftar layanan — tiap entri otomatis punya halaman `/layanan/<slug>` |
| `content/tentang.{id,en}.ts` | Sejarah, visi-misi, nilai, tim |
| `content/portofolio.{id,en}.ts` | Kategori & proyek portofolio (tiap proyek otomatis punya `/portofolio/<slug>`) |
| `content/kredibilitas.{id,en}.ts` | Angka pencapaian, logo klien/mitra, testimoni |
| `lib/konten-schema.ts` | Skema Zod untuk memvalidasi konten (dijalankan di `npm test`) |
| `content/blog.{id,en}.ts` | Judul & kategori blog |
| `content/blog/*.md` · `content/blog/en/*.md` | Artikel blog (Markdown + front matter) per bahasa — slug yang sama di kedua folder |
| `public/img/` | Gambar demo (SVG placeholder — ganti dengan milik Anda) |

`href` di konten hanya boleh path internal (`/…`), `#anchor`, `https://…`, atau `WHATSAPP` (diubah menjadi tautan wa.me berisi pesan awal). Skema menolak `javascript:` dan sejenisnya.

## Bahasa (ID/EN) & SEO

- **URL**: Indonesia tanpa awalan (`/layanan`), English berawalan `/en` (`/en/layanan`). Pengalih bahasa (ID | EN) ada di navbar dan memindahkan ke halaman yang sama; berupa tautan biasa sehingga jalan tanpa JavaScript.
- **Struktur**: semua halaman ada di `app/(site)/[lang]/…`. `proxy.ts` me-rewrite URL tanpa awalan ke `/id/…` (URL browser tetap bersih), mengarahkan `/id/…` → tanpa awalan (satu URL kanonik, 308), dan merewrite URL yang bukan halaman dikenal ke halaman 404 dengan status 404. Area admin (`app/(admin)`) hanya Indonesia dan tidak diindeks.
- **Menambah bahasa**: tambahkan kode di `lib/i18n.ts` (`LANGS`), buat `content/<kode>.ts`, `ui.<kode>.ts`, berkas konten per halaman, dan `content/blog/<kode>/`. Tipe TypeScript + `lib/seo.test.ts` memastikan struktur dan slug identik.
- **Menambah halaman/slug**: slug layanan, proyek, kategori, dan artikel **harus sama** di semua bahasa (diuji) agar hreflang timbal-balik. Tautan internal di artikel EN memakai awalan `/en/…` (diuji).
- **SEO**: `<title>`/description per halaman, `canonical` + `hreflang` (id, en, x-default), Open Graph & Twitter Card (gambar 1200×630 dibuat di `/og/<lang>`), `sitemap.xml` (dua bahasa + alternatif hreflang), `robots.txt` (blokir `/admin`, `/api/`), dan JSON-LD schema.org: `ProfessionalService` (LocalBusiness) + `WebSite` di beranda/kontak, `Service` di detail layanan, `BlogPosting` di artikel, `BreadcrumbList` di halaman detail.
- **Production**: set `NEXT_PUBLIC_SITE_URL` (mis. `https://www.contoh.com`) agar canonical, sitemap, dan Open Graph memakai domain sebenarnya. Isi `kontak.struktur` (alamat & jam buka) di `content/id.ts`/`en.ts` untuk JSON-LD.
- **Catatan**: berkas statis baru di `public/` selain `/img` dan berkas ber-ekstensi di root harus ditambahkan ke pengecualian `matcher` di `proxy.ts`, kalau tidak URL-nya akan dianggap 404.

## Halaman

| Rute | Isi |
|---|---|
| `/` · `/en` | Hero, ringkasan layanan, keunggulan, kontak |
| `/tentang` | Visi & misi, nilai, perjalanan (timeline), tim |
| `/layanan` | Daftar layanan |
| `/portofolio` | Daftar proyek + filter kategori (`?kategori=<id>`, berbasis URL sehingga jalan tanpa JavaScript) |
| `/portofolio/<slug>` | Detail proyek: tantangan, solusi, hasil, proyek serupa |
| `/blog` · `/blog/kategori/<id>` · `/blog/<slug>` | Daftar artikel, per kategori, dan detail |
| `/kontak` | Formulir → database (+ email SMTP opsional), info kontak, Google Maps, tombol WhatsApp |
| `/admin/pesan` | Pesan masuk (login `ADMIN_PASSWORD`) + ekspor CSV |
| `/layanan/<slug>` | Detail: deskripsi, manfaat, tahapan kerja, hasil, FAQ, layanan terkait. Hanya slug di konten yang valid, selain itu 404 |

Semua rute di atas tersedia juga dengan awalan `/en`.

**Menambah proyek:** tambahkan objek di `content/portofolio.id.ts` **dan** `portofolio.en.ts` (kategori harus salah satu id di `kategori`; tiap kategori wajib punya ≥ 1 proyek — diuji). Logo klien & gambar: `public/img/` (SVG placeholder, ganti dengan milik Anda).

**Menambah layanan:** tambahkan satu objek di `content/layanan.id.ts` dan `layanan.en.ts` (slug huruf kecil-tanda hubung, unik). Skema & unit test memeriksa slug unik, layanan terkait valid, dan struktur lengkap. Foto tim: ganti file `public/img/tim-*.svg` atau ubah path-nya di `content/tentang.id.ts`.

## Blog (Markdown)

Tambah artikel: buat `content/blog/<slug>.md` (dan `content/blog/en/<slug>.md`) dengan front matter:

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
