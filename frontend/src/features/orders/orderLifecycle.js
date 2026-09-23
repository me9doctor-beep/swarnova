/**
 * CANONICAL ORDER LIFECYCLE (Phase 14.1)
 * -----------------------------------------------------------------------------
 * The single status vocabulary for the customer, Admin, Employee and Super
 * Admin. Raw values are the strings the mock store and a future API share.
 *
 * BRD/PRD v2.0 §15 names the canonical path:
 *
 *   PLACED → CONFIRMED → PROCESSING → READY/SHIPPED → OUT FOR DELIVERY →
 *   DELIVERED
 *
 *   plus CANCELLED, RETURNED, REFUNDED, FAILED, ON HOLD
 *
 * One operational path. READY/SHIPPED is one stage, stored as Shipped so the
 * existing book does not grow a second dispatch status. Out for Delivery is
 * the next stage. No carrier feed, pickup desk, return or refund workflow
 * is invented — those screens are not here, the statuses are.
 *
 *   Placed → Confirmed → Processing → Shipped → Out for Delivery → Delivered
 *   Cancelled from Placed, Confirmed or Processing (before dispatch)
 *
 * Ready shares the Ready/Shipped step when a record already carries it. It is
 * not a separate write. Returned, Refunded, Failed and On Hold stay recognized
 * so they are never drawn as Placed. Cancellation marks payment for return;
 * that is not an order status of Refunded.
 *
 * Stock: reservation is taken at placement and held through Confirmed and
 * Processing. Shipped retires it. Out for Delivery and Delivered do not move
 * stock again. Cancelled, before dispatch, returns it to free stock.
 */

export const ORDER_STATUS = {
  PLACED: "Placed",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY: "Ready",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  ON_HOLD: "On Hold",
};

/** The only moves the store accepts. Everything else is refused. */
export const ORDER_FLOW = {
  Placed: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Ready: ["Shipped", "Cancelled"],
  Shipped: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

/** Statuses the current book operates, in journey order. */
export const OPERATIONAL_STATUSES = [
  "Placed",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

/** Still open to the house — including a consignment already on the road. */
export const OPEN_ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Processing",
  "Ready",
  "Shipped",
  "Out for Delivery",
];

/** Still holding the placement reservation. Shipped has left the vitrine. */
export const RESERVING_ORDER_STATUSES = ["Placed", "Confirmed", "Processing"];

export const ORDER_STATUS_META = {
  Placed: {
    label: "Placed",
    variant: "info",
    description: "Received and paid — waiting for the house to confirm.",
    rank: 0,
    operational: true,
    recognized: true,
  },
  Confirmed: {
    label: "Confirmed",
    variant: "brand",
    description: "Accepted by the house — preparation has not started.",
    rank: 1,
    operational: true,
    recognized: true,
  },
  Processing: {
    label: "Processing",
    variant: "warning",
    description: "In preparation at the fulfilling boutique.",
    rank: 2,
    operational: true,
    recognized: true,
  },
  Ready: {
    label: "Ready / Shipped",
    variant: "brand",
    description: "Prepared for handover. The operational write for this stage is Shipped — pickup is not a separate path.",
    rank: 3,
    operational: false,
    recognized: true,
  },
  Shipped: {
    label: "Ready / Shipped",
    variant: "brand",
    description: "Ready for handover, or dispatched with the insured courier.",
    rank: 3,
    operational: true,
    recognized: true,
  },
  "Out for Delivery": {
    label: "Out for Delivery",
    variant: "info",
    description: "With the courier for handover. No live carrier feed is connected.",
    rank: 4,
    operational: true,
    recognized: true,
  },
  Delivered: {
    label: "Delivered",
    variant: "success",
    description: "Handed over to the customer.",
    rank: 5,
    operational: true,
    recognized: true,
  },
  Cancelled: {
    label: "Cancelled",
    variant: "error",
    description: "Cancelled before dispatch. Any payment taken is marked for return.",
    rank: null,
    operational: true,
    recognized: true,
  },
  Returned: {
    label: "Returned",
    variant: "neutral",
    description: "Returned to the house. A return workflow is not operated from this screen.",
    rank: null,
    operational: false,
    recognized: true,
  },
  Refunded: {
    label: "Refunded",
    variant: "neutral",
    description: "Payment returned. Settlement is a house action, not a status this screen can set.",
    rank: null,
    operational: false,
    recognized: true,
  },
  Failed: {
    label: "Failed",
    variant: "error",
    description: "The order could not be completed. No failure workflow is operated here.",
    rank: null,
    operational: false,
    recognized: true,
  },
  "On Hold": {
    label: "On Hold",
    variant: "warning",
    description: "Paused by the house. A hold workflow is not operated from this screen.",
    rank: null,
    operational: false,
    recognized: true,
  },
};

/** Filter options for the operational book. Recognized-only states stay out of the menu. */
export const ORDER_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  ...OPERATIONAL_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_META[status].label,
  })),
];

/**
 * The customer journey. Placed is the first milestone. Ready and Shipped are
 * one step. Exception states are not drawn as steps.
 */
export const CUSTOMER_JOURNEY = [
  { key: "Placed", label: "Order Placed" },
  { key: "Confirmed", label: "Order Confirmed" },
  { key: "Processing", label: "In Atelier Preparation" },
  { key: "Shipped", label: "Ready / Shipped" },
  { key: "Out for Delivery", label: "Out for Delivery" },
  { key: "Delivered", label: "Safely Delivered" },
];

export function orderActions(status) {
  return ORDER_FLOW[status] ?? [];
}

export function orderStatusMeta(status) {
  return (
    ORDER_STATUS_META[status] ?? {
      label: status || "Unknown",
      variant: "neutral",
      description: "This status is outside the current operational journey.",
      rank: null,
      operational: false,
      recognized: false,
    }
  );
}

/** Statuses a report should list: the operational book, then any other value present. */
export function statusesForReport(orders = []) {
  const extra = [];
  for (const order of orders) {
    if (!OPERATIONAL_STATUSES.includes(order.status) && !extra.includes(order.status)) {
      extra.push(order.status);
    }
  }
  return [...OPERATIONAL_STATUSES, ...extra];
}

/** Masthead for the confirmation screen. A Placed order is not called confirmed. */
export function customerReceiptTitle(status) {
  if (status === "Placed") return "Thank you — your order is placed";
  if (status === "Confirmed") return "Thank you — your order is confirmed";
  if (status === "Cancelled") return "This order was cancelled";
  return "Thank you — your order is with the house";
}

export function customerNextStep(status) {
  switch (status) {
    case "Placed":
      return "The house will confirm the order before preparation begins. You can follow every step from your account.";
    case "Confirmed":
      return "The house has confirmed your order. Atelier preparation begins shortly.";
    case "Processing":
      return "Your pieces are being prepared. Insured dispatch follows, and the journey stays visible in your account.";
    case "Shipped":
      return "Your order has left the boutique with the insured courier. Delivery is the remaining step.";
    case "Delivered":
      return "Your order has been delivered. The house remains available for care questions.";
    case "Cancelled":
      return "This order was cancelled before dispatch. Any payment taken is marked for return — settlement is completed by the house.";
    default:
      return orderStatusMeta(status).description;
  }
}
