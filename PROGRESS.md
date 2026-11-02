# PROGRESS

Sumber kebenaran status. Aturan lengkap: `PLAN.md` §1.
Status: `todo` · `in_progress` · `wip` · `done` · `blocked`. Waktu dalam WIB (`YYYY-MM-DD HH:mm`).
Urutan baris = urutan eksekusi. Step dipilih jika semua `deps`-nya `done`.

| id | judul | deps | status | waktu WIB | catatan |
|---|---|---|---|---|---|
| 0.1 | Inisialisasi monorepo | - | done | 2026-11-01 00:14 | npm ci bersih OK; apps/ dan packages/ berisi .gitkeep (hapus saat diisi) |
| 0.2 | packages/config | 0.1 | done | 2026-11-01 01:20 | lint+typecheck+prettier OK; next/react jadi devDep @tpl/config (peer eslint-config-next); rule no-html-link-for-pages dimatikan |
| 0.3 | packages/ui | 0.2 | done | 2026-11-01 02:25 | 18 tes (renderToStaticMarkup, tanpa jsdom); oxc jsx automatic di vitest base; app wajib @source ke packages/ui/src (lihat packages/ui/README.md); test root = npm test --workspaces |
| 0.4 | packages/core | 0.2 | done | 2026-11-01 03:25 | 27 tes; CSP tanpa nonce masih pakai unsafe-inline script (syarat hidrasi Next) — nonce via proxy.ts opsional; rate limiter in-memory (Redis lewat RateLimitStore) |
| 0.5 | Testing & CI | 0.3, 0.4 | done | 2026-11-01 04:25 | ci.yml valid (npm run ci:validate, yaml@2.9.1); job check dijalankan lokal OK incl. smoke Playwright @tpl/config (PW_CHROMIUM_PATH); job app (build/e2e) belum bisa diuji lokal — belum ada app |
| 0.6 | Script & dokumentasi | 0.5 | done | 2026-11-01 21:56 | catchup: dev:all/setup/build:all/test:all lewat scripts/apps.mjs (skip app kosong; diuji dengan app palsu sementara, sudah dihapus); docs/CARA-MODIF.md; cuplikan adapter pg/mariadb belum diuji end-to-end (diuji di step app ber-DB) |
| L1 | Landing: Scaffold | 0.6 | done | 2026-11-01 23:12 | next build OK; 3 tes e2e (hero 200, href wa.me, security headers); Tailwind/tema terverifikasi via computed style; app/page.tsx baru hero+navbar+footer+WA — section lain di L2 |
| L2 | Landing: Section utama | L1 | done | 2026-11-02 00:11 | 9 tes e2e (overflow 360/768/1280 + asersi overflow dibuktikan bisa mendeteksi, section, gambar termuat, menu mobile); bagian kontak sementara CTA WA — form lead di L4 |
| L3 | Landing: Social proof & konversi | L2 | done | 2026-11-02 01:11 | testimoni, FAQ (Accordion), CTA penutup, countdown promo via site.promo (jam dikunci pakai page.clock); 4 unit + 15 e2e; "paket harga" = section #paket dari L2 (tidak diduplikasi); label countdown h/j/m/d |
| L4 | Landing: Form lead | L3 | done | 2026-11-02 02:15 | Prisma 7 + better-sqlite3; /api/leads (Zod, honeypot, rate limit, cek Origin), redirect WA; /admin/leads (cookie HMAC, password env, fail-closed) + CSV anti-formula-injection; 14 unit + 29 e2e (DB e2e terpisah); root typecheck dibatasi ke packages, app via script sendiri (butuh prisma generate); rate limit bergantung X-Forwarded-For (lihat CARA-MODIF) |
| L5 | Landing: SEO & tema | L4 | done | 2026-11-02 03:14 | metadata+OG PNG (next/og, lokal)+robots+sitemap+JSON-LD (tanpa aggregateRating); tracking GA4/Pixel via env tervalidasi + CSP dinamis (jalur aktif diuji manual, e2e hanya jalur mati); tema via site.theme/NEXT_PUBLIC_THEME; 24 unit + 40 e2e; gambar SVG: lazy/fetchpriority/cache 7 hari (tanpa svgo) |
| L6 | Landing: QA | L5 | done | 2026-11-02 04:12 | 47 e2e + 24 unit lolos, build OK; temuan QA: 404 bawaan Next berbahasa Inggris → app/not-found.tsx + error.tsx Bahasa Indonesia; qa.spec (tanpa error konsol, a11y dasar, anchor valid, keyboard); README + 5 screenshot (SCREENSHOTS=1, jam dikunci) |
| U1 | Undangan: Scaffold & data | 0.6 | done | 2026-11-03 00:09 | Prisma Event/Guest/Rsvp/Wish (status RSVP = String, divalidasi app); seed idempotent via Node type-stripping (generator importFileExtension=ts + package type=module); halaman utama dinamis dari DB; 3 unit + 5 e2e; setup = generate+migrate+seed |
| U2 | Undangan: Cover & nama tamu | U1 | done | 2026-11-03 00:14 | cover dialog + ?to= (sanitasi, maks 60, XSS diuji) + Buka Undangan (scroll/inert dibuka, fokus ke konten) + toggle musik; audio = placeholder senyap WAV (petunjuk ganti di README); 9 unit + 14 e2e; musik hanya diuji state play/pause (headless, tanpa suara) |
| U3 | Undangan: Detail acara | U2 | done | 2026-11-03 00:33 | profil mempelai, akad&resepsi (lokasi terpisah; migrasi resepsiVenue*), Maps (iframe diuji src/title, jaringan Google diblok), countdown (pad/remaining dipindah ke @tpl/core), .ics (/api/kalender, RFC5545 escape+folding); URL Maps dari DB wajib embed www.google.com HTTPS; 17 unit + 25 e2e |
| U4 | Undangan: Galeri & cerita | U3 | done | 2026-11-03 00:39 | galeri 6 SVG + Lightbox (ui: fokus ke tombol tutup, kembali ke thumbnail, scroll terkunci, thumbnail lazy), timeline cerita (content/undangan.ts), video YouTube-nocookie opsional (default kosong; jalur aktif diuji manual: iframe + CSP melebar); 22 unit + 32 e2e |
| U5 | Undangan: RSVP & ucapan | U4 | done | 2026-11-03 01:22 | /api/rsvp (Zod, pax dibatasi maxPax tamu, ?kode= memperbarui RSVP, honeypot, Origin, rate limit 5/10mnt) + /api/ucapan (GET paginasi cursor, POST; tautan/spam → visible=false; env WISH_MODERATION=on → semua perlu tinjau); daftar auto-refresh 15 dtk (dijeda saat tab tersembunyi); persetujuan ucapan di admin = U7; 30 unit + 49 e2e |
| U6 | Undangan: Amplop digital | U5 | done | 2026-11-03 01:27 | rekening/e-wallet + QRIS placeholder (berlabel PLACEHOLDER) + alamat hadiah di content/undangan.ts (semua FIKTIF); tombol salin: Clipboard API → fallback execCommand → pesan gagal (3 jalur diuji); 37 unit + 56 e2e |
| U7 | Undangan: Multi-tema & admin | U6 | done | 2026-11-03 02:22 | 3 tema (elegan/floral/islami; kontras WCAG AA diuji otomatis) + 3 jenis (pernikahan/aqiqah/khitan) per acara di DB (migrasi jenis,tema; seed 3 acara); admin (server actions + cookie undangan_admin): ringkasan, tamu massal+tautan pribadi+WA, rekap RSVP, moderasi ucapan, ekspor CSV anti-formula, pratinjau baca-saja; 58 unit + 73 e2e. Catatan: tema bukan lagi env NEXT_PUBLIC_THEME |
| U8 | Undangan: QA | U7 | done | 2026-11-03 02:31 | qa.spec (ponsel 390x844): alur tamu penuh tanpa error konsol/CSP, XSS (?to=, ucapan, data kotor langsung di DB → publik+admin tetap teks; detektor diuji dengan kontrol positif), a11y dasar, keyboard, ukuran sentuh; README + 14 screenshot (SCREENSHOTS=1); 58 unit + 83 e2e (3 skip = screenshot) |
| C1 | Company: Scaffold | 0.6 | done | 2026-11-03 03:15 | port 3002; konten file-based (content/id.ts) + skema Zod (href aman, WA 62…) + getKonten(lang) siap i18n (EN di C5); hero/kontak/WA; 5 unit + 10 e2e; tanpa MDX/DB dulu (blog di C4: pilih parser Markdown saat itu) |
| C2 | Company: Halaman inti | C1 | done | 2026-11-03 03:23 | Beranda (layanan ringkas + keunggulan), Tentang (visi-misi, nilai, timeline, tim), Layanan (daftar + detail dinamis via generateStaticParams, dynamicParams=false → slug tak dikenal 404), konten/skema Zod terintegrasi (slug unik, terkait valid); e2e termasuk crawler tautan internal; 9 unit + 23 e2e. Form kontak masih info statis di beranda — halaman kontak penuh di C4 |
| C3 | Company: Portofolio & kredibilitas | C2 | todo | | |
| C4 | Company: Blog & kontak | C3 | todo | | |
| C5 | Company: SEO & bahasa | C4 | todo | | |
| C6 | Company: QA | C5 | todo | | |
| S1 | Sekolah: Scaffold & data | 0.6 | todo | | |
| S2 | Sekolah: Halaman publik inti | S1 | todo | | |
| S3 | Sekolah: Informasi | S2 | todo | | |
| S4 | Sekolah: Auth & dashboard admin | S1 | todo | | |
| S5 | Sekolah: CRUD konten | S3, S4 | todo | | |
| S6 | Sekolah: PPDB online | S4 | todo | | |
| S7 | Sekolah: Donasi / infaq | S4 | todo | | |
| S8 | Sekolah: QA | S5, S6, S7 | todo | | |
| T1 | Toko: Scaffold & data | 0.6 | todo | | |
| T2 | Toko: Katalog | T1 | todo | | |
| T3 | Toko: Keranjang | T2 | todo | | |
| T4 | Toko: Checkout | T3 | todo | | |
| T5 | Toko: Lacak pesanan | T4 | todo | | |
| T6 | Toko: Admin produk | T1 | todo | | |
| T7 | Toko: Admin pesanan & pengaturan | T4, T6 | todo | | |
| T8 | Toko: QA final & integrasi | T5, T7, L6, U8, C6, S8 | todo | | |

## Log Run
<!-- Satu baris per kejadian penting: STUCK / ALL DONE / koreksi step done. Format: `YYYY-MM-DD HH:mm WIB — pesan` -->
- 2026-10-31 — Bootstrap: PLAN.md rev.2, PROGRESS.md, CLAUDE.md, config.json, .gitignore dibuat manual.
- 2026-11-02 15:20 WIB — Atas permintaan pemilik: max_steps_per_night 6→12, steps_per_run=2 (cron tetap 6 slot; interval <1 jam ditolak platform).
