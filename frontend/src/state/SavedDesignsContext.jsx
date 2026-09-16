import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * Client-side saved AI designs (presentation only). The atelier has no
 * customer accounts yet, so saved concepts live for the visit — a future
 * iteration syncs with the customer account API and components remain
 * unchanged. Saved entries snapshot the concept, so later studio work never
 * mutates what the customer saved.
 */
const SavedDesignsContext = createContext({
  designs: [],
  save: () => {},
  remove: () => {},
  has: () => false,
  count: 0,
});

export function SavedDesignsProvider({ children }) {
  const [designs, setDesigns] = useState([]);

  /** Save a concept once — re-saving the same concept is a quiet no-op. */
  const save = useCallback((concept) => {
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
  }, []);

  const remove = useCallback((saveId) => {
    setDesigns((prev) => prev.filter((entry) => entry.saveId !== saveId));
  }, []);

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
