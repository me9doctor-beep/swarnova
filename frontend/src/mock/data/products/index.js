import { media } from "../../assets/index.js";

/**
 * Product catalogue. Field names mirror the planned commerce API contract:
 * id / sku / name / description / purity / price (in INR, whole rupees) /
 * weight / categoryId / collectionId / images / rating / flags.
 *
 * `href` is the piece's canonical customer route — `/product/:id`, the one
 * product detail route in `app/router.jsx`. Every product card resolves
 * through it, so the route is never re-derived in the presentation layer.
 *
 * `description` is the piece's story, the copy the product detail screen
 * presents in its editorial band. It lives here, in the mock boundary, so the
 * screen stays provider-driven; the API provider returns the same field.
 */
export const products = [
  {
    id: "JWL-001",
    sku: "SWN-PND-001",
    name: "Hrudaya Diamond Pendant",
    description:
      "An open teardrop, drawn thin at the shoulder so the light passes clean through it. Hrudaya sits close to the collarbone — a piece for the hours in between, worn as easily against cotton as against silk.",
    purity: "22K",
    price: 72400,
    currency: "INR",
    weight: "8.6 g",
    categoryId: "CAT-NECKLACES",
    collectionId: "COL-EVERYDAY",
    images: [
      {
        src: media.productPendant,
        alt: "22K gold necklace with an open teardrop diamond pendant on ivory fabric",
      },
    ],
    rating: { average: 4.9, count: 126 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-001",
  },
  {
    id: "JWL-002",
    sku: "SWN-RNG-014",
    name: "Eternal Halo Ring",
    description:
      "A single centre held in a quiet circle of light. The halo sits low against the finger and the band tapers toward the palm, so Eternal Halo reads as a promise rather than a statement.",
    purity: "22K",
    price: 56800,
    currency: "INR",
    weight: "6.2 g",
    categoryId: "CAT-RINGS",
    collectionId: "COL-SIGNATURE",
    images: [
      {
        src: media.productSolitaireRing,
        alt: "Ornate 22K gold diamond halo ring displayed on warm ivory silk",
      },
    ],
    rating: { average: 5.0, count: 98 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-002",
  },
  {
    id: "JWL-003",
    sku: "SWN-ERG-022",
    name: "Aabharan Drop Earrings",
    description:
      "Chandelier drops that move a half-beat after you do. Aabharan is made for the wedding hours — long enough to catch light across a crowded room, balanced so it never pulls at the ear.",
    purity: "22K",
    price: 84900,
    currency: "INR",
    weight: "11.8 g",
    categoryId: "CAT-EARRINGS",
    collectionId: "COL-BRIDAL",
    images: [
      {
        src: media.productDropEarrings,
        alt: "Pair of matching 22K gold and diamond chandelier drop earrings",
      },
    ],
    rating: { average: 4.9, count: 74 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-003",
  },
  {
    id: "JWL-004",
    sku: "SWN-BRC-008",
    name: "Lumina Tennis Bracelet",
    description:
      "A continuous line of round diamonds, each held in its own collet so the wrist stays free to move. Lumina is the piece the house returns to: alone it is complete, beside a watch it settles into the day.",
    purity: "22K",
    price: 112500,
    currency: "INR",
    weight: "14.4 g",
    categoryId: "CAT-BRACELETS",
    collectionId: "COL-SIGNATURE",
    images: [
      {
        src: media.productTennisBracelet,
        alt: "22K gold tennis bracelet lined with round diamonds on ivory satin",
      },
    ],
    rating: { average: 4.8, count: 61 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-004",
  },
  {
    id: "JWL-005",
    sku: "SWN-NCK-031",
    name: "Pushp Pendant Necklace",
    description:
      "A floral pendant carried on a substantial chain, and the weightiest piece in the Virasat collections. Pushp takes the temple motif those collections are built on and sets it plain, letting the gold itself carry the pattern instead of filigree.",
    purity: "22K",
    price: 142000,
    currency: "INR",
    weight: "28.9 g",
    categoryId: "CAT-NECKLACES",
    collectionId: "COL-HERITAGE",
    images: [
      {
        src: media.productFloralSet,
        alt: "22K gold pendant necklace with an open teardrop diamond setting",
      },
    ],
    rating: { average: 4.9, count: 43 },
    tryOnAvailable: false,
    featured: true,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-005",
  },
  {
    id: "JWL-006",
    sku: "SWN-RNG-021",
    name: "Aadvika Halo Ring",
    description:
      "A halo ring with a studded shoulder, scaled for a hand that wears rings every day. Aadvika sits flatter than a solitaire and wears closer to the finger — an everyday piece that never asks to be taken off.",
    purity: "22K",
    price: 64300,
    currency: "INR",
    weight: "7.1 g",
    categoryId: "CAT-RINGS",
    collectionId: "COL-EVERYDAY",
    images: [
      {
        src: media.productHaloRing,
        alt: "22K gold cocktail ring with a diamond halo and studded band",
      },
    ],
    rating: { average: 4.8, count: 87 },
    tryOnAvailable: true,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-006",
  },
  {
    id: "JWL-007",
    sku: "SWN-ERG-030",
    name: "Aabha Chandelier Earrings",
    description:
      "Teardrops that stop short of the shoulder — the shorter sibling of the house's bridal chandeliers. Aabha is light enough for a working day and finished well enough for the evening that follows it.",
    purity: "22K",
    price: 49600,
    currency: "INR",
    weight: "7.9 g",
    categoryId: "CAT-EARRINGS",
    collectionId: "COL-EVERYDAY",
    images: [
      {
        src: media.productDiamondHoops,
        alt: "Pair of 22K gold teardrop chandelier earrings set with diamonds",
      },
    ],
    rating: { average: 4.7, count: 52 },
    tryOnAvailable: true,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-007",
  },
  {
    id: "JWL-008",
    sku: "SWN-BRC-017",
    name: "Saanjh Diamond Line Bracelet",
    description:
      "Saanjh — the hour between day and evening — is a line bracelet in the truest sense: one unbroken row of diamonds, no clasp ornament, nothing to catch on a sleeve. The quietest piece in the Signature collections.",
    purity: "22K",
    price: 98700,
    currency: "INR",
    weight: "12.2 g",
    categoryId: "CAT-BRACELETS",
    collectionId: "COL-SIGNATURE",
    images: [
      {
        src: media.productEternalBracelet,
        alt: "22K gold line bracelet set with a continuous row of diamonds",
      },
    ],
    rating: { average: 4.8, count: 39 },
    tryOnAvailable: true,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-008",
  },
];

export default products;
