import { useCallback } from "react";
import { useDataProvider } from "../services/providers/DataProvider.jsx";
import { virtualTryOnService } from "../services/virtualTryOnService.js";
import { useAsync } from "./useAsync.js";

/** The digital fitting room's content model — copy plus the curated sample
 *  portraits the room offers as stand-ins. */
export function useTryOnRoom() {
  const provider = useDataProvider();
  const task = useCallback(() => virtualTryOnService.getRoom(provider), [provider]);
  return useAsync(task, [provider]);
}

export default useTryOnRoom;
