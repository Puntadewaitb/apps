import type { Metadata } from "next";
import { Container } from "@tpl/ui";

export const metadata: Metadata = { title: "Undangan tidak ditemukan" };

export default function NotFound() {
  return (
    <main className="py-24">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold text-fg">Undangan tidak ditemukan</h1>
        <p className="mt-3 text-muted">
          Tautan yang Anda buka tidak valid, atau data acara belum disiapkan.
        </p>
      </Container>
    </main>
  );
}
