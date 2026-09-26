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
   here. The four desktop films (Phase 14.4A) were supplied as 1280×720
   H.264 MP4s (~10 s each, see mock/assets/videos/homepage/hero-reel/README.md);
   the filenames already match the slot contract, so each file maps to its
   slot one-to-one. No dedicated -mobile captures were delivered yet, so the
   mobile slots stay null and narrow viewports reuse the desktop film through
   the service's mobileSrc → src fallback (cropped by the hero's mobile focal
   point). A slot without footage is never animated with a synthetic
   stand-in. */
import heroReelSignatureVideo from "./videos/homepage/hero-reel/signature-gold.mp4";
const heroReelSignatureMobileVideo = null;
import heroReelBridalVideo from "./videos/homepage/hero-reel/bridal-gold.mp4";
const heroReelBridalMobileVideo = null;
import heroReelContemporaryVideo from "./videos/homepage/hero-reel/contemporary.mp4";
const heroReelContemporaryMobileVideo = null;
import heroReelHeritageVideo from "./videos/homepage/hero-reel/heritage-statement.mp4";
const heroReelHeritageMobileVideo = null;

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

/* Multi-angle product photography (Phase 14.4B). The same piece from the
   same shoot, re-photographed from a slight left / slight right camera
   position and, where the frame passed consistency QA, a closer detail
   perspective. Each piece's canonical front still stays its existing
   catalogue photograph (above) — only the additional angles live here, under
   images/products/<product-id>/, so no primary image is duplicated. Frames
   are 1200×800 (landscape pieces) or 800×1200 (the pendant) AVIF, matching
   the aspect of the primary so card crossfades register exactly. */
import pendantAngleLeft from "./images/products/JWL-001/angle-left.avif";
import pendantAngleRight from "./images/products/JWL-001/angle-right.avif";
import pendantDetail from "./images/products/JWL-001/detail.avif";
import haloRingAngleLeft from "./images/products/JWL-002/angle-left.avif";
import haloRingAngleRight from "./images/products/JWL-002/angle-right.avif";
import dropEarringsAngleLeft from "./images/products/JWL-003/angle-left.avif";
import dropEarringsAngleRight from "./images/products/JWL-003/angle-right.avif";

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

  /* Multi-angle hover frames (Phase 14.4B) — additional camera positions of
     the piece whose primary still is named above. */
  productPendantAngleLeft: pendantAngleLeft,
  productPendantAngleRight: pendantAngleRight,
  productPendantDetail: pendantDetail,
  productSolitaireRingAngleLeft: haloRingAngleLeft,
  productSolitaireRingAngleRight: haloRingAngleRight,
  productDropEarringsAngleLeft: dropEarringsAngleLeft,
  productDropEarringsAngleRight: dropEarringsAngleRight,

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
