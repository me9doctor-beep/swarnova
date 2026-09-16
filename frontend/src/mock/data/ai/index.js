import { media } from "../../assets/index.js";

/**
 * AI Jewellery Studio promotional content plus an example concept in the
 * shape of a future AI-service API response (id / status / prompt / assets).
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

export default aiStudio;
