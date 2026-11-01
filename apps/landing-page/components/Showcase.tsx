import { Badge, ButtonLink, Card, Section } from "@tpl/ui";
import { site } from "../content/site";

export function Showcase() {
  const { showcase } = site;
  return (
    <Section id="paket" title={showcase.title} subtitle={showcase.subtitle}>
      <ul className="grid gap-6 md:grid-cols-3">
        {showcase.items.map((item) => (
          <li key={item.name}>
            <Card className="flex h-full flex-col overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image.src}
                alt={item.image.alt}
                width={400}
                height={240}
                className="h-auto w-full"
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-fg">{item.name}</h3>
                  <Badge tone="primary">{item.badge}</Badge>
                </div>
                <p className="mt-1 text-muted">{item.text}</p>
                <p className="mt-4 text-2xl font-bold text-fg">
                  {item.price} <span className="text-sm font-normal text-muted">{item.period}</span>
                </p>
                <ul className="mt-3 flex-1 space-y-1 text-sm text-muted">
                  {item.points.map((p) => (
                    <li key={p}>✓ {p}</li>
                  ))}
                </ul>
                <ButtonLink href="#kontak" variant="secondary" className="mt-5">
                  Pilih {item.name}
                </ButtonLink>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">{showcase.note}</p>
    </Section>
  );
}
