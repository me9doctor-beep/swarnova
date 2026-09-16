import { Phone, Mail } from "lucide-react";
import BrandMark from "../ui/BrandMark.jsx";
import SocialIcon from "../ui/SocialIcon.jsx";
import NewsletterForm from "../forms/NewsletterForm.jsx";
import { useSite } from "../../hooks/useSite.js";

function FooterColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h3 className="text-[10px] font-medium uppercase tracking-[0.32em] text-champagne">
        {title}
      </h3>
      <ul className="mt-5 space-y-2.5">
        {links.map((link) => (
          <li key={link.label + link.href}>
            <a
              href={link.href}
              className="font-sans text-[13px] text-cream/65 transition-colors duration-200 hover:text-cream"
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
    <footer className="bg-wine text-cream/75">
      <div className="shell py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-3">
            <a href="#top" aria-label="Swarnova — home" className="inline-block">
              <BrandMark tone="light" />
            </a>
            <p className="mt-5 font-serif text-[18px] italic leading-relaxed text-cream/70">
              {site.brand.tagline}
            </p>
            <div className="mt-6 space-y-2 text-[13px] text-cream/60">
              <p className="flex items-center gap-2.5">
                <Phone size={14} strokeWidth={1.5} className="text-champagne" aria-hidden="true" />
                <a href={site.contact.phoneHref} className="hover:text-cream">
                  {site.contact.phone}
                </a>
              </p>
              <p className="flex items-center gap-2.5">
                <Mail size={14} strokeWidth={1.5} className="text-champagne" aria-hidden="true" />
                <a href={site.contact.emailHref} className="hover:text-cream">
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
                    className="flex h-9 w-9 items-center justify-center border border-cream/20 text-cream/70 transition-colors duration-200 hover:border-champagne hover:text-champagne"
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
          <div className="lg:col-span-3">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.32em] text-champagne">
              Newsletter
            </h3>
            <p className="mt-5 text-[13px] leading-relaxed text-cream/60">
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
      </div>

      <div className="border-t border-cream/10">
        <div className="shell flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-[12px] tracking-wide text-cream/50">{site.copyright}</p>
          <ul className="flex items-center gap-6">
            {site.legal.map((link) => (
              <li key={link.label + link.href}>
                <a
                  href={link.href}
                  className="text-[12px] text-cream/50 transition-colors duration-200 hover:text-cream"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
