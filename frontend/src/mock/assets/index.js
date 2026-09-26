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

/* Cinematic video — placeholder stand-ins for Phase 14.4. These are minimal
   valid MP4 containers that exercise the native <video> pipeline (muted
   autoplay, loop, playsInline, poster fallback, error recovery). They are
   intentionally tiny (sub-kilobyte, still champagne frame) so the hero
   photograph remains the dominant visual until the house delivers final
   compressed H.264/H.265 campaign footage. */
import heroCinematicVideo from "./videos/homepage/hero-cinematic.mp4";
import heroCinematicMobileVideo from "./videos/homepage/hero-cinematic-mobile.mp4";
import artOfGoldVideo from "./videos/editorial/art-of-gold.mp4";

/* Collection discovery */
import ringsCategory from "./images/categories/rings.jpg";
import necklacesCategory from "./images/categories/necklaces.jpg";
import earringsCategory from "./images/categories/earrings.jpg";
import braceletsCategory from "./images/categories/bracelets.jpg";

/* AI Jewellery Studio */
import aiTriptych from "./images/ai/triptych.jpg";
import wearAi from "./images/ai/wear_ai.avif";

/* Virtual Try-On — sample customer portraits and the mock fitting results a
   future try-on backend would render. They stay inside the mock boundary;
   the room UI receives them through the provider like any other media. */
import tryOnSampleMeera from "./images/try-on/sample-meera.jpg";
import tryOnSampleMeeraResult from "./images/try-on/result-meera.jpg";
import tryOnSampleAnanya from "./images/try-on/sample-ananya.jpg";
import tryOnSampleAnanyaResult from "./images/try-on/result-ananya.jpg";
import tryOnSampleIshita from "./images/try-on/sample-ishita.jpg";
import tryOnSampleIshitaResult from "./images/try-on/result-ishita.jpg";

/* Boutique network */
import boutiqueBhubaneswar from "./images/branches/branch1.avif";
import boutiqueCuttackImg from "./images/branches/branch2.avif";
import boutiqueRourkelaImg from "./images/branches/branch3.avif";

/* Media library — uploaded editorial awaiting a placement (Phase 8 media
   governance seeds; not yet referenced by any product or content block) */
import festiveMakar from "./images/media/festive-makar.jpg";

export const media = {
  /* Homepage */
  heroEditorial,
  promiseEditorial,
  campaignStill,
  atelierStill,

  /* Cinematic video placeholders (Phase 14.4) */
  heroCinematicVideo,
  heroCinematicMobileVideo,
  artOfGoldVideo,

  /* Collection discovery */
  ringsCategory,
  necklacesCategory,
  earringsCategory,
  braceletsCategory,

  /* AI Jewellery Studio */
  aiTriptych,

  /* AI concept gallery — stills the mock atelier renders as generated
     concepts. They reuse the house's catalogue and editorial photography;
     a future AI backend returns its own render URLs through these keys. */
  aiConceptNecklace: necklacesCategory,
  aiConceptRing: ringsCategory,
  aiConceptEarrings: earringsCategory,
  aiConceptBracelet: braceletsCategory,
  aiConceptBridal: bridalEditorial,
  aiConceptAtelier: atelierStill,

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

  /* Media library (unplaced uploads) */
  festiveMakar,

  /* Virtual Try-On */
  tryOnAtelier: wearAi,
  tryOnSampleMeera,
  tryOnSampleMeeraResult,
  tryOnSampleAnanya,
  tryOnSampleAnanyaResult,
  tryOnSampleIshita,
  tryOnSampleIshitaResult,

  /* Journal */
  journalBridal: bridalEditorial,
  journalMotifs: aiTriptych,
  journalCraft: atelierStill,
};

export default media;
