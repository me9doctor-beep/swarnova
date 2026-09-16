import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * Client-side wishlist state (presentation only). A future iteration syncs
 * with the customer account API — components remain unchanged.
 */
const WishlistContext = createContext({
  ids: new Set(),
  toggle: () => {},
  has: () => false,
  count: 0,
});

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

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
