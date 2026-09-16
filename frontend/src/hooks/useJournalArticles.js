import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { editorialService } from "../services/editorialService.js";
import { useAsync } from "./useAsync.js";

/** Journal (editorial) articles for a query object, e.g. `{ limit: 3 }`. */
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
