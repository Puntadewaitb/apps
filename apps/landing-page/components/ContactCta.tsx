import { ButtonLink, Section, buildWhatsAppUrl } from "@tpl/ui";
import { site } from "../content/site";
import { LeadForm } from "./LeadForm";

export function ContactCta() {
  const { contact, whatsapp } = site;
  return (
    <Section id="kontak" tone="surface" title={contact.title} subtitle={contact.text}>
      <div className="grid gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <LeadForm />
        <div className="md:max-w-xs">
          <p className="text-muted">Lebih suka langsung ngobrol?</p>
          <ButtonLink
            href={buildWhatsAppUrl(whatsapp.phone, whatsapp.message)}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
            size="lg"
            className="mt-3"
          >
            {whatsapp.label}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
