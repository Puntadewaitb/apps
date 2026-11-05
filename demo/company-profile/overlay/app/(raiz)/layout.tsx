// OVERLAY sample statis: layout akar terpisah untuk halaman "/" (alihan ke bahasa Indonesia). Di versi lengkap
// proxy.ts yang menangani bahasa; hosting statis tidak punya rewrite/redirect server.
import type { ReactNode } from "react";

export const metadata = { title: "Company Profile — contoh" };

export default function RaizLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body style={{ font: "16px/1.6 system-ui, sans-serif", padding: 24 }}>{children}</body>
    </html>
  );
}
