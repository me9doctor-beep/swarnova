import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { catalogService } from "../services/catalogService.js";
import { useAsync } from "./useAsync.js";

/** Enabled jewellery categories for collection discovery. */
export function useCategories() {
  const provider = useDataProvider();
  const task = useCallback(() => catalogService.getCategories(provider), [provider]);
  return useAsync(task, [provider]);
}
