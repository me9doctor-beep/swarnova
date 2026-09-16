import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { aiStudioService } from "../services/aiStudioService.js";
import { useAsync } from "./useAsync.js";

/** The dedicated AI Jewellery Studio page content (copy, prompt field,
 *  design-direction options, inspiration examples). */
export function useAiAtelier() {
  const provider = useDataProvider();
  const task = useCallback(() => aiStudioService.getAtelier(provider), [provider]);
  return useAsync(task, [provider]);
}

export default useAiAtelier;
