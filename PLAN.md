# PLAN — 5 Template Website Siap Jual

Monorepo berisi 5 template website (Indonesia) yang siap pakai / tinggal modif.
Dikerjakan bertahap oleh Claude Code (cloud scheduled task), **42 step**, target **6 step per malam**.
Jadwal berjalan **sampai semua step `done`** (perkiraan 7–9 malam; step yang `wip`/`blocked`/kena usage limit menggeser selesai, bukan menggagalkan).

> Revisi 2: protokol disesuaikan dengan batasan environment cloud (lihat §2 dan §3) — hasil verifikasi di container.

---

## 1. Protokol Run (WAJIB dibaca tiap sesi)

Tiap sesi = **container baru** (tidak ada file/state tersisa dari run sebelumnya). Satu-satunya memori antar-run adalah isi git. Jangan andalkan file lokal, lock file, atau `node_modules` lama.

**Branch kerja tetap: `claude/determined-turing-qzp8w9`.** Semua commit & push ke branch ini. Jangan push ke `main` atau branch lain, jangan buat PR. (Merge ke `main` dilakukan manual oleh pemilik repo setelah selesai.)

### Status step di `PROGRESS.md`
| Status | Arti |
|---|---|
| `todo` | belum dikerjakan |
| `in_progress` | sedang dikerjakan run aktif (punya timestamp klaim) |
| `wip` | dijeda dengan rapi (usage limit / batas waktu); **langsung boleh dilanjutkan** run berikutnya |
| `done` | selesai & lolos verifikasi (punya timestamp selesai) |
| `blocked` | gagal setelah 2 kali perbaikan; **tidak dicoba ulang otomatis** |

### Urutan kerja
1. **Siapkan repo.** Run berjalan sebagai Routine claude.ai dengan repo `puntadewaitb/apps` sudah ter-clone otomatis (default branch repo = branch kerja). Pastikan `git branch --show-current` = `claude/determined-turing-qzp8w9`; kalau bukan: `git fetch origin claude/determined-turing-qzp8w9 && git checkout claude/determined-turing-qzp8w9`. Lalu `git pull --ff-only`. **Kalau repo tidak ada di container: stop dan laporkan.** Jangan `git clone` manual (token tidak valid) dan jangan cari tool `add_repo` (tidak tersedia di Routine).
2. **Baca** `PLAN.md`, `PROGRESS.md`, `config.json`.
3. **Cek window.** Kalau jam WIB sekarang di luar `window` (23:00–05:00) → **stop** tanpa mengubah apa pun, kecuali prompt Routine memuat kata `ABAIKAN-WINDOW` (dipakai untuk uji manual).
4. **Hitung kuota malam ini.** "Malam ini" = sejak **23:00 WIB terakhir yang sudah lewat** (jadi run jam 00–04 tetap menghitung dari 23:00 hari sebelumnya). Hitung step `done` dengan timestamp ≥ itu. Kalau ≥ `max_steps_per_night` → **stop**.
5. **Kondisi berhenti lain** (tulis satu baris di bagian "Log Run" `PROGRESS.md`, commit, push, stop):
   - semua step `done` → tulis `ALL DONE` (lihat §4, "Setelah selesai");
   - tidak ada step yang eligible (semua sisa `blocked` atau dependensinya `blocked`) → tulis `STUCK: <daftar blocked>`; **jangan** mengerjakan apa pun.
6. **Pilih step** (urut sesuai tabel `PROGRESS.md`):
   1. ada `wip` → ambil itu;
   2. ada `in_progress` dengan timestamp **> 55 menit** (run sebelumnya mati) → ambil alih;
   3. ada `in_progress` dengan timestamp ≤ 55 menit → run lain masih jalan → **stop**;
   4. selain itu: `todo` pertama yang semua dependensinya (kolom `deps`) `done`.
