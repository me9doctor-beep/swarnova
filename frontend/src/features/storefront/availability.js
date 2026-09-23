/**
 * STOREFRONT FEATURE AVAILABILITY (Phase 14.1)
 * -----------------------------------------------------------------------------
 * Platform switches for AI Studio and Virtual Try-On. The provider is the
 * authority (generation and try-on are refused when disabled). This module
 * is the shared reading of that switch for navigation, homepage sections
 * and customer entry points — one rule, not a second configuration.
 */

export const STOREFRONT_FEATURES = {
  aiStudio: "aiStudio",
  virtualTryOn: "virtualTryOn",
};

/** Homepage section types gated by a platform feature. */
export const HOMEPAGE_FEATURE_SECTIONS = {
  ai_studio: "aiStudio",
  virtual_tryon: "virtualTryOn",
};

export function isFeatureEnabled(settings, key) {
  return settings?.features?.[key]?.enabled !== false;
}

/** Pathname of an in-app href, ignoring query and hash. External links return null. */
export function featurePath(href) {
  if (!href || !href.startsWith("/") || href.startsWith("//")) return null;
  return href.split(/[?#]/)[0];
}

/** Which platform feature owns this destination, if any. */
export function routeFeatureKey(href) {
  const path = featurePath(href);
  if (!path) return null;
  if (path === "/ai-studio" || path.startsWith("/ai-studio/")) return "aiStudio";
  if (path === "/virtual-try-on" || path.startsWith("/virtual-try-on/")) return "virtualTryOn";
  return null;
}

/**
 * A feature door is offered only after the provider has answered and the
 * switch is on. Unknown is not open — a loading shell must not advertise a
 * route the house may have paused.
 */
export function isFeatureOpen(availability, key) {
  return availability?.[key] === true;
}

/**
 * Route-guard decision for one provider reading.
 * pending — the provider has not answered; the experience must not mount
 * closed  — the switch is off
 * open    — the switch is on
 */
export function featureEntry(reading, feature) {
  if (!reading || reading.status !== "success") return "pending";
  return reading[feature] === false ? "closed" : "open";
}


export function isFeatureRouteOpen(href, availability) {
  const key = routeFeatureKey(href);
  if (!key) return true;
  return isFeatureOpen(availability, key);
}

export function filterFeatureLinks(links, availability) {
  return (links ?? []).filter((link) => isFeatureRouteOpen(link.href, availability));
}

/** The customer-shell reading of governance settings. Not a second store. */
export function readingFromSettings(settings) {
  return {
    status: "success",
    aiStudio: isFeatureEnabled(settings, "aiStudio"),
    virtualTryOn: isFeatureEnabled(settings, "virtualTryOn"),
  };
}

const CONTENT_LINK_KEYS = ["cta", "primaryCta", "secondaryCta"];

/** Drop CTAs whose destination is a paused feature. Other links stay. */
export function omitClosedFeatureLinks(content, availability) {
  if (!content || typeof content !== "object" || Array.isArray(content)) return content;
  const next = { ...content };
  let changed = false;
  for (const key of CONTENT_LINK_KEYS) {
    if (next[key]?.href && !isFeatureRouteOpen(next[key].href, availability)) {
      delete next[key];
      changed = true;
    }
  }
  return changed ? next : content;
}

/** The existing unavailable notice — one copy, used by the route guard. */
export const FEATURE_UNAVAILABLE_COPY = {
  aiStudio: {
    eyebrow: "AI Jewellery Studio",
    title: "The atelier is paused",
    description:
      "The house has paused AI Jewellery Studio. Catalogue, boutiques and your account remain open.",
  },
  virtualTryOn: {
    eyebrow: "Virtual Fitting Room",
    title: "The fitting room is paused",
    description:
      "The house has paused Virtual Try-On. Catalogue pieces, boutiques and your account remain open.",
  },
};
