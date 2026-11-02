import { ButtonLink, Container } from "@tpl/ui";
import { getKonten, getUi, resolveHref, type Lang } from "../lib/konten";

type Props = { lang: Lang; judul?: string; teks?: string };

/** Pita ajakan (CTA): WhatsApp + email. */
export function Ajakan({ lang, judul, teks }: Props) {
  const k = getKonten(lang);
  const u = getUi(lang);
  return (
    <section aria-labelledby="ajakan-judul" className="bg-primary py-12 text-primary-fg sm:py-14">
      <Container className="text-center">
        <h2 id="ajakan-judul" className="text-2xl font-bold sm:text-3xl">
          {judul ?? k.ajakan.judul}
        </h2>
        <p className="mx-auto mt-3 max-w-xl opacity-90">{teks ?? k.ajakan.teks}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href={resolveHref("WHATSAPP", k)}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            className="!bg-bg !text-primary hover:opacity-90"
          >
            {u.ajakan.whatsapp}
          </ButtonLink>
          <ButtonLink
            href={`mailto:${k.kontak.email}`}
            size="lg"
            variant="ghost"
            className="!text-primary-fg border border-white/40 hover:bg-white/10"
          >
            {u.ajakan.email}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
