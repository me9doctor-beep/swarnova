import { media } from "../../assets/index.js";

/**
 * Jewellery categories shown in "Discover Our Collections".
 * Mirrors a future catalogue/category API response.
 */
export const categories = [
  {
    id: "CAT-RINGS",
    slug: "rings",
    name: "Rings",
    tagline: "Timeless symbols of love",
    description:
      "From solitaire accents to statement cocktail rings, hand-set in 22K gold.",
    image: {
      src: media.ringsCategory,
      alt: "22K gold diamond halo ring displayed on warm ivory silk",
    },
    cta: { label: "Explore Rings", href: "/collections/rings" },
    enabled: true,
    order: 1,
  },
  {
    id: "CAT-NECKLACES",
    slug: "necklaces",
    name: "Necklaces",
    tagline: "Grace that completes you",
    description:
      "Temple necklaces, diamond pendants and bridal haarams for every occasion.",
    image: {
      src: media.necklacesCategory,
      alt: "22K gold necklace with a teardrop diamond pendant on ivory fabric",
    },
    cta: { label: "Explore Necklaces", href: "/collections/necklaces" },
    enabled: true,
    order: 2,
  },
  {
    id: "CAT-EARRINGS",
    slug: "earrings",
    name: "Earrings",
    tagline: "Elegance that frames every moment",
    description:
      "Chandelier drops, jhumkas and studs handcrafted to catch the light.",
    image: {
      src: media.earringsCategory,
      alt: "Pair of matching 22K gold and diamond chandelier drop earrings",
    },
    cta: { label: "Explore Earrings", href: "/collections/earrings" },
    enabled: true,
    order: 3,
  },
  {
    id: "CAT-BRACELETS",
    slug: "bracelets",
    name: "Bracelets",
    tagline: "Beauty around your wrist",
    description:
      "Delicate tennis bracelets, bangles and kadais with an everyday sparkle.",
    image: {
      src: media.braceletsCategory,
      alt: "22K gold diamond tennis bracelet arranged on warm ivory satin",
    },
    cta: { label: "Explore Bracelets", href: "/collections/bracelets" },
    enabled: true,
    order: 4,
  },
];

export default categories;
