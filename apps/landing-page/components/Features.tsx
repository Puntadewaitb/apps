import { Card, Section } from "@tpl/ui";
import { site } from "../content/site";

export function Features() {
  const { features } = site;
  return (
    <Section id="keunggulan" tone="surface" title={features.title} subtitle={features.subtitle}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.items.map((f) => (
          <li key={f.title}>
            <Card className="h-full">
              <span aria-hidden="true" className="text-2xl">
                {f.icon}
              </span>
              <h3 className="mt-3 font-semibold text-fg">{f.title}</h3>
              <p className="mt-1 text-muted">{f.text}</p>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
