import { createContext, useContext } from "react";
import PropTypes from "prop-types";
import { useStorefrontFeatures } from "../../hooks/useStorefrontFeatures.js";

/**
 * One read of platform feature availability for the customer shell.
 * Header, footer, product actions and the atelier pages share it, so a
 * disabled feature is not re-fetched from every card.
 *
 * Unknown is not open. Cards, navigation and account doors read this
 * value; the feature routes themselves re-read the provider on entry.
 */
const StorefrontFeaturesContext = createContext({
  status: "loading",
  aiStudio: false,
  virtualTryOn: false,
  error: undefined,
  retry() {},
});

export function StorefrontFeaturesProvider({ children }) {
  const features = useStorefrontFeatures();
  const known = features.data;
  const value = {
    status: features.status,
    aiStudio: known ? known.aiStudio !== false : false,
    virtualTryOn: known ? known.virtualTryOn !== false : false,
    error: features.error,
    retry: features.retry,
  };
  return (
    <StorefrontFeaturesContext.Provider value={value}>{children}</StorefrontFeaturesContext.Provider>
  );
}

StorefrontFeaturesProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useStorefrontAvailability() {
  return useContext(StorefrontFeaturesContext);
}
