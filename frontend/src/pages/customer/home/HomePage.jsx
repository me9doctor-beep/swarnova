import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import AsyncBoundary from "../../../components/ui/AsyncBoundary.jsx";
import ErrorBoundary from "../../../components/ui/ErrorBoundary.jsx";
import { useHomepage } from "../../../hooks/useHomepage.js";
import { useStorefrontAvailability } from "../../../features/storefront/StorefrontFeatures.jsx";
import {
  HOMEPAGE_FEATURE_SECTIONS,
  isFeatureOpen,
  omitClosedFeatureLinks,
} from "../../../features/storefront/availability.js";

import HeroSection from "./components/HeroSection.jsx";
import TrustStripSection from "./components/TrustStripSection.jsx";
import CollectionsSection from "./components/CollectionsSection.jsx";
import BrandPromiseSection from "./components/BrandPromiseSection.jsx";
import AiStudioSection from "./components/AiStudioSection.jsx";
import FeaturedProductsSection from "./components/FeaturedProductsSection.jsx";
import VirtualTryOnSection from "./components/VirtualTryOnSection.jsx";
import EditorialSection from "./components/EditorialSection.jsx";
import BrandFilmSection from "./components/BrandFilmSection.jsx";
import WhyChooseUsSection from "./components/WhyChooseUsSection.jsx";
import GoldRateSection from "./components/GoldRateSection.jsx";
import CampaignSection from "./components/CampaignSection.jsx";
import BranchesSection from "./components/BranchesSection.jsx";
import JournalSection from "./components/JournalSection.jsx";
import NewsletterSection from "./components/NewsletterSection.jsx";

/**
 * CMS block registry — a homepage document lists sections by `type`,
 * each respecting { enabled, order, content }. Register new block types here.
 */
const sectionRegistry = {
  hero: HeroSection,
  trust_strip: TrustStripSection,
  collections: CollectionsSection,
  brand_promise: BrandPromiseSection,
  ai_studio: AiStudioSection,
  featured_products: FeaturedProductsSection,
  virtual_tryon: VirtualTryOnSection,
  editorial: EditorialSection,
  brand_film: BrandFilmSection,
  why_choose_us: WhyChooseUsSection,
  gold_rate: GoldRateSection,
  campaign: CampaignSection,
  stores: BranchesSection,
  journal: JournalSection,
  newsletter: NewsletterSection,
};

/**
 * Customer storefront homepage — renders the CMS-ordered section document.
 *
 * Section anchors are part of the storefront's navigation, not decoration:
 * `site.navigation`, the footer columns and several campaign CTAs point at
 * `/#collections`, `/#stores` and friends, so an arrival that carries a hash
 * lands on that section instead of at the top of the page. Each section
 * already reserves room for the fixed header (`Section`'s `scroll-mt-28`), and
 * an unknown hash simply matches nothing — no console error, no wrong scroll.
 */
export default function HomePage() {
  const { status, data: homepage, error, retry } = useHomepage();
  const availability = useStorefrontAvailability();
  const { hash } = useLocation();

  useEffect(() => {
    if (status !== "success" || !hash) return undefined;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return undefined;
    /* Instant, never smooth: this is a destination, not a transition, and it
       reads correctly under a reduced-motion preference. */
    target.scrollIntoView({ behavior: "auto", block: "start" });
    return undefined;
  }, [hash, status]);

  return (
    <>
      <span id="top" className="sr-only" aria-hidden="true" />
      <AsyncBoundary
        status={status}
        error={error}
        onRetry={retry}
        isEmpty={status === "success" && !homepage?.sections?.length}
        emptyMessage="The homepage is being prepared. Please check back shortly."
        className="flex min-h-[60vh] items-center justify-center"
      >
        {(homepage?.sections ?? [])
          .filter((section) => {
            const feature = HOMEPAGE_FEATURE_SECTIONS[section.type];
            return !feature || isFeatureOpen(availability, feature);
          })
          .map((section) => {
            const SectionComponent = sectionRegistry[section.type];
            if (!SectionComponent) return null;
            return (
              <ErrorBoundary
                key={section.id ?? section.type}
                variant="section"
                label={section.type}
              >
                <SectionComponent content={omitClosedFeatureLinks(section.content, availability)} />
              </ErrorBoundary>
            );
          })}
      </AsyncBoundary>
    </>
  );
}
