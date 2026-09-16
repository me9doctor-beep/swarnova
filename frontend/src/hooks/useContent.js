import { useCallback } from "react";
import { useDataProvider } from "../data/DataProvider.jsx";
import { contentService } from "../services/contentService.js";
import { useAsync } from "./useAsync.js";

export function useSite() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getSite(provider), [provider]);
  return useAsync(task, [provider]);
}

export function useHomepage() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getHomepage(provider), [provider]);
  return useAsync(task, [provider]);
}

export function useAiStudio() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getAiStudio(provider), [provider]);
  return useAsync(task, [provider]);
}

export function useGoldRateBoard() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getGoldRateBoard(provider), [provider]);
  return useAsync(task, [provider]);
}

export function useActiveCampaign() {
  const provider = useDataProvider();
  const task = useCallback(() => contentService.getActiveCampaign(provider), [provider]);
  return useAsync(task, [provider]);
}
