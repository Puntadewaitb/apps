# CLAUDE.md

Repo ini dikerjakan bertahap oleh sesi Claude Code terjadwal (container baru tiap run).

**Sebelum bekerja, baca `PLAN.md` §1 "Protokol Run", lalu `PROGRESS.md` dan `config.json`.**

Ringkasan yang tidak boleh terlewat:
- Run = pesan "RUN BARU" ke worker session (repo sudah jadi source session). Container bisa baru: selalu `git pull --ff-only` dulu, lalu `npm ci`. Kalau repo tidak ada, stop dan laporkan (jangan `git clone` manual, token tidak valid).
- Pesan berawalan `CATCH-UP` = Mode Catch-up (PLAN.md §1): tutup backlog malam kemarin, boleh >1 step, window diabaikan.
- Di luar window 23:00–05:00 WIB → stop, kecuali prompt memuat `ABAIKAN-WINDOW`.
- Satu run = maksimal `steps_per_run` step (config.json), satu per satu. Branch kerja: `claude/determined-turing-qzp8w9`. Jangan push ke branch lain, jangan buat PR.
- Satu-satunya memori antar-run adalah git: klaim step & status di `PROGRESS.md`, commit WIP sering.
- Versi dependency terkunci (PLAN.md §2). Jangan pakai `@latest`; install dengan `--save-exact`.
- Hanya registry npm yang bisa diakses. Playwright pakai `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`, jangan `playwright install`. Gambar demo = SVG placeholder lokal.
- UI Bahasa Indonesia, brand fiktif, tidak ada secret di repo.
