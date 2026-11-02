import { Container } from "@tpl/ui";
import { getKonten, type Lang } from "../lib/konten";

export function Angka({ lang }: { lang: Lang }) {
  const a = getKonten(lang).kredibilitas.angka;
  return (
    <section aria-labelledby="angka-judul" className="border-y border-border bg-bg py-10">
      <Container>
        <h2 id="angka-judul" className="sr-only">
          {a.judul}
        </h2>
        <dl className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4" data-testid="angka">
          {a.butir.map((b) => (
            <div key={b.label}>
              <dd className="text-3xl font-bold text-primary sm:text-4xl">{b.nilai}</dd>
              <dt className="mt-1 text-sm text-muted">{b.label}</dt>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-center text-xs text-muted">{a.catatan}</p>
      </Container>
    </section>
  );
}
