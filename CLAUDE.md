# CLAUDE.md

Repo ini dikerjakan bertahap oleh sesi Claude Code terjadwal (container baru tiap run).

**Sebelum bekerja, baca `PLAN.md` §1 "Protokol Run", lalu `PROGRESS.md` dan `config.json`.**

Ringkasan yang tidak boleh terlewat:
- Satu run = satu step. Branch kerja: `claude/determined-turing-qzp8w9`. Jangan push ke branch lain, jangan buat PR.
- Satu-satunya memori antar-run adalah git: klaim step & status di `PROGRESS.md`, commit WIP sering.
- Versi dependency terkunci (PLAN.md §2). Jangan pakai `@latest`; install dengan `--save-exact`.
- Hanya registry npm yang bisa diakses. Playwright pakai `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`, jangan `playwright install`. Gambar demo = SVG placeholder lokal.
- UI Bahasa Indonesia, brand fiktif, tidak ada secret di repo.
