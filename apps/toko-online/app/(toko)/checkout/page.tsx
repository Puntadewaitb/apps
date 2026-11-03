import type { Metadata } from "next";
import { Container } from "@tpl/ui";
import { CheckoutForm } from "../../../components/CheckoutForm";
import { getPengaturan } from "../../../lib/setting";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const s = await getPengaturan();
  return (
    <main id="isi" className="py-10">
      <Container>
        <h1 className="text-3xl font-bold text-fg">Checkout</h1>
        <div className="mt-6">
          <CheckoutForm
            kotaOpsi={Object.keys(s.ongkir.kota).map((k) =>
              k.replace(/\b\p{L}/gu, (c) => c.toUpperCase()),
            )}
            ongkirBawaan={s.ongkir.bawaan}
          />
          <noscript>
            <p className="rounded-lg border border-border p-4 text-muted">
              Checkout memerlukan JavaScript. Aktifkan JavaScript atau pesan lewat WhatsApp.
            </p>
          </noscript>
        </div>
      </Container>
    </main>
  );
}
