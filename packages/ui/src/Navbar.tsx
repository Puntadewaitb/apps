"use client";

import { useState, type ReactNode } from "react";
import { Container } from "./Container";

export type NavLink = { label: string; href: string };

type Props = {
  brand: ReactNode;
  links: NavLink[];
  cta?: ReactNode;
};

/** Navbar responsif: menu hamburger di layar kecil. */
export function Navbar({ brand, links, cta }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <div className="text-lg font-bold text-fg">{brand}</div>
        <nav aria-label="Navigasi utama" className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-muted hover:text-fg">
              {l.label}
            </a>
          ))}
          {cta}
        </nav>
        <button
          type="button"
          className="rounded-md p-2 text-fg md:hidden"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true">{open ? "✕" : "☰"}</span>
        </button>
      </Container>
      {open && (
        <nav id="menu-mobile" aria-label="Menu mobile" className="border-t border-border md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="rounded-md px-2 py-2 text-fg hover:bg-surface"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </a>
            ))}
            {cta}
          </Container>
        </nav>
      )}
    </header>
  );
}