7. **Klaim.** Ubah status jadi `in_progress` + timestamp WIB, commit `[<ID>] claim`, `git push`. Kalau push ditolak (non-fast-forward): `git pull --rebase`, evaluasi ulang sekali; kalau step itu sudah diklaim run lain → stop.
8. **Siapkan environment.** Node 22 sudah ada. Jalankan `npm ci` (bila `package.json` sudah ada). Untuk Playwright: `export PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`. **Jangan** `npx playwright install`.
9. **Kerjakan** step sesuai deskripsi. Hanya satu step per run. Commit + push `[<ID>] WIP: <ringkas>` setelah tiap kelompok sub-bullet selesai (bukan cuma di akhir), supaya run yang mati tidak kehilangan pekerjaan.
10. **Batas waktu.** Jam kerja efektif per run ±50 menit sejak mulai. Kalau mendekati batas atau kena usage limit: commit pekerjaan, set status `wip`, catat apa yang sudah/belum di kolom catatan, push, **stop**.
11. **Verifikasi:** semua poin "Selesai jika" milik step + `npm run lint` + `npm run typecheck` (+ `npm test` bila ada unit test) untuk app/package yang disentuh.
12. **Kalau gagal:** perbaiki maksimal 2 kali. Masih gagal → status `blocked` + ringkasan error di catatan, commit, push, stop.
13. **Kalau lolos:** status `done` + timestamp WIB, commit `[<ID>] <judul step>`, push.

**Push gagal:** non-fast-forward → `git pull --rebase` lalu push ulang (maks 3x). Error jaringan → retry dengan backoff 2s/4s/8s/16s.

### Aturan umum
- Satu run = maksimal satu step.
- Jangan mengubah step `done` kecuali untuk memperbaiki bug yang memblokir step berjalan (catat di `PROGRESS.md`).
- Semua teks UI **Bahasa Indonesia**, brand **fiktif**.
- Tidak ada secret di repo. Pakai `.env.example`; kredensial admin di seed hanya untuk development.
- **Tidak ada download dari luar registry npm.** Jaringan cloud dibatasi (lihat §3). Gambar demo = **SVG placeholder buatan sendiri** (gradient/ikon/pola) di `public/img/`, bukan foto Unsplash/Pexels (host diblok). `CREDITS.md` mencatat bahwa semua aset demo adalah placeholder original; pembeli mengganti dengan foto sendiri.
- **Font:** `next/font/local` (file font disimpan di repo, lisensi OFL dicatat di `CREDITS.md`) atau system font stack. Jangan `next/font/google` dan jangan `<link>` CDN.
- **Versi dependency terkunci** (§2). Jangan upgrade / pakai `@latest`. Install selalu `--save-exact`. `package-lock.json` wajib di-commit.
- **Test tidak boleh bergantung pada internet luar.** Embed Google Maps: assert atribut `src`/`title` iframe saja. Tautan WhatsApp (`wa.me`): assert `href`, jangan navigasi. Jangan `waitUntil: 'networkidle'`.

### `config.json`
```json
{
  "timezone": "Asia/Jakarta",
  "branch": "claude/determined-turing-qzp8w9",
  "window": { "start": "23:00", "end": "05:00" },
  "max_steps_per_night": 6,
  "stale_claim_minutes": 55,
  "run_budget_minutes": 50
}
```
Kalau kuota mepet, turunkan `max_steps_per_night` (mis. 4).

---

## 2. Stack & versi terkunci

Diverifikasi di container cloud (Node 22.23, npm 10.9) per 2026-10-31. Tag `latest` banyak yang sudah berubah drastis (mis. Prisma 8 RC, TypeScript 7) — **jangan pakai `latest`**.

| Bagian | Pilihan | Versi (exact) |
|---|---|---|
| Runtime | Node.js 22 LTS, npm workspaces | `.nvmrc` = `22` |
| Framework | Next.js (App Router) | `next@16.4.3`, `react@19.3.1`, `react-dom@19.3.1` |
| Bahasa | TypeScript | `typescript@5.9.3` (**bukan 7.x**), `@types/node@22` |
| Styling | Tailwind CSS v4 + tema bersama via CSS (`@theme`) | `tailwindcss@4.3.3`, `@tailwindcss/postcss@4.3.3` |
| Database | Prisma ORM + SQLite | `prisma@7.10.1`, `@prisma/client@7.10.1`, `@prisma/adapter-better-sqlite3@7.10.1`, `better-sqlite3` (exact, ikuti yang ter-install & lolos tes) |
| Auth admin | NextAuth.js v4 (credentials) + bcrypt | `next-auth@4.24.15`, `bcryptjs@3.0.3` |
| Validasi | Zod 4 | `zod@4.6.7` |
| Lint/format | ESLint flat config + Prettier | `eslint@10.14.0`, `eslint-config-next@16.4.3`, `prettier@3.9.10` |
| Test | Vitest + Playwright | `vitest@5.0.5`, `@playwright/test@1.63.0` (cocok dengan Chromium bawaan cloud) |
| Util | | `concurrently@10.0.6` |
| CI | GitHub Actions: lint, typecheck, build, e2e per app | |

