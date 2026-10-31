# @tpl/core

Util keamanan & validasi bersama. Semua fungsi bebas dependensi Node-only (jalan di Edge/Web Crypto), kecuali `zod`.

- `securityHeaders` / `nextSecurityHeaders` / `buildCsp` — header untuk `next.config` (`async headers() { return nextSecurityHeaders({ frameSrc: [...] }); }`). Tanpa `nonce`, CSP memakai `'unsafe-inline'` pada script (syarat hidrasi Next); untuk yang lebih ketat, buat nonce di `proxy.ts`.
- `nameSchema`, `phoneIdSchema` (normalisasi ke `62…`), `emailSchema`, `messageSchema` — skema Zod 4.
- `sanitizeText`, `escapeHtml` — sanitasi input teks biasa (bukan pengganti escaping output).
- `isHoneypotTripped`, `isSubmittedTooFast` — anti-spam form.
- `createRateLimiter`, `MemoryRateLimitStore`, `getClientIp` — rate limit in-memory (ganti `RateLimitStore` dengan Redis untuk multi-instance).
- `validateUpload`, `detectType` — cek ukuran + magic bytes + kecocokan MIME (SVG sengaja ditolak).
- `randomToken`, `randomCode` — CSPRNG.
