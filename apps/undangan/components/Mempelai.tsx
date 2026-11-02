import { Container, Section } from "@tpl/ui";

type Person = { name: string; parents: string; photo: string; role: string };

export function Mempelai({ quote, groom, bride }: { quote: string; groom: Person; bride: Person }) {
  return (
    <Section id="mempelai" tone="surface" title="Mempelai">
      {quote && (
        <blockquote className="mb-10 max-w-2xl border-l-4 border-primary pl-4 italic text-muted">
          {quote}
        </blockquote>
      )}
      <Container className="grid gap-8 px-0 sm:grid-cols-2 sm:px-0 lg:px-0">
        {[groom, bride].map((p) => (
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