Catatan teknis (sudah dites kecuali yang ditandai):
- **Next 16:** `next lint` sudah tidak ada → script `lint` = `eslint .`. `middleware.ts` diganti nama menjadi `proxy.ts` *(verifikasi di step S4)*. Build default Turbopack.
- **Prisma 7:** wajib `prisma.config.ts` per app (schema + `datasource.url` dari env). Runtime SQLite memakai driver adapter: `new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) })` — *dites: generate, migrate dev, dan query runtime lolos*. Ganti ke MySQL/PostgreSQL = ganti adapter + `provider` + `DATABASE_URL` (dokumentasikan di `CARA-MODIF.md`).
- **Tailwind v4:** tidak ada `tailwind.config.js`/preset; tema bersama = satu file CSS di `packages/config` yang di-`@import` tiap app.
- **NextAuth v4** dipilih karena stabil (v5/Auth.js masih beta) dan peer-nya mendukung Next 16 *(peer dicek; integrasi diverifikasi di S4)*.

Alasan: satu stack untuk semua app, deterministik untuk run tanpa pengawasan, cukup `npm run dev` lalu dibuka di browser.

### Struktur repo
```
/
├── apps/
│   ├── landing-page/      → http://localhost:3001
│   ├── company-profile/   → http://localhost:3002
│   ├── undangan/          → http://localhost:3003
│   ├── sekolah/           → http://localhost:3004
│   └── toko-online/       → http://localhost:3005
├── packages/
│   ├── config/   (tema CSS, tsconfig, eslint, prettier, playwright/vitest config)
│   ├── ui/       (design tokens & komponen bersama)
│   └── core/     (security headers, validasi, rate limit, sanitasi)
├── PLAN.md  PROGRESS.md  CLAUDE.md  config.json  CREDITS.md
└── .github/workflows/ci.yml
```

### Cara cek di browser (berlaku setelah semua selesai)
```bash
npm ci
npm run setup      # prisma generate + migrate + seed untuk semua app
npm run dev:all    # jalankan 5 app sekaligus
```
Buka `localhost:3001` s.d. `localhost:3005`. Login admin ada di `.env.example` tiap app.

---

## 3. Batasan environment cloud (hasil verifikasi)

| Hal | Status | Konsekuensi |
|---|---|---|
| `registry.npmjs.org` | ✅ | `npm ci` aman |
| Chromium di `/opt/pw-browsers/chromium` (v153) | ✅ | Playwright pakai `executablePath` dari `PW_CHROMIUM_PATH` |
| `cdn.playwright.dev`, `playwright.azureedge.net` | ❌ 403 | **Jangan** `playwright install` di cloud |
| `images.unsplash.com`, `images.pexels.com` | ❌ 403 | Gambar = SVG placeholder lokal |
| `www.google.com` (Maps) | ❌ 403 | Test Maps tidak boleh memuat iframe |
| `act` | tidak ada | CI tidak bisa dijalankan lokal; validasi YAML + jalankan command-nya langsung |
| Hasil CI GitHub | tidak dipantau run terjadwal | Jangan jadikan "CI hijau" syarat `done` per step (kecuali T8 — dicek manual pemilik repo) |

Playwright config bersama (`packages/config`): hanya project `chromium`; `launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH || undefined, args: ['--no-sandbox'] }`; `webServer` memakai build produksi (`next build && next start`) di port app.

---

## 4. Jadwal

- Jadwal = **Routine claude.ai** (cloud, sesi baru tiap fire, jalan tanpa HP/laptop terhubung), **dibuat lewat UI** claude.ai/code/routines dengan repo `puntadewaitb/apps` dipilih sebagai source dan environment `Bawaan`.
  - Kenapa bukan lewat tool `create_trigger` dari sesi lain: terbukti di dry-run 2026-10-31 bahwa trigger buatan tool itu tidak membawa repo (`sources: []`, tag `no-git-repo`), tidak punya tool `add_repo`, dan `GH_TOKEN`-nya invalid. Parameter `connectors` ditolak organisasi.
