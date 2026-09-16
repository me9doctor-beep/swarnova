import { Phone, Mail } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import Container from "../ui/Container.jsx";
import Eyebrow from "../ui/Eyebrow.jsx";
import SocialIcon from "../ui/SocialIcon.jsx";
import NewsletterForm from "../forms/NewsletterForm.jsx";
import { useSite } from "../../hooks/useSite.js";

function FooterColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <Eyebrow as="h3" tone="wine" className="text-label tracking-[0.32em]">
        {title}
      </Eyebrow>
      <ul className="mt-5 space-y-2.5">
        {links.map((link) => (
          <li key={link.label + link.href}>
            <a
              href={link.href}
              className="font-sans text-caption text-text-inverse/65 transition-colors duration-200 hover:text-text-inverse sm:text-body-sm"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  const { data: site } = useSite();
  if (!site) return null;

  return (
    <footer className="bg-surface-inverse text-text-inverse/75">
      <Container className="py-16 sm:py-20 lg:py-24">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <a href="#top" aria-label="Swarnova — home" className="inline-block">
              <BrandMark tone="light" />
            </a>
            <p className="mt-5 font-serif text-h4 italic leading-relaxed text-text-inverse/70">
              {site.brand.tagline}
            </p>
            <div className="mt-6 space-y-2 text-body-sm text-text-inverse/60">
              <p className="flex items-center gap-2.5">
                <Phone size={14} strokeWidth={1.5} className="text-brand-accent-soft" aria-hidden="true" />
                <a href={site.contact.phoneHref} className="hover:text-text-inverse">
                  {site.contact.phone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail size={14} strokeWidth={1.5} className="text-brand-accent-soft" aria-hidden="true" />
                <a href={site.contact.emailHref} className="hover:text-text-inverse">
                  {site.contact.email}
                </a>
              </p>
            </div>
            <ul className="mt-7 flex items-center gap-2">
              {site.socials.map((social) => (
                <li key={social.type}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="flex h-9 w-9 items-center justify-center border border-text-inverse/20 text-text-inverse/70 transition-colors duration-200 hover:border-brand-accent-soft hover:text-brand-accent-soft"
                  >
                    <SocialIcon type={social.type} size={15} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <FooterColumn title="Quick Links" links={site.quickLinks} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Customer Service" links={site.customerService} />
          </div>
          <div className="lg:col-span-2">
            <FooterColumn title="Experience" links={site.experience} />
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-3">
            <Eyebrow as="h3" tone="wine" className="text-label tracking-[0.32em]">
              Newsletter
            </Eyebrow>
            <p className="mt-5 text-body-sm leading-relaxed text-text-inverse/60">
              Subscribe for special offers, private previews and once-in-a-season
              stories from the atelier.
            </p>
            <NewsletterForm
              variant="compact"
              buttonLabel="Subscribe"
              className="mt-5"
            />
          </div>
        </div>
      </Container>

      <div className="border-t border-text-inverse/10">
        <Container className="flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-caption tracking-wide text-text-inverse/50">{site.copyright}</p>
          <ul className="flex items-center gap-6">
            {site.legal.map((link) => (
              <li key={link.label + link.href}>
                <a
                  href={link.href}
                  className="text-caption text-text-inverse/50 transition-colors duration-200 hover:text-text-inverse"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </div>
    </footer>
  );
}
