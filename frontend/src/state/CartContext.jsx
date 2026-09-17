import { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

/**
 * Client-side shopping bag — the commerce boundary for the catalogue.
 *
 * Line items snapshot the product (name, sku, price, imagery) so later catalogue
 * mutations do not affect what the customer agreed to.
 * Extended in Phase 7 to support quantity increment, decrement, line removal,
 * bag clear, subtotal calculation, and empty state support.
 */
const CartContext = createContext({
  items: [],
  add: () => {},
  updateQuantity: () => {},
  increment: () => {},
  decrement: () => {},
  remove: () => {},
  clear: () => {},
  quantityOf: () => 0,
  count: 0,
  subtotal: 0,
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

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }, []);

  const increment = useCallback((id) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }, []);

  const decrement = useCallback((id) => {
    setItems((prev) => {
      const match = prev.find((item) => item.id === id);
      if (!match) return prev;
      if (match.quantity <= 1) {
        return prev.filter((item) => item.id !== id);
      }
      return prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const quantityOf = useCallback(
    (id) => items.find((item) => item.id === id)?.quantity ?? 0,
    [items]
  );

  const count = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + (item.product?.price ?? 0) * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      add,
      updateQuantity,
      increment,
      decrement,
      remove,
      clear,
      quantityOf,
      count,
      subtotal,
    }),
    [items, add, updateQuantity, increment, decrement, remove, clear, quantityOf, count, subtotal]
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
