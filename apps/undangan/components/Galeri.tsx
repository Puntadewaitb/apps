import { Lightbox, Section } from "@tpl/ui";
import { undangan } from "../content/undangan";

export function Galeri() {
  const { galeri } = undangan;
  return (
    <Section id="galeri" title={galeri.judul} subtitle={galeri.subjudul}>
      <Lightbox images={galeri.foto} />
    </Section>
  );
}
