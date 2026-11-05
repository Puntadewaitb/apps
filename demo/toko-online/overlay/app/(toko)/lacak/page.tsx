// OVERLAY sample statis: halaman lacak statis; ?kode= dibaca di peramban (components/LacakKlien.tsx).
import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { LacakKlien } from "../../../components/LacakKlien";

export const metadata: Metadata = {
  title: "Lacak Pesanan",
  robots: { index: false, follow: false },
};

export default function LacakPage() {
  return (
    <main id="isi" className="py-10">
      <Container className="max-w-3xl">
        <h1 className="text-3xl font-bold text-fg">Lacak Pesanan</h1>
        <p className="mt-2 mb-8 text-muted">
          Masukkan kode pesanan dan nomor HP yang Anda pakai saat memesan.
        </p>
        <LacakKlien />
        <noscript>
          <p className="rounded-lg border border-border p-4 text-muted">
            Halaman ini memerlukan JavaScript.
          </p>
        </noscript>
      </Container>
    </main>
  );
}
