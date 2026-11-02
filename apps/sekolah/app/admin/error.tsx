"use client";

import { Button, Container } from "@tpl/ui";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="py-24">
      <Container className="max-w-xl text-center">
        <h1 className="text-3xl font-bold text-fg">Terjadi kesalahan</h1>
        <p className="mt-3 text-muted">Maaf, halaman admin gagal dimuat.</p>
        <Button className="mt-8" onClick={() => reset()}>
          Coba lagi
        </Button>
      </Container>
    </main>
  );
}
