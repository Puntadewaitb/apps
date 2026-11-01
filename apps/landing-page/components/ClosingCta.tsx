import { ButtonLink, Container } from "@tpl/ui";
import { site } from "../content/site";

export function ClosingCta() {
  const { closing } = site;
  return (
    <section aria-labelledby="penutup-judul" className="bg-primary py-14 text-primary-fg">
      <Container className="text-center">
        <h2 id="penutup-judul" className="text-2xl font-bold sm:text-3xl">
          {closing.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl opacity-90">{closing.text}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href={closing.cta.href}
            size="lg"
            className="!bg-bg !text-primary hover:opacity-90"
          >
            {closing.cta.label}
          </ButtonLink>
          <ButtonLink
            href={closing.secondaryCta.href}
            size="lg"
            variant="ghost"
            className="!text-primary-fg border border-white/40 hover:bg-white/10"
          >
            {closing.secondaryCta.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
