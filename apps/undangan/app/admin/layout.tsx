import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button, Container } from "@tpl/ui";
import { isAdmin } from "../../lib/admin-auth";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const menu = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/tamu", label: "Tamu & Tautan" },
  { href: "/admin/rsvp", label: "RSVP" },
  { href: "/admin/ucapan", label: "Ucapan" },
  { href: "/admin/pratinjau", label: "Pratinjau" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const masuk = await isAdmin();
  return (
    <>
      {masuk && (
        <header className="border-b border-border bg-surface">
          <Container className="flex flex-wrap items-center justify-between gap-3 py-3">
            <nav aria-label="Menu admin" className="flex flex-wrap gap-4 text-sm font-medium">
              {menu.map((m) => (
                <a key={m.href} href={m.href} className="text-fg hover:text-primary">
                  {m.label}
                </a>
              ))}
            </nav>
            <form method="post" action="/api/admin/logout">
              <Button type="submit" variant="ghost" size="sm">
                Keluar
              </Button>
            </form>
          </Container>
        </header>
      )}
      {children}
    </>
  );
}
