/**
 * ADMIN OPERATIONS PRESENTATION CONTRACT (Phase 9)
 * -----------------------------------------------------------------------------
 * The single place where the Admin console's operational vocabulary is
 * defined: order states, stock states, movement types and the labels /
 * badge variants they render with. Raw values match the mock-backend
 * contract in `services/providers/mock/governanceStore.js` — the future API
 * returns the same strings.
 *
 * Business rules (which order moves are valid, whether stock is low) are
 * NOT here — the provider computes them (`order.actions`, `stock.state`).
 * This module only maps meaning to presentation.
 */

/* ----------------------------------------------------------------------- */
/* Order lifecycle                                                          */
/* ----------------------------------------------------------------------- */

export const ORDER_STATUS = {
  PLACED: "Placed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_META = {
  Placed: { label: "Placed", variant: "info", description: "Received and paid — waiting to be confirmed." },
  Processing: { label: "Processing", variant: "warning", description: "Confirmed — being prepared for handover." },
  Shipped: { label: "Shipped", variant: "brand", description: "On its way to the customer." },
  Delivered: { label: "Delivered", variant: "success", description: "Handed over to the customer." },
  Cancelled: { label: "Cancelled", variant: "error", description: "Cancelled before delivery." },
};

export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "Placed", label: "Placed" },
  { value: "Processing", label: "Processing" },
  { value: "Shipped", label: "Shipped" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

/**
 * Labels and confirmation copy for the order actions the provider offers.
 * Which actions an order actually offers comes from `order.actions` — the
 * UI never decides the lifecycle itself.
 */
export const ORDER_ACTIONS = {
  Processing: {
    label: "Start Processing",
    confirmTitle: "Start processing this order?",
    confirmBody:
      "The order moves into preparation at its branch. It stays open until it ships.",
    confirmLabel: "Start Processing",
    variant: "primary",
  },
  Shipped: {
    label: "Mark Shipped",
    confirmTitle: "Mark this order as shipped?",
    confirmBody:
      "The order leaves the branch for the customer. Delivery completes the flow.",
    confirmLabel: "Mark Shipped",
    variant: "primary",
  },
  Delivered: {
    label: "Mark Delivered",
    confirmTitle: "Mark this order as delivered?",
    confirmBody: "The order is handed over to the customer and closes.",
    confirmLabel: "Mark Delivered",
    variant: "success",
  },
  Cancelled: {
    label: "Cancel Order",
    confirmTitle: "Cancel this order?",
    confirmBody:
      "The order is cancelled and its payment marked for refund. An order cannot be cancelled once it has shipped.",
    confirmLabel: "Cancel Order",
    variant: "danger",
  },
};

/* ----------------------------------------------------------------------- */
/* Inventory                                                                */
/* ----------------------------------------------------------------------- */

export const STOCK_STATE_META = {
  ok: { label: "In Stock", variant: "success" },
  low: { label: "Low Stock", variant: "warning" },
  out: { label: "Out of Stock", variant: "error" },
};

export const STOCK_FILTER_OPTIONS = [
  { value: "all", label: "Any stock state" },
  { value: "low", label: "Needs restock" },
  { value: "out", label: "Out of stock" },
];

export const MOVEMENT_TYPE_META = {
  receipt: { label: "Receipt", variant: "success" },
  sale: { label: "Sale", variant: "info" },
  adjustment: { label: "Adjustment", variant: "warning" },
  transfer: { label: "Transfer", variant: "neutral" },
};

/* ----------------------------------------------------------------------- */
/* Employee accounts                                                        */
/* ----------------------------------------------------------------------- */

export const EMPLOYEE_STATUS_META = {
  active: { label: "Active", variant: "success" },
  disabled: { label: "Disabled", variant: "neutral" },
};
