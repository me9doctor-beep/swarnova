import { useCallback } from "react";
import { useDataProvider } from "../data/DataProvider.jsx";
import { editorialService } from "../services/editorialService.js";
import { useAsync } from "./useAsync.js";

export function useJournalArticles(query = {}) {
  const provider = useDataProvider();
  const key = JSON.stringify(query);
  const task = useCallback(
    () => editorialService.getJournalArticles(provider, query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [provider, key]
  );
  return useAsync(task, [provider, key]);
}
