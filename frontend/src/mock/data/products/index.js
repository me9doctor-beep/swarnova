import { media } from "../../assets/index.js";

/**
 * Product catalogue — the ONE canonical product source of truth.
 *
 * Customer catalogue, Admin views and Super Admin governance all read the
 * same records; only the view differs (the storefront sees `published`
 * pieces, the command centre sees every lifecycle state).
 *
 * Field names mirror the planned commerce API contract:
 * id / sku / name / description / purity / price (in INR, whole rupees) /
 * weight / categoryId / collectionId / images / rating / flags.
 *
 * Governance contract (Phase 8):
 *
 *   status      one of "draft" | "submitted" | "approved" | "published" | "rejected"
 *   governance  { createdBy, updatedAt, submittedAt, approvedAt, publishedAt, rejection }
 *
 * The lifecycle is deliberately small — Draft → Submit → Review → Approve →
 * Publish, with Reject returning the piece for revision. Nothing sits between
 * those states.
 *
 * `href` is the piece's canonical customer route — `/product/:id`, the one
 * product detail route in `app/router.jsx`. Every product card resolves
 * through it, so the route is never re-derived in the presentation layer.
 *
 * `media.hoverFrames` (optional, Phase 14.4B) lists additional photographs of
 * the SAME piece from the same shoot — slight left / slight right camera
 * positions and a closer detail — in viewing order. The primary image stays
 * `images[0]`; the catalogue service resolves both into
 * `media: { primary, hoverFrames }`. Pieces without the field keep a single
 * still, and a backend may return the resolved `media` object directly.
 *
 * `description` is the piece's story, the copy the product detail screen
 * presents in its editorial band. It lives here, in the mock boundary, so the
 * screen stays provider-driven; the API provider returns the same field.
 */

