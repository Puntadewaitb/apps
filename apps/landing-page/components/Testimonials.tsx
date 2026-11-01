import { Card, Section } from "@tpl/ui";
import { site } from "../content/site";

export function Testimonials() {
  const { testimonials } = site;
  return (
    <Section
      id="testimoni"
      tone="surface"
      title={testimonials.title}
      subtitle={testimonials.subtitle}
    >
      <ul className="grid gap-4 md:grid-cols-3">
        {testimonials.items.map((t) => (
          <li key={t.name}>
            <Card className="flex h-full flex-col">
              <p
                role="img"
                aria-label={`Penilaian ${t.rating} dari 5`}
                className="text-lg text-accent"
              >
                {"★".repeat(t.rating)}
                <span className="text-border">{"★".repeat(5 - t.rating)}</span>
              </p>
              <blockquote className="mt-3 flex-1 text-fg">“{t.quote}”</blockquote>
              <footer className="mt-4 text-sm">
                <strong className="text-fg">{t.name}</strong>
                <span className="block text-muted">{t.role}</span>
              </footer>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">{testimonials.note}</p>
    </Section>
  );
}
