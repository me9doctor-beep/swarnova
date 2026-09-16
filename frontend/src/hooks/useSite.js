import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/** Global site chrome: brand, navigation, footer columns, contact, legal. */
export function useSite() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getSite(provider), [provider]);
  return useAsync(task, [provider]);
}
