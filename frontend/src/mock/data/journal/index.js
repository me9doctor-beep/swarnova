import { media } from "../../assets/index.js";

/**
 * Editorial journal articles — CMS-managed magazine content.
 */
export const journalArticles = [
  {
    id: "JRL-001",
    slug: "art-of-indian-gold",
    category: "The Craft",
    title: "The Quiet Art of Indian Gold",
    excerpt:
      "Inside the karigar's workshop, where filigree, setting and polishing turn a bar of 22K gold into a piece meant to outlive us.",
    image: {
      src: media.journalCraft,
      alt: "Artisan's hands polishing a gold ring at a jeweller's workbench",
    },
    readTime: "6 min read",
    href: "/journal/art-of-indian-gold",
  },
  {
    id: "JRL-002",
    slug: "choosing-bridal-jewellery",
    title: "Choosing Your Bridal Jewellery",
    category: "Bridal Guide",
    excerpt:
      "A calm, considered approach to the wedding trousseau — balancing temple tradition, repeat wear and the pieces that feel like you.",
    image: {
      src: media.journalBridal,
      alt: "Indian model in a deep burgundy silk drape wearing an ornate gold and polki choker",
    },
    readTime: "8 min read",
    href: "/journal/choosing-bridal-jewellery",
  },
  {
    id: "JRL-003",
    slug: "stories-behind-motifs",
    category: "Heritage",
    title: "Stories Behind Traditional Motifs",
    excerpt:
      "Lotus, mango, serpent and coin — the vocabulary of Indian gold, and what each symbol carries across generations.",
    image: {
      src: media.journalMotifs,
      alt: "Jewellery design storyboard of sketches, a rendered lotus necklace concept and the finished gold piece",
    },
    readTime: "5 min read",
    href: "/journal/stories-behind-motifs",
  },
];

export default journalArticles;
