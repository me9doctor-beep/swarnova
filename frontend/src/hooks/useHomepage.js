import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/** Homepage document: the CMS-ordered list of sections to render. */
export function useHomepage() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getHomepage(provider), [provider]);
  return useAsync(task, [provider]);
}
