import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

/** Daily indicative gold-rate board. */
export function useGoldRateBoard() {
  const provider = useDataProvider();
  const task = useCallback(
    () => contentService.getGoldRateBoard(provider),
    [provider]
  );
  return useAsync(task, [provider]);
}
