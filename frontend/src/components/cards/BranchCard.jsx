import PropTypes from "prop-types";
import { MapPin, Clock, Phone } from "lucide-react";
import TextLink from "../ui/TextLink.jsx";

/** Boutique card — the physical extension of the jewellery house. */
export default function BranchCard({ branch }) {
  return (
    <article className="group flex h-full flex-col border border-line bg-paper transition-colors duration-200 hover:border-gold/45">
      <a
        href={branch.href}
        aria-label={`View ${branch.name}`}
        className="block aspect-[4/3] overflow-hidden bg-ivory"
      >
        <img
          src={branch.image?.src}
          alt={branch.image?.alt ?? branch.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </a>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {branch.flagship && (
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-gold-deep">
            Flagship Boutique
          </p>
        )}
        <h3 className="mt-2 font-serif text-[23px] leading-tight">
          <a href={branch.href} className="transition-colors duration-200 hover:text-wine">
            {branch.name}
          </a>
        </h3>

        <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-ash">
          <MapPin size={13} strokeWidth={1.5} className="text-gold-deep" aria-hidden="true" />
          {branch.city}, {branch.state}
        </p>

        <p className="mt-4 text-[13px] leading-relaxed text-ash">{branch.address}</p>

        <div className="mt-5 space-y-2 border-t border-line pt-5 text-[13px] text-ink/80">
          <p className="flex items-center gap-2.5">
            <Clock size={14} strokeWidth={1.5} className="shrink-0 text-gold-deep" aria-hidden="true" />
            <span className="text-[11px] uppercase tracking-[0.18em]">
              {branch.openingHours.summary} · {branch.openingHours.hours}
            </span>
          </p>
          <p className="flex items-center gap-2.5">
            <Phone size={14} strokeWidth={1.5} className="shrink-0 text-gold-deep" aria-hidden="true" />
            <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="tracking-wide hover:text-wine">
              {branch.phone}
            </a>
          </p>
        </div>

        <TextLink href={branch.href} className="mt-6">
          View Store
        </TextLink>
      </div>
    </article>
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