- Cron: `CRON_TZ=Asia/Jakarta 7 23,0,1,2,3,4 * * *` (6 run per malam; menit :07 untuk menghindari antrean jam :00). Kalau UI hanya menerima preset: pakai **hourly**; protokol (langkah 3) otomatis stop di luar window 23:00–05:00 WIB.
- **Default branch repo harus tetap `claude/determined-turing-qzp8w9`** selama pengerjaan (Routine meng-clone default branch). Jangan buat/merge ke `main` atau ganti default branch sebelum semua step `done`.
- Pengaturan Routine: izinkan push hanya ke branch `claude/*` (default). Jangan aktifkan push tak terbatas.
- Prompt tiap run: *"Repo puntadewaitb/apps sudah ter-clone. Ikuti 'Protokol Run' di PLAN.md (§1) dan baca CLAUDE.md. Kerjakan tepat satu step. Branch kerja: claude/determined-turing-qzp8w9. Jangan push ke branch lain, jangan buat PR."*
- **Prasyarat sebelum jadwal aktif:** satu kali "Run now" dengan prompt uji (memuat `ABAIKAN-WINDOW`) yang hanya meng-commit `.dryrun/*.txt` ke branch kerja — membuktikan repo ter-clone & push diizinkan.
- **Setelah selesai:** run yang menemukan semua step `done` menulis `ALL DONE` di `PROGRESS.md` dan stop. Pemilik repo menonaktifkan/menghapus Routine secara manual (run berikutnya akan langsung stop dengan biaya minimal).

### Perkiraan per malam (urutan eksekusi mengikuti `PROGRESS.md`, bukan tabel ini)
| Malam | Step |
|---|---|
| 1 | 0.1 – 0.6 (Core) |
| 2 | L1 – L6 (Landing Page) |
| 3 | U1 – U6 (Undangan) |
| 4 | U7, U8, C1 – C4 |
| 5 | C5, C6, S1 – S4 |
| 6 | S5 – S8, T1, T2 |
| 7 | T3 – T8 |

---

## 5. Step Detail

### FASE 0 — Core (6 step)

**0.1 Inisialisasi monorepo**
- File sudah dibuat manual saat bootstrap: `PLAN.md`, `PROGRESS.md`, `CLAUDE.md`, `config.json`, `.gitignore`. Jangan dibuat ulang.
- Buat: root `package.json` (npm workspaces `apps/*`, `packages/*`, `engines.node >=22`), `.npmrc` (`save-exact=true`), `.nvmrc` (`22`), `.editorconfig`, `README.md`, `CREDITS.md`.
- `package.json` root: devDependencies sesuai tabel §2 (typescript, eslint, prettier, vitest, concurrently, @playwright/test). Commit `package-lock.json`.
- Selesai jika: `npm ci` sukses di root (container bersih).

**0.2 packages/config**
- Tema CSS bersama (Tailwind v4 `@theme`: font, spacing, breakpoints), `tsconfig.base.json`, ESLint flat config (base + Next), Prettier, config Vitest & Playwright bersama (sesuai §3).
- Script root: `lint` (`eslint .`), `typecheck`.
- Selesai jika: lint & typecheck root jalan tanpa error.

**0.3 packages/ui**
- Design tokens via CSS variables + 3 palet tema (netral, hangat, hijau-islami).
- Komponen: Button, Container, Section, Navbar responsif, Footer, WhatsAppButton (floating), Card, Badge, Accordion, Modal, Lightbox, Toast, FormField.
- Selesai jika: unit test render tiap komponen lolos (Vitest).

**0.4 packages/core**
- Helper security headers untuk `next.config` (CSP ketat, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors).
- Util: skema Zod umum (nama, no HP Indonesia, email), sanitasi teks, honeypot anti-spam, rate limiter (in-memory, bisa diganti Redis), validator upload (tipe MIME + magic bytes + ukuran), generator token acak.
- Selesai jika: unit test untuk tiap util lolos.

**0.5 Testing & CI**
- Finalisasi Playwright & Vitest bersama (sesuai §3).
- `.github/workflows/ci.yml`: trigger push ke `main` dan `claude/**` + PR; matrix per app → `npm ci`, lint, typecheck, build, `npx playwright install --with-deps chromium`, e2e (di CI `PW_CHROMIUM_PATH` tidak di-set). App yang belum ada di-skip otomatis.
- Selesai jika: YAML valid (parse dengan script node/`yaml`), dan setiap command job berjalan sukses lokal pada app/package yang sudah ada. (Tidak menunggu hasil GitHub.)

