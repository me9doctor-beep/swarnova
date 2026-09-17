import PropTypes from "prop-types";
import { MapPin, Clock, Phone } from "lucide-react";
import Card from "../ui/Card.jsx";
import ContentLink from "../ui/ContentLink.jsx";
import TextLink from "../ui/TextLink.jsx";

/** Boutique card — the physical extension of the jewellery house. */
export default function BranchCard({ branch }) {
  return (
    <Card interactive className="group">
      <Card.Media
        ratio="4/3"
        href={branch.href}
        ariaLabel={`View ${branch.name}`}
      >
        <img
          src={branch.image?.src}
          alt={branch.image?.alt ?? branch.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </Card.Media>

      <Card.Body padding="md">
        {branch.flagship && (
          <p className="text-label font-medium uppercase tracking-[0.3em] text-brand-accent-strong">
            Flagship Boutique
          </p>
        )}
        <h3 className="mt-2 font-serif text-h3 leading-tight">
          <ContentLink href={branch.href} className="transition-colors duration-200 hover:text-brand-primary">
            {branch.name}
          </ContentLink>
        </h3>

        <p className="mt-2 inline-flex items-center gap-1.5 text-nav uppercase tracking-[0.22em] text-text-secondary">
          <MapPin size={13} strokeWidth={1.5} className="text-brand-accent-strong" aria-hidden="true" />
          {branch.city}, {branch.state}
        </p>

        <p className="mt-4 text-body-sm leading-relaxed text-text-secondary">{branch.address}</p>

        <div className="mt-5 space-y-2 border-t border-border-default pt-5 text-body-sm text-text-primary/80">
          <p className="flex items-center gap-2.5">
            <Clock size={14} strokeWidth={1.5} className="shrink-0 text-brand-accent-strong" aria-hidden="true" />
            <span className="text-nav uppercase tracking-[0.18em]">
              {branch.openingHours.summary} · {branch.openingHours.hours}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone size={14} strokeWidth={1.5} className="shrink-0 text-brand-accent-strong" aria-hidden="true" />
            <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="tracking-wide hover:text-brand-primary">
              {branch.phone}
            </a>
          </p>
        </div>

        <TextLink href={branch.href} className="mt-6">
          View Store
        </TextLink>
      </Card.Body>
    </Card>
  );
}

BranchCard.propTypes = {
  branch: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    city: PropTypes.string,
    state: PropTypes.string,
    address: PropTypes.string,
    phone: PropTypes.string,
    flagship: PropTypes.bool,
    href: PropTypes.string,
    openingHours: PropTypes.shape({
      summary: PropTypes.string,
      hours: PropTypes.string,
    }),
    image: PropTypes.shape({ src: PropTypes.string, alt: PropTypes.string }),
  }).isRequired,
};
