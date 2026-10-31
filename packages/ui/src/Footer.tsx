import type { ReactNode } from "react";
import { Container } from "./Container";
import type { NavLink } from "./Navbar";

type Props = {
  brand: ReactNode;
  description?: ReactNode;
  links?: NavLink[];
  copyright?: ReactNode;
};

export function Footer({ brand, description, links = [], copyright }: Props) {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <Container className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="text-lg font-bold text-fg">{brand}</div>
          {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        </div>
        {links.length > 0 && (
          <nav aria-label="Tautan footer" className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-sm text-muted hover:text-fg">
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </Container>
      {copyright && (
        <Container className="mt-8 border-t border-border pt-4 text-sm text-muted">
          {copyright}
        </Container>
      )}
    </footer>
  );
}
