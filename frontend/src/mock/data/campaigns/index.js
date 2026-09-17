import { media } from "../../assets/index.js";

/**
 * Promotional campaigns. The homepage renders the single active campaign;
 * `status` / `activeWindow` allow the CMS to schedule or retire banners.
 */
export const campaigns = [
  {
    id: "CMP-2026-PRECIOUS",
    status: "active",
    eyebrow: "Celebrate Life's Precious Moments",
    title: "A Piece for Every Moment Worth Keeping",
    body: "Find the perfect piece for yourself or someone you love — engagement, anniversary, festival or first gold.",
    image: {
      src: media.campaignStill,
      alt: "22K gold halo diamond ring on pale cream marble with jasmine buds",
    },
    cta: { label: "Explore Now", href: "/collections" },
    secondaryCta: { label: "Book a Private Viewing", href: "/#stores" },
    activeWindow: { start: "2025-01-01", end: "2027-12-31" },
  },
];

/** A ready-to-use payload for a scheduled / retired banner (empty state). */
export const noActiveCampaign = null;

export function getActiveCampaign(list = campaigns) {
  const now = new Date().toISOString();
  return (
    list.find((c) => {
      if (c.status !== "active") return false;
      if (!c.activeWindow) return true;
      return c.activeWindow.start <= now.slice(0, 10) && c.activeWindow.end >= now.slice(0, 10);
    }) ?? null
  );
}

export default campaigns;
