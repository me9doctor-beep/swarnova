import AsyncBoundary from "../ui/AsyncBoundary.jsx";
import ErrorBoundary from "../ErrorBoundary.jsx";
import { useHomepage } from "../../hooks/useContent.js";

import Hero from "./Hero.jsx";
import TrustStrip from "./TrustStrip.jsx";
import Collections from "./Collections.jsx";
import BrandPromise from "./BrandPromise.jsx";
import AiStudio from "./AiStudio.jsx";
import FeaturedProducts from "./FeaturedProducts.jsx";
import VirtualTryOn from "./VirtualTryOn.jsx";
import Editorial from "./Editorial.jsx";
import WhyChooseUs from "./WhyChooseUs.jsx";
import GoldRate from "./GoldRate.jsx";
import CampaignBanner from "./CampaignBanner.jsx";
import Stores from "./Stores.jsx";
import Journal from "./Journal.jsx";
import NewsletterSection from "./NewsletterSection.jsx";

/**
 * CMS block registry — a homepage document lists sections by `type`,
 * each respecting { enabled, order, content }. Register new block types here.
 */
const sectionRegistry = {
  hero: Hero,
  trust_strip: TrustStrip,
  collections: Collections,
  brand_promise: BrandPromise,
  ai_studio: AiStudio,
  featured_products: FeaturedProducts,
  virtual_tryon: VirtualTryOn,
  editorial: Editorial,
  why_choose_us: WhyChooseUs,
  gold_rate: GoldRate,
  campaign: CampaignBanner,
  stores: Stores,
  journal: Journal,
  newsletter: NewsletterSection,
};

export default function HomeSections() {
  const { status, data: homepage, error, retry } = useHomepage();

  return (
    <AsyncBoundary
      status={status}
      error={error}
      onRetry={retry}
      isEmpty={status === "success" && !homepage?.sections?.length}
      emptyMessage="The homepage is being prepared. Please check back shortly."
      className="flex min-h-[60vh] items-center justify-center"
    >
      {(homepage?.sections ?? []).map((section) => {
        const SectionComponent = sectionRegistry[section.type];
        if (!SectionComponent) return null;
        return (
          <ErrorBoundary
            key={section.id ?? section.type}
            variant="section"
            label={section.type}
          >
            <SectionComponent content={section.content} />
          </ErrorBoundary>
        );
      })}
    </AsyncBoundary>
  );
}
