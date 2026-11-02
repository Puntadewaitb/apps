import type { ReactNode } from "react";
import { Container } from "@tpl/ui";
import { LogoutButton } from "../../../components/admin/LogoutButton";
import { can, type Area } from "../../../lib/auth-core";
import { requireAdmin } from "../../../lib/session";

const MENU: Array<{ href: string; label: string; area: Area }> = [
  { href: "/admin", label: "Ringkasan", area: "ringkasan" },
  { href: "/admin/berita", label: "Berita", area: "berita" },
  { href: "/admin/agenda", label: "Agenda", area: "agenda" },
  { href: "/admin/galeri", label: "Galeri", area: "galeri" },
  { href: "/admin/guru", label: "Guru & Staf", area: "guru" },
  { href: "/admin/ppdb", label: "PPDB", area: "ppdb" },
];

/** Kerangka panel admin. Pemeriksaan sesi di sini hanya kenyamanan — setiap halaman & action memeriksa ulang. */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <header className="border-b border-border bg-bg">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
          <nav aria-label="Menu admin" className="flex flex-wrap items-center gap-1">
            <a href="/" className="mr-3 text-sm font-bold text-fg">
              ← Situs
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
