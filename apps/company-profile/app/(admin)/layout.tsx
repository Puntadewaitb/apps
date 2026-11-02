import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteShell } from "../../components/SiteShell";
import "../globals.css";

// Area admin: hanya Bahasa Indonesia, tidak diindeks.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme="netral">
      <body>
        <SiteShell lang="id" switcher={false}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
