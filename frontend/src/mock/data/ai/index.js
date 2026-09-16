import { media } from "../../assets/index.js";

/**
 * AI JEWELLERY STUDIO — MOCK DATA
 * -----------------------------------------------------------------------------
 * Two contracts live in this domain:
 *
 *   aiStudio   — the homepage marketing section (Phase 0): editorial copy,
 *                the three steps and one sample concept in the shape of a
 *                future AI-service API response.
 *
 *   aiAtelier  — the dedicated /ai-studio experience (Phase 5): page copy,
 *                the prompt field, the structured design-direction options
 *                and the inspiration examples. The option ids are the same
 *                ones the mock provider matches against and that a future
 *                AI backend would accept and return.
 *
 *   aiDesigns  — the atelier's design library: the fixture a future AI
 *                backend's generation endpoint would replace. The jewellery
 *                type ids are the catalogue's own category slugs, so a
 *                generated concept can point straight at the existing
 *                catalogue without an invented mapping.
 *
 * Generated concept shape (the existing `sampleConcept` contract, extended
 * only where Phase 5 requires it):
 *
 *   { id, title, promptSummary, category, style, occasion, purity,
 *     status, story, images: [{ src, alt }] }
 *
 * `images[0]` is the original concept plate; every further plate is a
 * rendered variation.
 */
export const aiStudio = {
  id: "AIS-HOME",
  eyebrow: "AI Jewellery Studio",
  titleLines: ["Imagine It.", "Describe It.", "Make It Yours."],
  body: "Our AI Jewellery Studio is a modern artisan — it listens to your words, sketches your ideas and renders them as 22K gold concepts, refined by master karigars before a single stroke is made.",
  points: [
    "Describe your piece in everyday words",
    "Receive a photorealistic gold concept",
    "Refine it with our design atelier, then craft it",
  ],
  steps: [
    {
      code: "01",
      label: "Your Idea",
      caption: "A motif, a mood, a memory — share what inspires you.",
    },
    {
      code: "02",
      label: "AI Jewellery Creation",
      caption: "Your words become a photorealistic gold concept.",
    },
    {
      code: "03",
      label: "Your Unique Design",
      caption: "Reviewed, refined and handcrafted by our karigars.",
    },
  ],
  triptych: {
    src: media.aiTriptych,
    alt: "Three-stage jewellery design storyboard — gemstones and sketches, an AI-rendered gold necklace concept, and the finished piece on a velvet bust",
  },
  cta: { label: "Create Your Design", href: "/ai-studio" },
  secondaryCta: { label: "See How It Works", href: "/our-story#ai" },
  sampleConcept: {
    id: "AI-001",
    title: "Contemporary Lotus Temple Necklace",
    promptSummary:
      "A 22K gold necklace for a modern bride: blooming lotus motifs, temple-jewellery lineage, light enough for everyday wear.",
    category: "necklace",
    purity: "22K",
    status: "completed",
    images: [{ src: media.aiTriptych, alt: "Contemporary lotus necklace concept and finished piece" }],
  },
};

/** Design-direction options offered beside the prompt. Natural language stays
 *  primary — every option also defaults to "No preference". The ids are the
 *  catalogue's own category slugs / the provider's matching vocabulary. */
const atelierContext = {
  heading: "Design direction — optional",
  fields: {
    jewelleryType: "Jewellery Type",
    style: "Style",
    occasion: "Occasion",
    purity: "Gold Purity",
  },
  anyOption: "No preference",
  jewelleryTypes: [
    { id: "necklaces", label: "Necklace" },
    { id: "rings", label: "Ring" },
    { id: "earrings", label: "Earrings" },
    { id: "bracelets", label: "Bracelet" },
  ],
  styles: [
    { id: "temple", label: "Temple" },
    { id: "heritage", label: "Traditional" },
    { id: "contemporary", label: "Contemporary" },
    { id: "minimal", label: "Minimal" },
  ],
  occasions: [
    { id: "bridal", label: "Bridal" },
    { id: "festive", label: "Festive" },
    { id: "everyday", label: "Everyday" },
  ],
  purities: [
    { id: "22K", label: "22K Gold" },
    { id: "18K", label: "18K Gold" },
  ],
};

/** The dedicated AI Jewellery Studio page — copy and structure only. All
 *  generation behaviour lives behind the provider interface. */
