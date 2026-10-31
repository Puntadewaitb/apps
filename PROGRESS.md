# PROGRESS

Sumber kebenaran status. Aturan lengkap: `PLAN.md` §1.
Status: `todo` · `in_progress` · `wip` · `done` · `blocked`. Waktu dalam WIB (`YYYY-MM-DD HH:mm`).
Urutan baris = urutan eksekusi. Step dipilih jika semua `deps`-nya `done`.

| id | judul | deps | status | waktu WIB | catatan |
|---|---|---|---|---|---|
| 0.1 | Inisialisasi monorepo | - | in_progress | 2026-11-01 00:09 | |
| 0.2 | packages/config | 0.1 | todo | | |
| 0.3 | packages/ui | 0.2 | todo | | |
| 0.4 | packages/core | 0.2 | todo | | |
| 0.5 | Testing & CI | 0.3, 0.4 | todo | | |
| 0.6 | Script & dokumentasi | 0.5 | todo | | |
| L1 | Landing: Scaffold | 0.6 | todo | | |
| L2 | Landing: Section utama | L1 | todo | | |
| L3 | Landing: Social proof & konversi | L2 | todo | | |
| L4 | Landing: Form lead | L3 | todo | | |
| L5 | Landing: SEO & tema | L4 | todo | | |
| L6 | Landing: QA | L5 | todo | | |
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
