import { ButtonLink, Container } from "@tpl/ui";

export function TidakDitemukan({
  pesan = "Alamat yang Anda buka tidak ada atau sudah dipindahkan.",
}: {
  pesan?: string;
}) {
  return (
    <main id="isi" className="py-24">
      <Container className="max-w-xl text-center">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-2 text-3xl font-bold text-fg">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-muted">{pesan}</p>
        <ButtonLink href="/" className="mt-8">
          Kembali ke beranda
        </ButtonLink>
      </Container>
    </main>
  );
}
