import { Card, Section } from "@tpl/ui";
import { getKonten, getUi, type Lang } from "../lib/konten";
import { fmt } from "../lib/i18n";

export function TestimoniKlien({ lang }: { lang: Lang }) {
  const t = getKonten(lang).kredibilitas.testimoni;
  const u = getUi(lang);
  return (
    <Section id="testimoni" title={t.judul}>
      <ul className="grid gap-4 md:grid-cols-3">
        {t.daftar.map((x) => (
          <li key={x.nama}>
            <Card className="flex h-full flex-col" data-testid="testimoni">
              <p
                role="img"
                aria-label={fmt(u.testimoni.rating, { n: x.rating })}
                className="text-lg text-accent"
              >
                {"★".repeat(x.rating)}
                <span className="text-border">{"★".repeat(5 - x.rating)}</span>
              </p>
              <blockquote className="mt-3 flex-1 text-fg">“{x.teks}”</blockquote>
              <footer className="mt-4 text-sm">
                <strong className="text-fg">{x.nama}</strong>
                <span className="block text-muted">
                  {x.jabatan}, {x.perusahaan}
                </span>
              </footer>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">{t.catatan}</p>
    </Section>
  );
}
