import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/** The campaign currently scheduled for the storefront (null when none). */
export function useActiveCampaign() {
  const provider = useDataProvider();
  const task = useCallback(
    () => contentService.getActiveCampaign(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}
