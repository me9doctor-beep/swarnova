/**
 * BRANCH INVENTORY — MOCK DATA (Phase 9)
 * -----------------------------------------------------------------------------
 * Physical stock held per product per branch — the operational inventory the
 * Admin head office runs and branches count against. One row per
 * (published product × branch); `reserved` is spoken for (allocated to open
 * orders) but not yet handed over.
 *
 * `reorderLevel` drives the low-stock state: available at or below the
 * level needs attention; zero available is out of stock. The movement log
 * records every stock change — receipts, sales, adjustments — newest first,
 * exactly the shape a future `GET /inventory/:id/movements` returns.
 *
 * Product and branch ids are the canonical catalogue/network ids — there is
 * no separate inventory product list.
 *
 * THE INVARIANT (Phase 13): `reserved` on a row equals the quantity the OPEN
 * order book has allocated at that boutique — every piece of every order in
 * Placed or Processing, and nothing else. A shipped or delivered piece has
 * left the vitrine, so it is in neither column; a cancelled order returns its
 * pieces to `available`. `placeCheckoutOrder` and the order-lifecycle
 * transitions maintain it, and the seed obeys it, so a branch never counts a
 * phantom piece as stock or loses one it still holds.
 */

export const inventoryStock = [
  /* ---------------------------- JWL-001 ------------------------------- */
  { id: "STK-001-BR-001", productId: "JWL-001", branchId: "BR-001", available: 6, reserved: 0, reorderLevel: 3 },
  { id: "STK-001-BR-002", productId: "JWL-001", branchId: "BR-002", available: 0, reserved: 2, reorderLevel: 3 },
  { id: "STK-001-BR-003", productId: "JWL-001", branchId: "BR-003", available: 4, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-002 ------------------------------- */
  { id: "STK-002-BR-001", productId: "JWL-002", branchId: "BR-001", available: 8, reserved: 0, reorderLevel: 3 },
  { id: "STK-002-BR-002", productId: "JWL-002", branchId: "BR-002", available: 5, reserved: 0, reorderLevel: 2 },
  { id: "STK-002-BR-003", productId: "JWL-002", branchId: "BR-003", available: 1, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-003 ------------------------------- */
  { id: "STK-003-BR-001", productId: "JWL-003", branchId: "BR-001", available: 3, reserved: 1, reorderLevel: 2 },
  { id: "STK-003-BR-002", productId: "JWL-003", branchId: "BR-002", available: 0, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-004 ------------------------------- */
  { id: "STK-004-BR-001", productId: "JWL-004", branchId: "BR-001", available: 3, reserved: 1, reorderLevel: 2 },
  { id: "STK-004-BR-002", productId: "JWL-004", branchId: "BR-002", available: 2, reserved: 0, reorderLevel: 2 },
  { id: "STK-004-BR-003", productId: "JWL-004", branchId: "BR-003", available: 1, reserved: 1, reorderLevel: 2 },

  /* ---------------------------- JWL-005 ------------------------------- */
  { id: "STK-005-BR-001", productId: "JWL-005", branchId: "BR-001", available: 2, reserved: 0, reorderLevel: 2 },
  { id: "STK-005-BR-002", productId: "JWL-005", branchId: "BR-002", available: 1, reserved: 0, reorderLevel: 1 },
  { id: "STK-005-BR-003", productId: "JWL-005", branchId: "BR-003", available: 3, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-006 ------------------------------- */
  { id: "STK-006-BR-001", productId: "JWL-006", branchId: "BR-001", available: 6, reserved: 1, reorderLevel: 3 },
  { id: "STK-006-BR-002", productId: "JWL-006", branchId: "BR-002", available: 1, reserved: 0, reorderLevel: 2 },
  { id: "STK-006-BR-003", productId: "JWL-006", branchId: "BR-003", available: 3, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-007 ------------------------------- */
  { id: "STK-007-BR-001", productId: "JWL-007", branchId: "BR-001", available: 6, reserved: 0, reorderLevel: 3 },
  { id: "STK-007-BR-002", productId: "JWL-007", branchId: "BR-002", available: 1, reserved: 1, reorderLevel: 3 },
  { id: "STK-007-BR-003", productId: "JWL-007", branchId: "BR-003", available: 4, reserved: 0, reorderLevel: 2 },

  /* ---------------------------- JWL-008 ------------------------------- */
  { id: "STK-008-BR-001", productId: "JWL-008", branchId: "BR-001", available: 3, reserved: 0, reorderLevel: 2 },
  { id: "STK-008-BR-002", productId: "JWL-008", branchId: "BR-002", available: 0, reserved: 0, reorderLevel: 2 },
  { id: "STK-008-BR-003", productId: "JWL-008", branchId: "BR-003", available: 0, reserved: 0, reorderLevel: 1 },
];

/**
 * Stock movement history — newest first. `delta` is signed; `type` is one of
 * "receipt" | "sale" | "adjustment" | "transfer". `by` names the actor
 * exactly as the audit trail records them.
 */
export const inventoryMovements = [
  {
    id: "MV-2026-0107",
    stockId: "STK-006-BR-002",
    type: "sale",
    delta: -1,
    at: "2026-09-17T11:25:00+05:30",
    by: "Bikash Behera — Employee",
    note: "Sold against order SWN-9371-IN.",
  },
  {
    id: "MV-2026-0106",
    stockId: "STK-004-BR-003",
    type: "sale",
    delta: -1,
    at: "2026-09-17T10:20:00+05:30",
    by: "Sasmita Pradhan — Employee",
    note: "Allocated to order SWN-9388-IN.",
  },
  {
    id: "MV-2026-0105",
    stockId: "STK-001-BR-002",
    type: "adjustment",
    delta: 1,
    at: "2026-09-17T09:40:00+05:30",
    by: "Bikash Behera — Employee",
    note: "Counter count correction — pendant returned to the vitrine.",
  },
  {
    id: "MV-2026-0104",
    stockId: "STK-003-BR-002",
    type: "sale",
    delta: -1,
    at: "2026-09-16T17:40:00+05:30",
    by: "Sonalika Mishra — Employee",
    note: "Sold against order SWN-9318-IN.",
  },
  {
    id: "MV-2026-0103",
    stockId: "STK-008-BR-003",
    type: "sale",
    delta: -1,
    at: "2026-09-15T12:10:00+05:30",
    by: "Priyanka Khandelwal — Employee",
    note: "Sold against order SWN-9290-IN.",
  },
  {
    id: "MV-2026-0102",
    stockId: "STK-002-BR-001",
    type: "receipt",
    delta: 4,
    at: "2026-09-12T10:05:00+05:30",
    by: "Rohit Panda — Employee",
    note: "Atelier delivery — festive replenishment.",
  },
  {
    id: "MV-2026-0101",
    stockId: "STK-001-BR-002",
    type: "adjustment",
    delta: -1,
    at: "2026-09-10T18:25:00+05:30",
    by: "Prakash Sahu — Admin",
    note: "Vault count reconciliation — one piece short.",
  },
];
