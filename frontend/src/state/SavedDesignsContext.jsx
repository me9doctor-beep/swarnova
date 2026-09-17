import { createContext, useCallback, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { useOwnerScopedState } from "./ownerScopedStorage.js";

/**
 * Client-side saved AI designs, partitioned by owner (Phase 11).
 *
 * Guests keep a guest partition; each signed-in customer keeps their own,
 * so saved concepts conceptually belong to Customer → Saved Designs and a
 * future iteration syncs each partition with the customer account API —
 * components remain unchanged. Saved entries snapshot the concept, so later
 * studio work never mutates what the customer saved.
 */
const SavedDesignsContext = createContext({
  designs: [],
  save: () => {},
  remove: () => {},
  has: () => false,
  count: 0,
});

const SAVED_DESIGNS_SCOPE = {
  initial: [],
  serialize: (designs) => designs,
  deserialize: (stored) => (Array.isArray(stored) ? stored : []),
  isEmpty: (designs) => !Array.isArray(designs) || designs.length === 0,
};

export function SavedDesignsProvider({ children }) {
  const [designs, setDesigns] = useOwnerScopedState(
    "saved-designs",
    SAVED_DESIGNS_SCOPE
  );

  /** Save a concept once — re-saving the same concept is a quiet no-op. */
  const save = useCallback(
    (concept) => {
      if (!concept?.id) return;
      setDesigns((prev) => {
        if (prev.some((entry) => entry.concept.id === concept.id)) return prev;
        return [
          {
            saveId: `${concept.id}-${Date.now()}`,
            savedAt: new Date().toISOString(),
            concept: JSON.parse(JSON.stringify(concept)),
          },
          ...prev,
        ];
      });
    },
    [setDesigns]
  );

  const remove = useCallback(
    (saveId) => {
      setDesigns((prev) => prev.filter((entry) => entry.saveId !== saveId));
    },
    [setDesigns]
  );

  const has = useCallback(
    (conceptId) => designs.some((entry) => entry.concept.id === conceptId),
    [designs]
  );

  const value = useMemo(
    () => ({ designs, save, remove, has, count: designs.length }),
    [designs, save, remove, has]
  );

  return (
    <SavedDesignsContext.Provider value={value}>{children}</SavedDesignsContext.Provider>
  );
}

SavedDesignsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSavedDesigns() {
  return useContext(SavedDesignsContext);
}

export default SavedDesignsContext;
