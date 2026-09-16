import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/** AI Jewellery Studio marketing content and concept model. */
export function useAiStudio() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getAiStudio(provider), [provider]);
  return useAsync(task, [provider]);
}
