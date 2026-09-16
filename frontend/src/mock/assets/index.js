/**
 * SWARNOVA — MOCK ASSET REGISTRY
 * -----------------------------------------------------------------------------
 * The single boundary for every image used by the mock homepage.
 *
 * ALL imagery is imported locally so it is bundled with the app and never
 * depends on an external CDN at runtime. UI components and mock data must
 * NEVER hard-code image paths — they receive media references through the
 * data layer (e.g. `product.images[0]`).
 *
 * When the API provider replaces the mock provider, these keys map directly
 * to asset URLs returned by the backend / DAM.
 */

/* Homepage / campaign editorial */
import heroEditorial from "./images/homepage/hero.avif";
import promiseEditorial from "./images/homepage/promise.avif";
import campaignStill from "./images/homepage/campaign.jpg";
import atelierStill from "./images/homepage/atelier.avif";
import bridalEditorial from "./images/homepage/bridal.avif";

/* Collection discovery */
import ringsCategory from "./images/categories/rings.jpg";
import necklacesCategory from "./images/categories/necklaces.jpg";
import earringsCategory from "./images/categories/earrings.jpg";
import braceletsCategory from "./images/categories/bracelets.jpg";

/* AI Jewellery Studio */
import aiTriptych from "./images/ai/triptych.jpg";
import wearAi from "./images/ai/wear_ai.avif";

/* Boutique network */
import boutiqueBhubaneswar from "./images/branches/branch1.avif";
import boutiqueCuttackImg from "./images/branches/branch2.avif";
import boutiqueRourkelaImg from "./images/branches/branch3.avif";

export const media = {
  /* Homepage */
  heroEditorial,
  promiseEditorial,
  campaignStill,
  atelierStill,

  /* Collection discovery */
  ringsCategory,
  necklacesCategory,
  earringsCategory,
  braceletsCategory,

  /* AI Jewellery Studio */
  aiTriptych,

  /* Branches (individual store photography) */
  flagshipStore: boutiqueBhubaneswar,
  boutiqueCuttack: boutiqueCuttackImg,
  boutiqueRourkela: boutiqueRourkelaImg,

  /* Product catalogue (catalogue stills, grouped by category) */
  productPendant: necklacesCategory,
  productFloralSet: necklacesCategory,
  productSolitaireRing: ringsCategory,
  productHaloRing: ringsCategory,
  productDropEarrings: earringsCategory,
  productDiamondHoops: earringsCategory,
  productTennisBracelet: braceletsCategory,
  productEternalBracelet: braceletsCategory,

  /* Virtual Try-On */
  tryOnAtelier: wearAi,

  /* Journal */
  journalBridal: bridalEditorial,
  journalMotifs: aiTriptych,
  journalCraft: atelierStill,
};

export default media;
