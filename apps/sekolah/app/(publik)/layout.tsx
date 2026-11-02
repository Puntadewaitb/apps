import type { ReactNode } from "react";
import { SiteShell } from "../../components/SiteShell";

/** Halaman publik: navbar + footer + tombol WhatsApp. (Admin memakai layout sendiri.) */
export default function PublikLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
