import { media } from "../../assets/index.js";

/**
 * MEDIA LIBRARY — MOCK DATA (Phase 8)
 * -----------------------------------------------------------------------------
 * The ONE canonical media registry. Products, homepage sections, categories,
 * campaigns and branches all reference these assets; the library never
 * duplicates an asset object into the domains that use it.
 *
 * Media record contract (mirrors a future DAM / media API):
 *
 *   id          canonical media id (MED-xxx)
 *   name        human title shown in the library
 *   fileName    original file name
 *   kind        "image" (the only kind the platform carries today)
 *   format      file format label (jpg / avif)
 *   dimensions  { width, height } in pixels, as the DAM would report
 *   size        file size in bytes
 *   src         bundled asset reference (a future API returns a URL here)
 *   alt         accessibility text inherited by every usage
 *   origin      "catalogue" | "editorial" | "branch" | "upload"
 *   uploadedAt / uploadedBy
 *
 * Usage is NOT stored on the record — it is derived by the provider from the
 * canonical domains (products, homepage, campaigns, categories, branches),
 * so an asset can never drift out of sync with the content that uses it.
 */
export const mediaLibrary = [
  {
    id: "MED-001",
    name: "Hero — Heritage Editorial",
    fileName: "hero.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 2000 },
    size: 182340,
    src: media.heroEditorial,
    alt: "Indian model in a deep burgundy silk drape wearing an ornate 22K gold and polki diamond choker necklace",
    origin: "editorial",
    uploadedAt: "2026-01-24T10:00:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-002",
    name: "Brand Promise — Ivory Portrait",
    fileName: "promise.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 2000 },
    size: 118720,
    src: media.promiseEditorial,
    alt: "Indian woman in an ivory silk saree wearing a delicate gold diamond pendant necklace",
    origin: "editorial",
    uploadedAt: "2026-01-24T10:05:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-003",
    name: "Campaign — Precious Moments",
    fileName: "campaign.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1920, height: 1280 },
    size: 201560,
    src: media.campaignStill,
    alt: "22K gold halo diamond ring on pale cream marble with jasmine buds",
    origin: "editorial",
    uploadedAt: "2026-01-25T09:30:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-004",
    name: "Atelier — Karigar at Work",
    fileName: "atelier.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 1200 },
    size: 132450,
    src: media.atelierStill,
    alt: "Master goldsmith setting diamonds into an unfinished 22K gold necklace",
    origin: "editorial",
    uploadedAt: "2026-01-25T09:42:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-005",
    name: "Rings — Catalogue Plate",
    fileName: "rings.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1600, height: 1200 },
    size: 214830,
    src: media.ringsCategory,
    alt: "22K gold diamond halo ring displayed on warm ivory silk",
    origin: "catalogue",
    uploadedAt: "2026-01-21T11:00:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-006",
    name: "Necklaces — Catalogue Plate",
    fileName: "necklaces.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1600, height: 1200 },
    size: 228410,
    src: media.necklacesCategory,
    alt: "22K gold necklace with a teardrop diamond pendant on ivory fabric",
    origin: "catalogue",
    uploadedAt: "2026-01-21T11:08:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-007",
    name: "Earrings — Catalogue Plate",
    fileName: "earrings.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1600, height: 1200 },
    size: 206920,
    src: media.earringsCategory,
    alt: "Pair of matching 22K gold and diamond chandelier drop earrings",
    origin: "catalogue",
    uploadedAt: "2026-01-21T11:15:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-008",
    name: "Bracelets — Catalogue Plate",
    fileName: "bracelets.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1600, height: 1200 },
    size: 219040,
    src: media.braceletsCategory,
    alt: "22K gold diamond tennis bracelet arranged on warm ivory satin",
    origin: "catalogue",
    uploadedAt: "2026-01-21T11:22:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-009",
    name: "Boutique — Bhubaneswar Flagship",
    fileName: "branch1.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 1067 },
    size: 124310,
    src: media.flagshipStore,
    alt: "Warm cream and gold interior of the Swarnova Bhubaneswar flagship boutique",
    origin: "branch",
    uploadedAt: "2026-01-26T08:30:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-010",
    name: "Boutique — Cuttack",
    fileName: "branch2.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 1067 },
    size: 127540,
    src: media.boutiqueCuttack,
    alt: "Warm cream marble and gold interior of a Swarnova boutique with glass vitrines",
    origin: "branch",
    uploadedAt: "2026-01-26T08:34:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-011",
    name: "Boutique — Rourkela",
    fileName: "branch3.avif",
    kind: "image",
    format: "avif",
    dimensions: { width: 1600, height: 1067 },
    size: 131280,
    src: media.boutiqueRourkela,
    alt: "Inviting cream and champagne gold Swarnova boutique interior with display cases",
    origin: "branch",
    uploadedAt: "2026-01-26T08:39:00+05:30",
    uploadedBy: "Swarnova Studio",
  },
  {
    id: "MED-012",
    name: "Makar Festive Editorial",
    fileName: "festive-makar.jpg",
    kind: "image",
    format: "jpg",
    dimensions: { width: 1600, height: 1067 },
    size: 154420,
    src: media.festiveMakar,
    alt: "22K gold temple-work necklace with ruby accents on ivory silk beside a brass diya and jasmine buds",
    origin: "upload",
    uploadedAt: "2026-09-15T10:05:00+05:30",
    uploadedBy: "Super Admin",
  },
];

export default mediaLibrary;
