import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/**
 * Customer-safe feature switches — AI Studio and Virtual Try-On only.
 * Refetches when the customer route changes, so a Super Admin re-enable
 * is the next read of the same provider, not a second flag store.
 */
export function useStorefrontFeatures() {
  const provider = useDataProvider();
  const { pathname } = useLocation();
  const task = useCallback(() => contentService.getStorefrontFeatures(provider), [provider]);
  return useAsync(task, [provider, pathname]);
}
