import type { ReactNode } from "react";
import { Container } from "@tpl/ui";
import { LogoutButton } from "../../../components/admin/LogoutButton";
import { can, type Area } from "../../../lib/auth-core";
import { requireAdmin } from "../../../lib/session";

const MENU: Array<{ href: string; label: string; area: Area }> = [
  { href: "/admin", label: "Ringkasan", area: "ringkasan" },
  { href: "/admin/produk", label: "Produk", area: "produk" },
  { href: "/admin/kategori", label: "Kategori", area: "kategori" },
  { href: "/admin/stok", label: "Stok", area: "stok" },
];

/** Kerangka panel admin. Pemeriksaan sesi di sini hanya kenyamanan — setiap halaman & action memeriksa ulang. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        Langsung ke konten utama
      </a>
      <header className="border-b border-border bg-bg">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
          <nav aria-label="Menu admin" className="flex flex-wrap items-center gap-1">
            <a href="/" className="mr-3 text-sm font-bold text-fg">
              ← Toko
            </a>
            {MENU.filter((m) => can(user.role, m.area)).map((m) => (
              <a
                key={m.href}
                href={m.href}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface"
              >
                {m.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm text-muted">
            <span>{user.email}</span>
            <LogoutButton />
          </div>
        </Container>
      </header>
      {children}
    </>
  );
}
