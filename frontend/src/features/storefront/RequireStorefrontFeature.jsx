import PropTypes from "prop-types";
import AsyncBoundary from "../../components/ui/AsyncBoundary.jsx";
import Container from "../../components/ui/Container.jsx";
import FeatureUnavailable from "../../components/storefront/FeatureUnavailable.jsx";
import { useStorefrontFeatures } from "../../hooks/useStorefrontFeatures.js";
import { FEATURE_UNAVAILABLE_COPY, featureEntry } from "./availability.js";

/**
 * CUSTOMER FEATURE GUARD
 * ---------------------------------------------------------------------------
 * The route boundary for AI Studio and Virtual Try-On. It reads the same
 * service the shell uses (`getStorefrontFeatures` → provider → governance
 * settings). A direct URL cannot skip that read: the experience mounts only
 * after the provider has answered and the switch is on.
 *
 * Saved designs and saved fittings are not touched. Re-enabling is the next
 * read of the same switch — there is no second flag store.
 */
export default function RequireStorefrontFeature({ feature, children }) {
  const features = useStorefrontFeatures();
  const copy = FEATURE_UNAVAILABLE_COPY[feature];
  const entry = featureEntry(
    { status: features.status, [feature]: features.data?.[feature] },
    feature,
  );

  if (entry === "closed") {
    return (
      <FeatureUnavailable
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
    );
  }

  if (entry !== "open") {
    return (
      <Container className="pb-20 pt-[160px] sm:pb-28">
        <AsyncBoundary
          status={features.status === "error" ? "error" : "loading"}
          error={features.error}
          onRetry={features.retry}
          className="min-h-[320px] py-0"
        />
      </Container>
    );
  }

  return children;
}

RequireStorefrontFeature.propTypes = {
  feature: PropTypes.oneOf(["aiStudio", "virtualTryOn"]).isRequired,
  children: PropTypes.node.isRequired,
};
