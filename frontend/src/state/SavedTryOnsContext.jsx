import { createContext, useCallback, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { useOwnerScopedState } from "./ownerScopedStorage.js";

/**
 * Client-side saved try-on results, partitioned by owner (Phase 11).
 *
 * Guests keep a guest partition; each signed-in customer keeps their own,
 * so saved try-ons conceptually belong to Customer → Saved Try-Ons and a
 * future iteration syncs each partition with the customer account API —
 * components remain unchanged. The Virtual Try-On integration is untouched.
 */
const SavedTryOnsContext = createContext({
  savedResults: [],
  saveResult: () => {},
  removeResult: () => {},
  hasResult: () => false,
  count: 0,
});

const SAVED_TRY_ONS_SCOPE = {
  initial: [],
  serialize: (savedResults) => savedResults,
  deserialize: (stored) => (Array.isArray(stored) ? stored : []),
  isEmpty: (savedResults) =>
    !Array.isArray(savedResults) || savedResults.length === 0,
};

export function SavedTryOnsProvider({ children }) {
  const [savedResults, setSavedResults] = useOwnerScopedState(
    "saved-try-ons",
    SAVED_TRY_ONS_SCOPE
  );

  const saveResult = useCallback(
    (rawResult) => {
      if (!rawResult?.id) return;
      setSavedResults((previous) => {
        if (previous.some((entry) => entry.result?.id === rawResult.id)) return previous;
        const snapshot = {
          saveId: `${rawResult.id}-${Date.now()}`,
          savedAt: new Date().toISOString(),
          result: JSON.parse(
            JSON.stringify({
              id: rawResult.id,
              sourceType: rawResult.source?.sourceType ?? "product",
              sourceId: rawResult.source?.sourceId ?? rawResult.id,
              jewellery:
                rawResult.source?.jewellery?.name ??
                (typeof rawResult.jewellery === "string" ? rawResult.jewellery : rawResult.jewellery?.name) ??
                "Fine Jewellery",
              jewelleryDetails: rawResult.source?.jewellery ?? null,
              photoReference:
                rawResult.photo?.origin === "sample"
                  ? { origin: "sample", sampleId: rawResult.photo.sampleId }
                  : { origin: "upload", name: rawResult.photo?.name ?? "Customer Photo" },
              resultReference: rawResult.image ?? rawResult.resultReference,
              createdAt: rawResult.createdAt ?? new Date().toISOString(),
            })
          ),
        };
        return [snapshot, ...previous];
      });
    },
    [setSavedResults]
  );

  const removeResult = useCallback(
    (saveId) => {
      setSavedResults((prev) => prev.filter((entry) => entry.saveId !== saveId));
    },
    [setSavedResults]
  );

  const hasResult = useCallback(
    (resultId) => savedResults.some((entry) => entry.result?.id === resultId),
    [savedResults]
  );

  const value = useMemo(
    () => ({
      savedResults,
      saveResult,
      removeResult,
      hasResult,
      count: savedResults.length,
    }),
    [savedResults, saveResult, removeResult, hasResult]
  );

  return (
    <SavedTryOnsContext.Provider value={value}>{children}</SavedTryOnsContext.Provider>
  );
}

SavedTryOnsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSavedTryOns() {
  return useContext(SavedTryOnsContext);
}

export default SavedTryOnsContext;
