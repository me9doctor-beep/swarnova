/**
 * Global site configuration — chrome that wraps the CMS-driven homepage:
 * brand lockup, primary navigation, footer columns, social and legal links.
 *
 * `href` values follow one convention, because the storefront renders them
 * through the router (`components/ui/ContentLink.jsx`):
 *   "/route"        a page this app owns (`/collections`, `/ai-studio`, …)
 *   "/#section"     a section OF THE HOMEPAGE — the leading path matters, since
 *                   a bare "#section" would point at the current page and
 *                   resolve to nothing anywhere but the homepage itself
 *   "mailto:", "tel:", "https://"  handed to the browser untouched
 * A few support and legal destinations are still unwritten copy for pages the
 * platform has not built yet; they navigate to the in-app Not Found screen, and
 * `PHASE_13_AUDIT.md` lists them as content gaps rather than pretending.
 */
export const site = {
  brand: {
    name: "SWARNOVA",
    word: "SWARNOVA",
    subWord: "by MediXO",
    attribution: "by MediXO",
    tagline: "Where Heritage Meets Innovation.",
  },
  announcement: {
    id: "ANN-001",
    enabled: true,
    message:
      "BIS HALLMARKED 22K GOLD  ·  COMPLIMENTARY INSURED DELIVERY ACROSS INDIA  ·  LIFETIME JEWELLERY CARE",
    /* Phone-width variant of the same three promises — the full message needs
       three lines under ~360px, which would push the fixed header past the
       section scroll margin. Optional: the storefront falls back to `message`. */
    shortMessage:
      "BIS HALLMARKED 22K GOLD  ·  FREE INSURED DELIVERY  ·  LIFETIME CARE",
  },
  navigation: [
    { label: "Home", href: "/#top" },
    { label: "Collections", href: "/#collections" },
    { label: "Jewellery", href: "/collections" },
    { label: "AI Studio", href: "/ai-studio" },
    { label: "Virtual Try-On", href: "/virtual-try-on" },
    { label: "Our Story", href: "/#our-story" },
    { label: "Journal", href: "/#journal" },
    { label: "Stores", href: "/#stores" },
  ],
  quickLinks: [
    { label: "Home", href: "/#top" },
    { label: "Collections", href: "/#collections" },
    { label: "Jewellery", href: "/collections" },
    { label: "AI Studio", href: "/ai-studio" },
    { label: "Virtual Try-On", href: "/virtual-try-on" },
    { label: "Our Story", href: "/#our-story" },
    { label: "Stores", href: "/#stores" },
  ],
  customerService: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQs", href: "/faq" },
    { label: "Shipping & Delivery", href: "/shipping" },
    { label: "Returns & Exchanges", href: "/returns" },
    { label: "Warranty", href: "/warranty" },
    { label: "Jewellery Care Guide", href: "/care-guide" },
    { label: "Track Order", href: "/account/orders" },
  ],
  experience: [
    { label: "AI Jewellery Studio", href: "/ai-studio" },
    { label: "Virtual Try-On", href: "/virtual-try-on" },
    { label: "Custom & Bespoke Jewellery", href: "/ai-studio" },
    { label: "Book a Private Viewing", href: "/#stores" },
    { label: "Gold Rate Board", href: "/#gold-rate" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
  socials: [
    { type: "instagram", label: "Instagram", href: "https://instagram.com" },
    { type: "facebook", label: "Facebook", href: "https://facebook.com" },
    { type: "youtube", label: "YouTube", href: "https://youtube.com" },
    { type: "twitter", label: "X", href: "https://x.com" },
  ],
  contact: {
    phone: "+91 674 200 1234",
    phoneHref: "tel:+916742001234",
    email: "care@swarnova.in",
    emailHref: "mailto:care@swarnova.in",
  },
  copyright: "© 2026 Swarnova by MediXO. All Rights Reserved.",
};

export default site;
