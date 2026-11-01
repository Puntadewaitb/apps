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
| L6 | Landing: QA | L5 | in_progress | 2026-11-02 04:08 | |
| U1 | Undangan: Scaffold & data | 0.6 | todo | | |
| U2 | Undangan: Cover & nama tamu | U1 | todo | | |
| U3 | Undangan: Detail acara | U2 | todo | | |
| U4 | Undangan: Galeri & cerita | U3 | todo | | |
| U5 | Undangan: RSVP & ucapan | U4 | todo | | |
| U6 | Undangan: Amplop digital | U5 | todo | | |
| U7 | Undangan: Multi-tema & admin | U6 | todo | | |
| U8 | Undangan: QA | U7 | todo | | |
| C1 | Company: Scaffold | 0.6 | todo | | |
| C2 | Company: Halaman inti | C1 | todo | | |
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