export const aiAtelier = {
  id: "AIS-ATELIER",
  page: {
    eyebrow: "Swarnova AI Studio",
    title: "Imagine the Jewellery",
    description:
      "Describe the piece you envision in your own words — the atelier renders it as a gold concept you can explore, refine, save and share.",
  },
  prompt: {
    heading: "What would you like to create?",
    label: "Describe your jewellery",
    placeholder: "Describe the jewellery you envision...",
    hint: "Natural words are enough — a motif, a mood, an occasion. Press Ctrl + Enter to create.",
    submit: "Create Design",
  },
  context: atelierContext,
  inspirations: {
    heading: "Or begin with an inspiration",
    examples: [
      {
        id: "bridal-temple",
        label: "Bridal",
        prompt: "An elegant 22K bridal necklace inspired by temple architecture.",
      },
      {
        id: "contemporary-ring",
        label: "Contemporary",
        prompt: "A contemporary gold ring with a minimal sculptural form.",
      },
      {
        id: "modern-jhumka",
        label: "Traditional",
        prompt: "A traditional jhumka with a modern silhouette.",
      },
      {
        id: "festive-bracelet",
        label: "Festive",
        prompt: "A festive gold bracelet with delicate handcrafted detail.",
      },
      {
        id: "minimal-everyday",
        label: "Minimal",
        prompt: "A minimal everyday ring with a quiet, refined profile.",
      },
    ],
  },
  result: {
    heading: "Your Design",
    emptyMessage:
      "Your concept will appear here. Describe a piece and choose Create Design — the atelier takes a moment to render it in gold.",
    yourWords: "Your words",
    storyHeading: "The atelier's note",
    variationsHeading: "Variations",
    originalPlate: "Original",
    variationPrefix: "Variation",
    savedMessage: "Your design has been saved to the atelier.",
  },
  generation: {
    creating: "Creating your jewellery concept...",
    refining: "Refining your design...",
    varying: "Rendering variations of your design...",
    errorFallback: "The atelier could not render this concept. Please try again.",
  },
  actions: {
    refine: "Refine",
    vary: "Create Variation",
    save: "Save Design",
    saved: "Design Saved",
    share: "Share",
  },
  refine: {
    heading: "Refine this design",
    label: "Your refinement",
    placeholder: "Make the necklace more traditional and add a more intricate pendant.",
    hint: "Tell the atelier what to change — it re-renders the concept from your words.",
    submit: "Refine Design",
    cancel: "Keep as It Is",
  },
  share: {
    copied: "The concept's link has been copied to your clipboard.",
    shared: "Thank you for sharing this concept.",
    unavailable: "Sharing is not available in this browser just yet.",
  },
  savedDesigns: {
    eyebrow: "Your Atelier",
    title: "Saved Designs",
    description:
      "Concepts you save remain in your atelier for this visit — ready to reopen, refine again or carry forward.",
    empty: "No saved designs yet — save a concept above and it will wait for you here.",
    open: "Open in Studio",
    remove: "Remove",
  },
  nextSteps: {
    eyebrow: "Continue",
    title: "From Concept to Jewellery",
    description:
      "Every concept imagined here can travel onward into the Swarnova catalogue — explore pieces close to your idea, or continue with our atelier when you are ready.",
    cta: { label: "Explore Similar Jewellery", href: "/products" },
    secondaryCta: { label: "Browse All Collections", href: "/collections" },
  },
};

/** The atelier's design library — what the mock provider "renders" for a
 *  prompt. A future AI backend replaces this wholesale; the concept shape it
 *  returns is the one documented above. */
