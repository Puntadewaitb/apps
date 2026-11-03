import type { Metadata } from "next";
import { SiteShell } from "../components/SiteShell";
import { TidakDitemukan } from "../components/TidakDitemukan";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: true },
};

// 404 untuk URL yang tidak dikenal (di luar layout (toko)) → bawa shell sendiri.
export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <SiteShell>
      <TidakDitemukan />
    </SiteShell>
  );
}
