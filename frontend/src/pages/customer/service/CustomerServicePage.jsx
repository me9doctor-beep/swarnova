import PropTypes from "prop-types";
import CatalogueHeader from "../../../components/catalogue/CatalogueHeader.jsx";
import Container from "../../../components/ui/Container.jsx";
import ContentLink from "../../../components/ui/ContentLink.jsx";
import Section from "../../../components/ui/Section.jsx";
import { getCustomerServicePage } from "../../../features/storefront/customerService.js";
import { useDocumentTitle } from "../../../hooks/useDocumentTitle.js";
import { useSite } from "../../../hooks/useSite.js";

function CareDesk({ contact }) {
  if (!contact) return null;

  return (
    <div className="mb-12 border border-border-default bg-surface-primary px-6 py-6 sm:px-8">
      <p className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">Care desk</p>
      <ul className="mt-4 space-y-2 font-sans text-body text-text-primary">
        <li>
          <ContentLink href={contact.phoneHref} className="underline underline-offset-4">
            {contact.phone}
          </ContentLink>
        </li>
        <li>
          <ContentLink href={contact.emailHref} className="underline underline-offset-4">
            {contact.email}
          </ContentLink>
        </li>
      </ul>
    </div>
  );
}

CareDesk.propTypes = {
  contact: PropTypes.shape({
    phone: PropTypes.string,
    phoneHref: PropTypes.string,
    email: PropTypes.string,
    emailHref: PropTypes.string,
  }),
};

/**
 * One page for every approved customer-service destination. Copy lives in
 * `customerService.js`; contact details come from the site contract so the
 * footer and this page cannot drift.
 */
export default function CustomerServicePage({ pageKey }) {
  const page = getCustomerServicePage(pageKey);
  useDocumentTitle(page ? `${page.title} — Swarnova` : "Swarnova");
  const { data: site } = useSite();

  if (!page) return null;

  return (
    <>
      <CatalogueHeader eyebrow={page.eyebrow} title={page.title} description={page.lead} />
      <Section background="ivory" ariaLabel={page.title}>
        <Container>
          <div className="mx-auto max-w-3xl">
            {page.showCareDesk ? <CareDesk contact={site?.contact} /> : null}
            <div className="space-y-12">
              {page.sections.map((section) => (
                <section key={section.heading} className="space-y-4">
                  <h2 className="font-serif text-h3 text-text-primary">{section.heading}</h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="font-sans text-body leading-relaxed text-text-secondary">
                      {paragraph}
                    </p>
                  ))}
                  {section.items ? (
                    <ul className="space-y-3">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          className="border-l border-border-default pl-4 font-sans text-body-sm leading-relaxed text-text-secondary"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.links?.length ? (
                    <p className="font-sans text-body-sm text-text-primary">
                      {section.links.map((link, index) => (
                        <span key={link.href}>
                          {index > 0 ? " · " : null}
                          <ContentLink href={link.href} className="underline underline-offset-4">
                            {link.label}
                          </ContentLink>
                        </span>
                      ))}
                    </p>
                  ) : null}
                </section>
              ))}
            </div>
            <nav aria-label="Related house pages" className="mt-16 border-t border-border-default pt-8">
              <p className="font-sans text-label uppercase tracking-[0.22em] text-text-muted">
                Also from the house
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {page.related.map((link) => (
                  <li key={link.href}>
                    <ContentLink
                      href={link.href}
                      className="font-sans text-body-sm text-text-primary underline underline-offset-4"
                    >
                      {link.label}
                    </ContentLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </Container>
      </Section>
    </>
  );
}

CustomerServicePage.propTypes = {
  pageKey: PropTypes.string.isRequired,
};
