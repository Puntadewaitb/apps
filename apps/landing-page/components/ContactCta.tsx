import { ButtonLink, Section, buildWhatsAppUrl } from "@tpl/ui";
import { site } from "../content/site";

/** Sementara berisi CTA WhatsApp; form lead ditambahkan di L4. */
export function ContactCta() {
  const { contact, whatsapp } = site;
  return (
    <Section id="kontak" tone="surface" title={contact.title} subtitle={contact.text}>
      <ButtonLink
        href={buildWhatsAppUrl(whatsapp.phone, whatsapp.message)}
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
      >
        {whatsapp.label}
      </ButtonLink>
    </Section>
  );
}
