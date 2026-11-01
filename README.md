# 5 Template Website Siap Jual

Monorepo berisi 5 template website berbahasa Indonesia yang siap pakai atau tinggal dimodifikasi:

| App | Port |
|---|---|
| `apps/landing-page` | 3001 |
| `apps/company-profile` | 3002 |
| `apps/undangan` | 3003 |
| `apps/sekolah` | 3004 |
| `apps/toko-online` | 3005 |

Paket bersama: `packages/config`, `packages/ui`, `packages/core`.

## Memulai

```bash
nvm use          # Node 22
npm ci
npm run setup    # prisma generate + migrate + seed (app ber-DB)
npm run dev:all  # jalankan semua app (3001–3005)
```

Skrip lain: `build:all`, `test`, `test:e2e`, `test:all`, `lint`, `typecheck`. Semuanya melewati app yang belum ada.

Panduan memodifikasi template: [`docs/CARA-MODIF.md`](docs/CARA-MODIF.md). Rencana pengerjaan di `PLAN.md`, status di `PROGRESS.md`.

> Semua brand dan data pada template ini fiktif.
