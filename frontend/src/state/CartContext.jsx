import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * Client-side shopping bag — the commerce boundary for the catalogue.
 *
 * It holds only what a customer browsing the catalogue needs: the bag lines,
 * the piece count and `add`. The bag screen, checkout, orders and payment
 * belong to the commerce phase; they will read and extend this same context,
 * so nothing rendered today changes when they arrive.
 *
 * A line keeps a snapshot of the product (name, price, imagery) rather than
 * only its id — the price a customer agreed to must survive a later catalogue
 * change. A future iteration syncs the bag with the commerce API, exactly as
 * the wishlist syncs with the customer account.
 */
const CartContext = createContext({
  items: [],
  add: () => {},
  quantityOf: () => 0,
  count: 0,
});

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = useCallback((product, quantity = 1) => {
    setItems((previous) => {
      const existing = previous.find((item) => item.id === product.id);
      if (!existing) return [...previous, { id: product.id, product, quantity }];
      return previous.map((item) =>
        item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
      );
    });
  }, []);

  const quantityOf = useCallback(
    (id) => items.find((item) => item.id === id)?.quantity ?? 0,
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      add,
      quantityOf,
      count: items.reduce((total, item) => total + item.quantity, 0),
    }),
    [items, add, quantityOf]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

CartProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useCart() {
  return useContext(CartContext);
}

export default CartContext;
