import type { ReactNode } from "react";
import { SiteShell } from "../../components/SiteShell";

// Pengaturan toko (nama, WA) dari DB → dirender per-request. (Admin memakai layout sendiri di T6.)
export const dynamic = "force-dynamic";

export default function TokoLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
