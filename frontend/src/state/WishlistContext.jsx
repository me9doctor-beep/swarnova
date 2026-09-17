import { createContext, useCallback, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { useOwnerScopedState } from "./ownerScopedStorage.js";

/**
 * Client-side wishlist state, partitioned by owner (Phase 11).
 *
 * Guests keep a guest partition; each signed-in customer keeps their own,
 * so Customer A never sees Customer B's wishlist on a shared browser. A
 * future iteration syncs each partition with the customer account API —
 * components remain unchanged.
 */
const WishlistContext = createContext({
  ids: new Set(),
  toggle: () => {},
  has: () => false,
  count: 0,
});

const WISHLIST_SCOPE = {
  initial: new Set(),
  serialize: (ids) => [...ids],
  deserialize: (stored) => new Set(Array.isArray(stored) ? stored : []),
  isEmpty: (ids) => !(ids instanceof Set) || ids.size === 0,
};

export function WishlistProvider({ children }) {
  const [ids, setIds] = useOwnerScopedState("wishlist", WISHLIST_SCOPE);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [setIds]);

  const has = useCallback((id) => ids.has(id), [ids]);

  const value = useMemo(
    () => ({ ids, toggle, has, count: ids.size }),
    [ids, toggle, has]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

WishlistProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useWishlist() {
  return useContext(WishlistContext);
}

export default WishlistContext;
