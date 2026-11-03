import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { KeranjangView } from "../../../components/KeranjangView";

export const metadata: Metadata = {
  title: "Keranjang Belanja",
  robots: { index: false, follow: false },
};

export default function KeranjangPage() {
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-3xl font-bold text-fg">Keranjang Belanja</h1>
        <div className="mt-6">
          <KeranjangView />
          <noscript>
            <p className="rounded-lg border border-border p-4 text-muted">
              Keranjang memerlukan JavaScript. Aktifkan JavaScript di peramban Anda, atau pesan
              lewat WhatsApp.
            </p>
          </noscript>
        </div>
      </Container>
    </main>
  );
}
