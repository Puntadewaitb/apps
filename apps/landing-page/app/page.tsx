import { ButtonLink, Footer, Navbar, WhatsAppButton } from "@tpl/ui";
import { ClosingCta } from "../components/ClosingCta";
import { ContactCta } from "../components/ContactCta";
import { Faq } from "../components/Faq";
import { Features } from "../components/Features";
import { Hero } from "../components/Hero";
import { ProblemSolution } from "../components/ProblemSolution";
import { PromoBanner } from "../components/PromoBanner";
import { Showcase } from "../components/Showcase";
import { StructuredData } from "../components/StructuredData";
import { Testimonials } from "../components/Testimonials";
import { site } from "../content/site";

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <PromoBanner />
      <Navbar
        brand={site.brand}
        links={site.nav}
        cta={
          <ButtonLink href={site.hero.cta.href} size="sm">
            {site.hero.cta.label}
          </ButtonLink>
        }
      />
      <main id="beranda">
        <Hero />
        <ProblemSolution />
        <Features />
        <Showcase />
        <Testimonials />
        <Faq />
        <ClosingCta />
        <ContactCta />
      </main>
      <Footer
        brand={site.brand}
        description={site.footer.description}
        links={site.footer.links}
        copyright={site.footer.copyright}
      />
      <WhatsAppButton
        phone={site.whatsapp.phone}
        message={site.whatsapp.message}
        label={site.whatsapp.label}
      />
    </>
  );
}
