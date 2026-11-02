import { Container, Section } from "@tpl/ui";

export type Orang = { name: string; parents: string; photo: string; role: string };

type Props = { judul: string; quote: string; orang: Orang[] };

export function Mempelai({ judul, quote, orang }: Props) {
  return (
    <Section id="mempelai" tone="surface" title={judul}>
      {quote && (
        <blockquote className="mb-10 max-w-2xl border-l-4 border-primary pl-4 italic text-muted">
          {quote}
        </blockquote>
      )}
      <Container
        className={`grid gap-8 px-0 sm:px-0 lg:px-0 ${orang.length > 1 ? "sm:grid-cols-2" : "max-w-sm"}`}
      >
        {orang.map((p) => (
          <figure key={p.role} className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.photo}
              alt={`Foto ${p.role}`}
              width={200}
              height={200}
              loading="lazy"
              decoding="async"
              className="mx-auto h-40 w-40 rounded-full border-4 border-bg object-cover shadow"
            />
            <figcaption className="mt-4">
              <p className="font-serif text-2xl font-bold text-fg">{p.name}</p>
              {p.parents && <p className="mt-1 text-sm text-muted">{p.parents}</p>}
            </figcaption>
          </figure>
        ))}
      </Container>
    </Section>
  );
}
