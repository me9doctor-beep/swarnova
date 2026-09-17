/**
 * Order services — customer order history and details.
 */
export const orderService = {
  getOrders(provider) {
    return provider.getOrders();
  },
  getOrder(provider, id) {
    return provider.getOrder(id);
  },
};

export default orderService;
