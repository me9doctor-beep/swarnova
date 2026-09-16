import { media } from "../../assets/index.js";

/**
 * VIRTUAL TRY-ON — MOCK DATA (Phase 6)
 * -----------------------------------------------------------------------------
 * Two contracts live in this domain:
 *
 *   tryOnRoom   — the digital fitting room's copy model: page masthead, the
 *                 photo block, the selected-jewellery block, the result,
 *                 the actions, the change-jewellery rail and every empty /
 *                 error state. Same role as `aiAtelier` plays for the studio —
 *                 the page composes, the provider delivers.
 *
 *   tryOnSamples — the curated sample portraits a customer may stand in for.
 *                 Each sample pairs the portrait with the mock "wearing" plate
 *                 the provider resolves as the try-on result when that sample
 *                 is dressed. Uploaded photographs resolve to themselves in
 *                 the mock; a future try-on backend returns its own render.
 *
 * Try-on source contract (resolved by the provider's `getTryOnSource`, and
 * carried on every result):
 *
 *   { sourceType: "ai-design" | "product", sourceId, jewellery }
 *
 * `jewellery` is the summary the room presents — id / name / category /
 * purity / images — plus the catalogue fields (price, currency, href) only a
 * purchasable product carries. AI concepts never pretend to be purchasable.
 *
 * Try-on result contract (`createTryOn`):
 *
 *   { id, status, createdAt, source, photo, image }
 *
 * `photo` references what the customer supplied (origin, sample id or file
 * name, the portrait itself); `image` is the wearing plate. Saved entries
 * snapshot enough of this for a future backend to persist it one-to-one.
 */
export const tryOnRoom = {
  id: "VTO-ROOM",
  page: {
    eyebrow: "Virtual Try-On",
    title: "The Fitting Room",
    description:
      "See yourself wearing it. Bring your own photograph — or stand in one of our portraits — and the fitting room dresses you in the piece, exactly as it would sit in life.",
  },
  photo: {
    heading: "Your Photo",
    emptyTitle: "Begin with your portrait",
    emptyBody:
      "Upload a photograph or choose one of the sample portraits — the fitting room does the rest.",
    uploadLabel: "Upload Your Photo",
    replace: "Replace Photo",
    remove: "Remove",
    uploadHint: "A clear, front-facing photograph works best. JPG or PNG, up to 8 MB.",
    selected: "Selected photograph",
    samplesHeading: "Or begin with a sample portrait",
    sampleName: "Portrait",
  },
  jewellery: {
    heading: "Selected Jewellery",
    fromStudio: "AI Studio Design",
    fromCatalogue: "From the Catalogue",
    change: "Change Jewellery",
  },
  cta: {
    tryOn: "Try It On",
    needsPhoto: "Add your photo above to begin the try-on.",
  },
  generation: {
    preparing: "Preparing your preview...",
    errorFallback: "The fitting room could not prepare your preview. Please try again.",
  },
  result: {
    heading: "Your Try-On Preview",
    ready: "Preview Ready",
    original: "Original",
    tryOn: "Try-On",
    originalCaption: "Your Photo",
    tryOnCaption: "Try-On Preview",
    compareLabel: "Compare your photograph with the try-on preview",
  },
  actions: {
    save: "Save Result",
    saved: "Result Saved",
    share: "Share",
    change: "Change Jewellery",
    tryAgain: "Try Again",
    viewProduct: "View Jewellery",
    addToBag: "Add to Bag",
    continueDesigning: "Continue Designing",
  },
  savedMessage: "Your try-on has been saved for this visit.",
  baggedMessage: "Added to your bag.",
  share: {
    copied: "The fitting room link has been copied to your clipboard.",
    shared: "Thank you for sharing your look.",
    unavailable: "Sharing is not available in this browser just yet.",
  },
  change: {
    eyebrow: "The Fitting Room",
    title: "Choose Another Piece",
    description:
      "Every piece below is available for virtual try-on. Choose one and the fitting room keeps your photograph.",
    empty: "The rest of the try-on catalogue is being curated.",
    select: "Try This Piece",
  },
  errors: {
    noSource: {
      title: "No Jewellery Selected",
      body: "Choose a jewellery piece or return to AI Jewellery Studio.",
      studio: "Open AI Jewellery Studio",
      browse: "Browse Jewellery",
    },
    notFound: {
      title: "Not Available for Try-On",
      body: "The piece you followed here is not available for virtual try-on just now. Choose another piece from the catalogue, or return to the AI Jewellery Studio with a new idea.",
      studio: "Return to AI Jewellery Studio",
      browse: "Browse Jewellery",
    },
  },
};

/** The curated portraits the room offers as stand-ins. `resultImage` is the
 *  mock fitting plate the provider dresses the sample in; a future backend
 *  renders whatever the customer uploaded instead. */
export const tryOnSamples = [
  {
    id: "SAMPLE-01",
    name: "Meera",
    image: {
      src: media.tryOnSampleMeera,
      alt: "Sample portrait — Meera, front-facing photograph against a warm ivory backdrop, ready for virtual try-on",
    },
    resultImage: {
      src: media.tryOnSampleMeeraResult,
      alt: "Virtual try-on preview — Meera wearing the selected gold pendant necklace",
    },
  },
  {
    id: "SAMPLE-02",
    name: "Ananya",
    image: {
      src: media.tryOnSampleAnanya,
      alt: "Sample portrait — Ananya, front-facing photograph in a cream silk blouse, ready for virtual try-on",
    },
    resultImage: {
      src: media.tryOnSampleAnanyaResult,
      alt: "Virtual try-on preview — Ananya wearing the selected gold jhumka earrings",
    },
  },
  {
    id: "SAMPLE-03",
    name: "Ishita",
    image: {
      src: media.tryOnSampleIshita,
      alt: "Sample portrait — Ishita, softly smiling front-facing photograph against a champagne backdrop, ready for virtual try-on",
    },
    resultImage: {
      src: media.tryOnSampleIshitaResult,
      alt: "Virtual try-on preview — Ishita wearing the selected gold lotus necklace",
    },
  },
];

export default tryOnRoom;