export const aiDesigns = [
  {
    id: "AID-001",
    title: "Temple Bridal Necklace",
    category: "necklaces",
    style: "temple",
    occasion: "bridal",
    purity: "22K",
    keywords: ["necklace", "haaram", "temple", "bridal", "traditional", "elegan"],
    story:
      "Drawn from the gopuram's tiers, this concept layers lotus medallions beneath a carved pendant — temple lineage, rendered for the modern bride.",
    image: {
      src: media.aiConceptNecklace,
      alt: "AI-rendered concept of a 22K gold temple bridal necklace with a teardrop pendant",
    },
    variationPlates: [
      {
        src: media.aiTriptych,
        alt: "Concept variation — the temple necklace storyboard with sketch and rendered plates",
      },
      {
        src: media.aiConceptBridal,
        alt: "Concept variation — the bridal necklace styled on a bride in full attire",
      },
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the necklace reviewed on the atelier workbench",
      },
    ],
  },
  {
    id: "AID-002",
    title: "Contemporary Lotus Necklace",
    category: "necklaces",
    style: "contemporary",
    occasion: "bridal",
    purity: "22K",
    keywords: ["necklace", "lotus", "contemporary", "modern", "bridal"],
    story:
      "A blooming lotus re-drawn with clean, sculpted petals — a contemporary necklace for the bride who carries tradition lightly.",
    image: {
      src: media.aiTriptych,
      alt: "AI-rendered concept of a contemporary lotus necklace — storyboard, render and finished piece",
    },
    variationPlates: [
      {
        src: media.aiConceptNecklace,
        alt: "Concept variation — the lotus necklace with a deeper pendant drop",
      },
      {
        src: media.aiConceptBridal,
        alt: "Concept variation — the lotus necklace worn as part of a bridal ensemble",
      },
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the lotus necklace under atelier review",
      },
    ],
  },
  {
    id: "AID-003",
    title: "Sculptural Minimal Ring",
    category: "rings",
    style: "minimal",
    occasion: "everyday",
    purity: "18K",
    keywords: ["ring", "band", "minimal", "sculptural", "contemporary", "modern", "everyday"],
    story:
      "One unbroken curve of gold, hollowed and polished to a soft sheen — a sculptural band meant to be worn every day, not kept for occasions.",
    image: {
      src: media.aiConceptRing,
      alt: "AI-rendered concept of a sculptural minimal gold ring on ivory silk",
    },
    variationPlates: [
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the sculptural ring reviewed beside atelier sketches",
      },
      {
        src: media.aiTriptych,
        alt: "Concept variation — the ring's design storyboard from sketch to render",
      },
      {
        src: media.aiConceptBridal,
        alt: "Concept variation — the ring styled for a ceremony",
      },
    ],
  },
  {
    id: "AID-004",
    title: "Heritage Jhumka Reimagined",
    category: "earrings",
    style: "heritage",
    occasion: "festive",
    purity: "22K",
    keywords: ["jhumka", "earring", "traditional", "heritage", "festive", "modern"],
    story:
      "The beloved jhumka silhouette kept whole, its dome lightened and its pearls re-set — heritage worn with a modern silhouette.",
    image: {
      src: media.aiConceptEarrings,
      alt: "AI-rendered concept of reimagined heritage jhumka earrings in 22K gold",
    },
    variationPlates: [
      {
        src: media.aiConceptBridal,
        alt: "Concept variation — the jhumkas styled with festive bridal attire",
      },
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the jhumkas on the atelier workbench",
      },
      {
        src: media.aiTriptych,
        alt: "Concept variation — the jhumka storyboard from sketch to finished pair",
      },
    ],
  },
  {
    id: "AID-005",
    title: "Festive Sculpted Bracelet",
    category: "bracelets",
    style: "contemporary",
    occasion: "festive",
    purity: "22K",
    keywords: ["bracelet", "bangle", "kada", "festive", "contemporary", "delicate"],
    story:
      "A slim sculpted cuff that catches lamplight the way a bangle catches morning — festive sparkle, kept light on the wrist.",
    image: {
      src: media.aiConceptBracelet,
      alt: "AI-rendered concept of a sculpted festive gold bracelet",
    },
    variationPlates: [
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the bracelet under atelier review",
      },
      {
        src: media.aiTriptych,
        alt: "Concept variation — the bracelet's storyboard from sketch to render",
      },
      {
        src: media.aiConceptBridal,
        alt: "Concept variation — the bracelet worn with festive attire",
      },
    ],
  },
  {
    id: "AID-006",
    title: "Regal Heritage Ensemble",
    category: "necklaces",
    style: "heritage",
    occasion: "bridal",
    purity: "22K",
    keywords: ["necklace", "set", "ensemble", "heritage", "regal", "bridal", "traditional", "jhumka"],
    story:
      "A bridal ensemble in the old court style — matched necklace and drops, repoussé work across every element, finished for the wedding morning.",
    image: {
      src: media.aiConceptBridal,
      alt: "AI-rendered concept of a regal bridal jewellery ensemble styled on a bride",
    },
    variationPlates: [
      {
        src: media.aiConceptNecklace,
        alt: "Concept variation — the ensemble's necklace rendered alone",
      },
      {
        src: media.aiConceptEarrings,
        alt: "Concept variation — the ensemble's matching drops rendered alone",
      },
      {
        src: media.aiConceptAtelier,
        alt: "Concept variation — the ensemble reviewed in the atelier",
      },
    ],
  },
];

export default aiStudio;
