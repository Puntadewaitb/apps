import { Section } from "@tpl/ui";
import { getKonten, getUi, type Lang } from "../lib/konten";
import { fmt } from "../lib/i18n";

export function KlienLogo({ lang }: { lang: Lang }) {
  const k = getKonten(lang).kredibilitas.klien;
  const u = getUi(lang);
  return (
    <Section id="klien" tone="surface" title={k.judul} subtitle={k.subjudul}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4" data-testid="logo-klien">
        {k.daftar.map((c) => (
          <li key={c.nama} className="rounded-lg border border-border bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.logo}
              alt={fmt(u.klien.logoAlt, { nama: c.nama })}
              width={240}
              height={80}
              loading="lazy"
              decoding="async"
              className="h-auto w-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