/** Stamps a live catalogue piece with its governance record. */
function published(product) {
  return {
    ...product,
    status: "published",
    governance: {
      createdBy: "Swarnova Atelier",
      updatedAt: "2026-08-20T10:30:00+05:30",
      submittedAt: "2026-02-02T09:15:00+05:30",
      approvedAt: "2026-02-04T12:00:00+05:30",
      publishedAt: "2026-02-06T10:00:00+05:30",
      rejection: null,
    },
  };
}
export const products = [
  published({
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
    media: {
      hoverFrames: [
        {
          src: media.productPendantAngleLeft,
          alt: "The same teardrop diamond pendant seen from a slight left angle",
        },
        {
          src: media.productPendantAngleRight,
          alt: "The same teardrop diamond pendant seen from a slight right angle",
        },
        {
          src: media.productPendantDetail,
          alt: "Close detail of the pendant’s pavé diamonds and diamond-set bail",
        },
      ],
    },
    rating: { average: 4.9, count: 126 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-001",
  }),
  published({
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
    media: {
      hoverFrames: [
        {
          src: media.productSolitaireRingAngleLeft,
          alt: "The same halo ring seen from a slight left angle, showing its pavé shoulder",
        },
        {
          src: media.productSolitaireRingAngleRight,
          alt: "The same halo ring seen from a slight right angle, showing its openwork gallery",
        },
      ],
    },
    rating: { average: 5.0, count: 98 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-002",
  }),
  published({
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
    media: {
      hoverFrames: [
        {
          src: media.productDropEarringsAngleLeft,
          alt: "The same chandelier drop earrings seen from a slight left angle",
        },
        {
          src: media.productDropEarringsAngleRight,
          alt: "The same chandelier drop earrings seen from a slight right angle",
        },
      ],
    },
    rating: { average: 4.9, count: 74 },
    tryOnAvailable: true,
    featured: true,
    bestseller: true,
    availability: "available",
    href: "/product/JWL-003",
  }),
  published({
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
  }),
  published({
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
  }),
  published({
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
  }),
  published({
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
  }),
  published({
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
  }),

  /* ----------------------------------------------------------------------
   * Governance seeds (Phase 8) — pieces moving through the review lifecycle.
   * They are canonical catalogue records like any other; the storefront
   * simply never sees them until they reach `published`.
   * -------------------------------------------------------------------- */

  /* DRAFT — started by the Bhubaneswar admin, still missing essentials. */
  {
    id: "JWL-009",
    sku: "SWN-ERG-041",
    name: "Chandni Pearl Studs",
    description:
      "A first draft of the house's round pearl studs — description and pricing follow once the atelier confirms the setting.",
    purity: "22K",
    price: null,
    currency: "INR",
    weight: null,
    categoryId: "CAT-EARRINGS",
    collectionId: "COL-EVERYDAY",
    images: [],
    rating: null,
    tryOnAvailable: false,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-009",
    status: "draft",
    governance: {
      createdBy: "Ishita Rath — Admin, Bhubaneswar",
      updatedAt: "2026-09-15T18:05:00+05:30",
      submittedAt: null,
      approvedAt: null,
      publishedAt: null,
      rejection: null,
    },
  },

  /* SUBMITTED — complete and waiting in the Super Admin review queue. */
  {
    id: "JWL-010",
    sku: "SWN-NCK-034",
    name: "Mayura Polki Choker",
    description:
      "A close-set choker of uncut polki in 22K gold, drawn from the Mayura peacock motif of the Vadhu bridal atelier. The necklace sits high on the collarbone and finishes in a ruby-dotted clasp.",
    purity: "22K",
    price: 156800,
    currency: "INR",
    weight: "31.4 g",
    categoryId: "CAT-NECKLACES",
    collectionId: "COL-BRIDAL",
    images: [
      {
        src: media.productPendant,
        alt: "22K gold choker necklace with uncut polki settings on ivory fabric",
      },
    ],
    rating: null,
    tryOnAvailable: true,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-010",
    status: "submitted",
    governance: {
      createdBy: "Ishita Rath — Admin, Bhubaneswar",
      updatedAt: "2026-09-16T11:40:00+05:30",
      submittedAt: "2026-09-16T11:40:00+05:30",
      approvedAt: null,
      publishedAt: null,
      rejection: null,
    },
  },

  /* APPROVED — reviewed by the Super Admin, ready to publish. */
  {
    id: "JWL-011",
    sku: "SWN-BRC-035",
    name: "Surya Heritage Kada",
    description:
      "A broad temple-work kada from the Virasat atelier, its rim engraved with the Surya ray motif. Cast solid in 22K gold and finished by hand over nine days.",
    purity: "22K",
    price: 88400,
    currency: "INR",
    weight: "22.7 g",
    categoryId: "CAT-BRACELETS",
    collectionId: "COL-HERITAGE",
    images: [
      {
        src: media.productTennisBracelet,
        alt: "22K gold temple-work kada bracelet arranged on warm ivory satin",
      },
    ],
    rating: null,
    tryOnAvailable: false,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-011",
    status: "approved",
    governance: {
      createdBy: "Prakash Sahu — Admin, Cuttack",
      updatedAt: "2026-09-16T16:20:00+05:30",
      submittedAt: "2026-09-14T10:10:00+05:30",
      approvedAt: "2026-09-16T16:20:00+05:30",
      publishedAt: null,
      rejection: null,
    },
  },

  /* REJECTED — returned to the admin with an explicit reason. */
  {
    id: "JWL-012",
    sku: "SWN-NCK-029",
    name: "Tara Everyday Chain",
    description: "A light daily-wear chain in 22K gold.",
    purity: "22K",
    price: 38900,
    currency: "INR",
    weight: "9.8 g",
    categoryId: "CAT-NECKLACES",
    collectionId: "COL-EVERYDAY",
    images: [
      {
        src: media.productFloralSet,
        alt: "22K gold lightweight everyday chain on ivory fabric",
      },
    ],
    rating: null,
    tryOnAvailable: false,
    featured: false,
    bestseller: false,
    availability: "available",
    href: "/product/JWL-012",
    status: "rejected",
    governance: {
      createdBy: "Ishita Rath — Admin, Bhubaneswar",
      updatedAt: "2026-09-17T09:25:00+05:30",
      submittedAt: "2026-09-15T14:00:00+05:30",
      approvedAt: null,
      publishedAt: null,
      rejection: {
        reason:
          "Description is incomplete — add the BIS hallmark and making-charges note, then re-submit.",
        by: "Super Admin",
        at: "2026-09-17T09:25:00+05:30",
      },
    },
  },
];

export default products;
