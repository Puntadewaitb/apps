import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const theme = ["netral", "hangat", "hijau"].includes(process.env.NEXT_PUBLIC_THEME ?? "")
  ? process.env.NEXT_PUBLIC_THEME
  : "hangat";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003"),
  title: "Undangan Pernikahan",
  description: "Undangan pernikahan digital.",
  robots: { index: false, follow: false }, // undangan bersifat pribadi
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
