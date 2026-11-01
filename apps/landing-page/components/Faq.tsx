import { Accordion, Section } from "@tpl/ui";
import { site } from "../content/site";

export function Faq() {
  const { faq } = site;
  return (
    <Section id="faq" title={faq.title} subtitle={faq.subtitle}>
      <Accordion
        className="max-w-3xl"
        items={faq.items.map((i) => ({ id: i.id, title: i.q, content: i.a }))}
      />
    </Section>
  );
}