**0.6 Script & dokumentasi**
- Script root: `dev:all` (concurrently, port 3001–3005), `setup`, `build:all`, `test:all` — semuanya men-skip app yang belum ada.
- `docs/CARA-MODIF.md`: pola umum ganti brand, warna, konten, logo, ganti DB (adapter Prisma), ganti font/foto.
- Selesai jika: `npm run dev:all` tidak error (app kosong boleh di-skip).

---

### FASE 1 — Landing Page (`apps/landing-page`, 6 step)

**L1 Scaffold**
- Next.js app port 3001, pakai `ui`, `core`, `config`. Semua konten di 1 file `content/site.ts`. Gambar = SVG placeholder lokal.
- Selesai jika: `next build` sukses dan halaman `/` merespons 200 dengan teks hero (cek lewat Playwright).

**L2 Section utama**
- Hero (headline, subheadline, CTA), problem–solution, keunggulan, showcase produk/jasa.
- Selesai jika: tidak ada horizontal overflow di 360px, 768px, 1280px (assert Playwright `scrollWidth <= innerWidth`).

**L3 Social proof & konversi**
- Testimoni (contoh), FAQ accordion, paket harga, CTA penutup, countdown promo (opsional via config).

**L4 Form lead**
- Form nama/WA/pesan → API route: Zod, honeypot, rate limit → simpan ke DB (Prisma 7 + adapter SQLite) → redirect ke WhatsApp dengan pesan terisi.
- `/admin/leads` dengan password dari env + export CSV.
- Selesai jika: submit valid tersimpan; submit invalid ditolak dengan pesan jelas.

**L5 SEO & tema**
- Metadata, OG image (dibuat dinamis/SVG→PNG lokal, tanpa fetch eksternal), sitemap, robots, structured data. Tracking (GA4/Meta Pixel) aktif hanya jika env diisi.
- Switch 3 tema lewat config. Optimasi gambar.

**L6 QA**
- Playwright: halaman load, CTA WA benar (assert `href`), form sukses & gagal, admin butuh password.
- `apps/landing-page/README.md` (cara modif + screenshot dari Playwright).
- Selesai jika: semua test lolos, build sukses.

---

### FASE 2 — Undangan Digital (`apps/undangan`, 8 step)

**U1 Scaffold & data**
- Port 3003. Prisma: `Event`, `Guest`, `Rsvp`, `Wish`. Seed 1 acara pernikahan demo.

**U2 Cover & nama tamu**
- Layar pembuka dengan nama tamu dari `?to=` (di-encode aman, panjang dibatasi), tombol "Buka Undangan", musik latar + toggle mute. File audio: generate/simpan lokal berlisensi bebas (atau placeholder senyap + petunjuk ganti di README); tanpa download.

**U3 Detail acara**
- Profil mempelai, akad & resepsi (tanggal, jam, lokasi, embed Google Maps), countdown, tombol simpan ke kalender (`.ics`).
- Test: assert `src` iframe Maps, jangan memuatnya.

**U4 Galeri & cerita**
- Galeri (placeholder SVG) + lightbox, timeline love story, embed video (opsional).

**U5 RSVP & ucapan**
- Form RSVP (hadir/tidak, jumlah orang) + ucapan & doa → API dengan validasi, sanitasi, rate limit, flag moderasi. Daftar ucapan auto-refresh.

**U6 Amplop digital**
- Daftar rekening/e-wallet dengan tombol salin, gambar QRIS (placeholder), alamat kirim hadiah.

**U7 Multi-tema & admin**
- 3 tema (elegan, floral, islami) + 3 jenis acara (pernikahan, aqiqah, khitan) via config.
- Admin: generator link per nama tamu (bulk dari daftar), rekap RSVP, moderasi ucapan, export CSV.

**U8 QA**
- Playwright: alur buka undangan, RSVP, ucapan. Test payload XSS di `?to=` dan di ucapan harus ter-escape. Viewport mobile.
- README + screenshot.

---

### FASE 3 — Company Profile (`apps/company-profile`, 6 step)

**C1 Scaffold**
- Port 3002. Konten berbasis file (MDX/JSON) supaya mudah diedit tanpa DB, kecuali form kontak.

**C2 Halaman inti**
- Beranda, Tentang (sejarah, visi-misi, tim), Layanan (daftar + halaman detail dinamis).

**C3 Portofolio & kredibilitas**
- Portofolio/proyek dengan filter kategori + detail, logo klien/partner (placeholder SVG), testimoni, angka pencapaian.

