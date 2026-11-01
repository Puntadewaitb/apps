import { Badge, ButtonLink, Container } from "@tpl/ui";
import { site } from "../content/site";

export function Hero() {
  const { hero } = site;
  return (
    <section className="bg-surface py-14 sm:py-20">
      <Container className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <Badge tone="primary">{hero.eyebrow}</Badge>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg sm:text-4xl lg:text-5xl">
            {hero.headline}
          </h1>
          <p className="mt-4 text-lg text-muted">{hero.subheadline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href={hero.cta.href} size="lg">
              {hero.cta.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} size="lg" variant="secondary">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.image.src}
          alt={hero.image.alt}
          width={640}
          height={480}
          className="h-auto w-full rounded-xl border border-border"
        />
      </Container>
    </section>
  );
}
