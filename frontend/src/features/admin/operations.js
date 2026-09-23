/**
 * ADMIN OPERATIONS PRESENTATION CONTRACT (Phase 9, vocabulary unified in 14.1)
 * -----------------------------------------------------------------------------
 * Stock states, movement types and the console's order-action copy. The
 * order status vocabulary itself lives in `features/orders/orderLifecycle.js`
 * — the one contract customer, Admin, Employee and Super Admin share. It is
 * re-exported here so existing console imports keep one path.
 *
 * Business rules (which order moves are valid, whether stock is low) are
 * NOT decided in the UI — the provider computes them (`order.actions`,
 * `stock.state`) from that same lifecycle.
 */

/* ----------------------------------------------------------------------- */
/* Order lifecycle — re-exported from the shared contract                   */
/* ----------------------------------------------------------------------- */

export {
  ORDER_STATUS,
  ORDER_STATUS_META,
  ORDER_STATUS_OPTIONS,
  ORDER_FLOW,
  OPEN_ORDER_STATUSES,
  OPERATIONAL_STATUSES,
  orderStatusMeta,
  orderActions,
} from "../orders/orderLifecycle.js";

/**
 * Labels and confirmation copy for the order actions the provider offers.
 * Which actions an order actually offers comes from `order.actions` — the
 * UI never decides the lifecycle itself.
 */
export const ORDER_ACTIONS = {
  Confirmed: {
    label: "Confirm Order",
    confirmTitle: "Confirm this order?",
    confirmBody:
      "The house accepts the order. Preparation has not started — the pieces stay reserved at the fulfilling boutique.",
    confirmLabel: "Confirm Order",
    variant: "primary",
  },
  Processing: {
    label: "Start Processing",
    confirmTitle: "Start processing this order?",
    confirmBody:
      "The confirmed order moves into preparation at its branch. It stays open until it ships.",
    confirmLabel: "Start Processing",
    variant: "primary",
  },
  Shipped: {
    label: "Mark Ready / Shipped",
    confirmTitle: "Mark this order ready / shipped?",
    confirmBody:
      "The allocated pieces leave the boutique and their reservation is retired. " +
      "The next stage is out for delivery. This does not open a carrier feed.",
    confirmLabel: "Mark Ready / Shipped",
    variant: "primary",
  },
  "Out for Delivery": {
    label: "Mark Out for Delivery",
    confirmTitle: "Mark this order out for delivery?",
    confirmBody:
      "The consignment is on the way to handover. Stock does not move again, and no live carrier event is connected.",
    confirmLabel: "Mark Out for Delivery",
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
      "The order is cancelled, its payment is marked for refund and any pieces " +
      "it reserved return to the branch's free stock. An order cannot be " +
      "cancelled once it has shipped.",
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
