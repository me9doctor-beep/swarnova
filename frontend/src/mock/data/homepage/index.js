import { media } from "../../assets/index.js";

/**
 * HOMEPAGE — section-driven, CMS-ready configuration.
 *
 * Every block declares { type, id, enabled, order, content }. The renderer
 * (HomePage) maps `type` to a section component and respects `enabled`
 * and `order`. Marketing teams can later reorder, hide or refill these
 * blocks without touching the presentation layer.
 *
 * Domain data (products, branches, articles, rates, campaign, AI studio) is
 * fetched through hooks/services and referenced via config such as
 * `query` / `campaignId`.
 */
export const homepage = {
  id: "HOME-2026",
  locale: "en-IN",
  sections: [
    {
      type: "hero",
      id: "hero",
      enabled: true,
      order: 1,
      content: {
        eyebrow: "The New Expression of Gold",
        title: {
          lines: [
            { text: "Timeless Beauty,", emphasis: false },
            { text: "Reimagined in Gold.", emphasis: true },
          ],
        },
        body: "Jewellery crafted with timeless artistry and imagined through a new generation of technology — from our master karigars to your fingertips.",
        primaryCta: { label: "Explore Collections", href: "/#collections" },
        secondaryCta: { label: "Create with AI", href: "/ai-studio" },
        image: {
          src: media.heroEditorial,
          alt: "Indian model in a deep burgundy silk drape wearing an ornate 22K gold and polki diamond choker necklace",
        },
      },
    },
    {
      type: "trust_strip",
      id: "trust-strip",
      enabled: true,
      order: 2,
      content: {
        items: [
          {
            icon: "badgeCheck",
            title: "Certified Purity",
            text: "Assayed & BIS hallmarked gold",
          },
          {
            icon: "hammer",
            title: "Expertly Crafted",
            text: "Precision in every detail",
          },
          {
            icon: "shieldCheck",
            title: "Lifetime Support",
            text: "Care that lasts forever",
          },
          {
            icon: "package",
            title: "Elegant Packaging",
            text: "Made for memorable moments",
          },
        ],
      },
    },
    {
      type: "collections",
      id: "collections",
      enabled: true,
      order: 3,
      content: {
        eyebrow: "Discover Our Collections",
        title: "Elegance in Every Detail",
        cta: { label: "View All Collections", href: "/collections" },
      },
    },
    {
      type: "brand_promise",
      id: "our-story",
      enabled: true,
      order: 4,
      content: {
        eyebrow: "Our Promise · Swarnova by MediXO",
        title: {
          lines: [
            { text: "Crafted with Passion,", emphasis: false },
            { text: "Designed for Perfection", emphasis: false },
          ],
        },
        body: "Each Swarnova piece is thoughtfully designed and meticulously handcrafted by skilled artisans using the finest hallmarked materials — jewellery made to be worn, gifted and inherited.",
        points: [
          "Premium, responsibly sourced materials",
          "Handcrafted by expert karigars",
          "Transparent, certified pricing",
          "Customer-first care, for a lifetime",
        ],
        cta: { label: "Learn More", href: "/#our-story" },
        image: {
          src: media.promiseEditorial,
          alt: "Indian woman in an ivory silk saree wearing a delicate gold diamond pendant necklace",
        },
      },
    },
    {
      type: "ai_studio",
      id: "ai-studio",
      enabled: true,
      order: 5,
      content: {
        // Copy and visuals are served from the AI studio content model;
        // this block exists for ordering and CMS visibility control.
        dataSource: "aiStudio",
      },
    },
    {
      type: "featured_products",
      id: "bestsellers",
      enabled: true,
      order: 6,
      content: {
        eyebrow: "Bestsellers",
        title: "Customer Favourites",
        query: { bestseller: true, limit: 4 },
        cta: { label: "Shop Bestsellers", href: "/products" },
        emptyMessage:
          "Our bestsellers are being prepared. Please revisit us shortly.",
      },
    },
    {
      type: "virtual_tryon",
      id: "try-on",
      enabled: true,
      order: 7,
      content: {
        eyebrow: "See It On You",
        title: {
          lines: [
            { text: "Before You Choose,", emphasis: false },
            { text: "See It Become Yours.", emphasis: true },
          ],
        },
        body: "Your mirror. Your jewellery. Your choice. Virtual Try-On places necklaces, earrings and rings on you with true-to-life scale and placement — so the piece you fall for is the piece you will love wearing.",
        points: [
          "True-to-life scale and placement",
          "Try pieces from any device, anywhere",
          "Save and compare your favourites",
        ],
        cta: { label: "Try Jewellery On", href: "/virtual-try-on" },
        secondaryCta: { label: "Book a Fitting", href: "/#stores" },
        image: {
          src: media.tryOnAtelier,
          alt: "Indian woman in an ivory silk saree wearing a delicate gold diamond pendant, hand at her neckline",
        },
      },
    },
    {
      type: "editorial",
      id: "editorial",
      enabled: true,
      order: 8,
      content: {
        eyebrow: "The Art of Gold",
        title: {
          lines: [{ text: "Tradition, Reimagined.", emphasis: false }],
        },
        lead: "Six generations of goldsmithing inform every Swarnova design — yet each piece is drawn for the way India lives today.",
        paragraphs: [
          "Our karigars carry the techniques of temple, kundan and filigree traditions; our designers translate them into lighter, wearable forms for the modern woman.",
          "Bridal heirlooms, office-wear chains, a first pair of gold studs — every motif is chosen for a story that continues long after it leaves the atelier.",
        ],
        motifs: [
          { label: "Temple", text: "Lakshmi & lotus motifs" },
          { label: "Kundan", text: "Foil-set polki tradition" },
          { label: "Contemporary", text: "Lightweight everyday gold" },
        ],
        cta: { label: "Discover Our Craft", href: "/#our-story" },
        image: {
          src: media.atelierStill,
          alt: "Master goldsmith setting diamonds into an unfinished 22K gold necklace",
        },
      },
    },
    {
      type: "why_choose_us",
      id: "why-choose-us",
      enabled: true,
      order: 9,
      content: {
        eyebrow: "Why Choose Us",
        title: "More Than Jewellery",
        items: [
          {
            icon: "gem",
            title: "Authenticity",
            text: "Certified purity and genuine, responsibly sourced materials.",
          },
          {
            icon: "hammer",
            title: "Craftsmanship",
            text: "Handcrafted with precision and a relentless eye for detail.",
          },
          {
            icon: "shieldCheck",
            title: "Trust & Reliability",
            text: "Transparent pricing, hallmarked gold and secure shipping.",
          },
          {
            icon: "heartHandshake",
            title: "Customer Care",
            text: "Dedicated, personal support for a seamless experience.",
          },
        ],
      },
    },
    {
      type: "gold_rate",
      id: "gold-rate",
      enabled: true,
      order: 10,
      content: {
        eyebrow: "Today's Gold",
        title: "The Daily Gold Rate",
        cta: { label: "View Full Rate Board", href: "/#gold-rate" },
      },
    },
    {
      type: "campaign",
      id: "campaign",
      enabled: true,
      order: 11,
      content: {
        campaignId: "CMP-2026-PRECIOUS",
        emptyMessage:
          "Our next celebration is being prepared — please return soon for the new campaign.",
      },
    },
    {
      type: "stores",
      id: "stores",
      enabled: true,
      order: 12,
      content: {
        eyebrow: "Experience Swarnova",
        title: "Visit Us In Person",
        body: "Discover the craftsmanship, explore our collections and experience Swarnova beyond the screen — over chai, in the company of our advisors.",
        query: { featured: true, limit: 3 },
        cta: { label: "View All Stores", href: "/#stores" },
      },
    },
    {
      type: "journal",
      id: "journal",
      enabled: true,
      order: 13,
      content: {
        eyebrow: "The Swarnova Journal",
        title: "Notes on Gold, Craft & Occasion",
        query: { limit: 3 },
        cta: { label: "Read All Stories", href: "/#journal" },
      },
    },
    {
      type: "newsletter",
      id: "newsletter",
      enabled: true,
      order: 14,
      content: {
        title: "Enter the World of Swarnova",
        body: "New collections, craft stories and invitations to private previews — with our compliments.",
        placeholder: "Your email address",
        buttonLabel: "Subscribe",
        successMessage:
          "Welcome to Swarnova. Your invitation will arrive by email shortly.",
        privacyNote:
          "By subscribing you agree to the house privacy notice. Unsubscribe anytime.",
      },
    },
  ],
};

export default homepage;