**C4 Blog & kontak**
- Blog/berita MDX (list, detail, kategori). Halaman kontak: form → DB (+ kirim email via SMTP jika env diisi), embed Maps, tombol WA.

**C5 SEO & bahasa**
- Schema.org `Organization`/`LocalBusiness`, sitemap, OG. Toggle Bahasa Indonesia/English.

**C6 QA**
- Playwright: navigasi semua halaman, filter portofolio, form kontak, switch bahasa. README + screenshot.

---

### FASE 4 — Sekolah / Pesantren / Yayasan (`apps/sekolah`, 8 step)

**S1 Scaffold & data**
- Port 3004. Prisma: `User`, `Post`, `Agenda`, `Gallery`, `Teacher`, `Registration`, `DonationProgram`, `Donation`. Seed data demo.

**S2 Halaman publik inti**
- Beranda, Profil (sejarah, visi-misi, struktur organisasi), Guru & Staf, Program/Ekstrakurikuler.

**S3 Informasi**
- Berita & pengumuman (list/detail), agenda (tampilan kalender + list), galeri album.

**S4 Auth & dashboard admin**
- NextAuth v4 credentials + bcrypt, session aman (httpOnly, sameSite), proteksi semua route `/admin` di `proxy.ts` (Next 16) **dan** cek sesi ulang di tiap route handler/server action, rate limit login. Layout dashboard + ringkasan.
- Selesai jika: request ke `/admin/*` tanpa sesi → redirect/401; login benar → akses OK. (Konfirmasi nama file `proxy.ts` vs `middleware.ts` terhadap Next 16.4.3 dan catat di PROGRESS.)

**S5 CRUD konten**
- Kelola berita (editor rich text, upload gambar tervalidasi), agenda, galeri, guru.

**S6 PPDB online**
- Form pendaftaran multi-step (data siswa, orang tua, upload dokumen dengan validasi tipe/ukuran) → nomor pendaftaran + token acak.
- Cek status pakai nomor + token (bukan ID berurutan).
- Admin: review, ubah status, catatan, export CSV.

**S7 Donasi / infaq**
- Program donasi dengan target & progress bar, form konfirmasi transfer + upload bukti. Admin verifikasi → progress ter-update.

**S8 QA**
- Playwright: login, CRUD, alur PPDB end-to-end, donasi.
- Test otorisasi: route admin tanpa login ditolak; status PPDB tidak bisa diakses tanpa token yang benar.
- README + screenshot.

---

### FASE 5 — Toko Online (`apps/toko-online`, 8 step)

**T1 Scaffold & data**
- Port 3005. Prisma: `User`, `Category`, `Product`, `Variant`, `Order`, `OrderItem`, `Voucher`, `Setting`. Seed 20 produk (gambar placeholder SVG).

**T2 Katalog**
- Beranda toko, list produk (filter kategori, search, sort, pagination), detail produk (galeri, pilihan varian, stok).

**T3 Keranjang**
- Keranjang client-side (persist localStorage), mini-cart, ubah qty, hapus item.

**T4 Checkout**
- Form pembeli, ongkir dari tabel manual (flat/per kota), voucher.
- **Harga, ongkir, dan diskon dihitung ulang di server** (abaikan harga dari client), stok dikunci saat order.
- Order tersimpan → redirect ke WhatsApp dengan ringkasan + info pembayaran (rekening/QRIS).

**T5 Lacak pesanan**
- Cek status dengan kode order + no HP, upload bukti bayar.

**T6 Admin produk**
- Auth admin, dashboard (order hari ini, omzet), CRUD kategori/produk/varian, upload gambar, manajemen stok.

**T7 Admin pesanan & pengaturan**
- Ubah status order, invoice siap cetak, export CSV. Pengaturan toko (nama, nomor WA, rekening, tabel ongkir).

**T8 QA final**
- Playwright: alur belanja penuh, admin CRUD, update status.
- Test keamanan: manipulasi harga/qty di request, akses order milik orang lain, upload file berbahaya → semua harus ditolak.
- Integrasi: `npm ci && npm run setup && npm run dev:all` menjalankan kelima app; `npm run build:all` dan `npm run test:all` lolos (lokal).
- README root diperbarui (daftar app, port, akun demo, screenshot). Hasil CI GitHub dicek manual oleh pemilik repo.
