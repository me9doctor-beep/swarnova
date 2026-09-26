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

/* Cinematic hero reel (Phase 14.4A). Four campaign films share this poster
   set. The Signature poster is the existing campaign photograph (`hero.avif`);
   the Bridal / Contemporary / Heritage posters are keyframes composed to the
   same frame — model right, negative space left for the headline — and are
   also the start frames the films are generated/graded from. See
   mock/assets/videos/homepage/hero-reel/README.md for the footage slots. */
import heroReelBridalPoster from "./images/homepage/hero-reel/bridal-gold-poster.avif";
import heroReelContemporaryPoster from "./images/homepage/hero-reel/contemporary-gold-poster.avif";
import heroReelHeritagePoster from "./images/homepage/hero-reel/heritage-gold-poster.avif";

/* Hero reel footage slots. Real campaign MP4s are imported here — and only
   here — once delivered, e.g.
     import heroReelSignatureVideo from "./videos/homepage/hero-reel/signature-gold.mp4";
   Until then each slot is null: the hero shows the still photograph and is
   never animated with a synthetic stand-in. */
// const heroReelSignatureVideo = null;
import heroReelSignatureVideo from "./videos/homepage/hero-reel/signature-gold.mp4";
// const heroReelSignatureMobileVideo = null;
// const heroReelBridalVideo = null;
import heroReelSignatureVideo from "./videos/homepage/hero-reel/bridal-gold.mp4";
// const heroReelBridalMobileVideo = null;
// const heroReelContemporaryVideo = null;
import heroReelSignatureVideo from "./videos/homepage/hero-reel/contemporary.mp4";
// const heroReelContemporaryMobileVideo = null;
// const heroReelHeritageVideo = null;
import heroReelSignatureVideo from "./videos/homepage/hero-reel/heritage-statement.mp4";
// const heroReelHeritageMobileVideo = null;

/* Brand film placeholder (Phase 14.4; unchanged in 14.4A — out of scope).
   See mock/assets/videos/PLACEHOLDER_README.md. */
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

  /* Cinematic hero reel (Phase 14.4A) — posters + footage slots */
  heroReelBridalPoster,
  heroReelContemporaryPoster,
  heroReelHeritagePoster,
  heroReelSignatureVideo,
  heroReelSignatureMobileVideo,
  heroReelBridalVideo,
  heroReelBridalMobileVideo,
  heroReelContemporaryVideo,
  heroReelContemporaryMobileVideo,
  heroReelHeritageVideo,
  heroReelHeritageMobileVideo,

  /* Brand film placeholder (Phase 14.4) */
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
