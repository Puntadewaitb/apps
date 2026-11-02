import { Section } from "@tpl/ui";
import { undangan } from "../content/undangan";

/** Timeline vertikal: satu kolom di mobile, berselang-seling di layar ≥ md. */
export function Cerita() {
  const { cerita } = undangan;
  return (
    <Section id="cerita" tone="surface" title={cerita.judul} subtitle={cerita.subjudul}>
      <ol className="relative space-y-8 border-l-2 border-primary/30 pl-6 md:border-l-0 md:pl-0">
        {cerita.peristiwa.map((p, i) => (
          <li
            key={p.waktu}
            data-testid="peristiwa"
            className="relative md:grid md:grid-cols-2 md:gap-10"
          >
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-surface md:left-1/2 md:-ml-1.5"
            />
            <div className={i % 2 === 0 ? "md:pr-10 md:text-right" : "md:col-start-2 md:pl-10"}>
              <time className="text-sm font-semibold text-primary">{p.waktu}</time>
              <h3 className="mt-1 font-serif text-xl font-bold text-fg">{p.judul}</h3>
              <p className="mt-2 text-muted">{p.teks}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
