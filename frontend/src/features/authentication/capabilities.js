/**
 * CAPABILITY MODEL (Phase 9)
 * -----------------------------------------------------------------------------
 * Staff authorization is expressed as grouped BUSINESS CAPABILITIES — the
 * language head office uses ("who can manage inventory?"), never low-level
 * implementation switches (product.create, product.publish, …). Those remain
 * internal: each capability level maps to one or two permission keys that the
 * session carries and that a future backend enforces.
 *
 * Groups and levels are deliberately small:
 *
 *   Catalogue           View | Manage
 *   Orders & Customers  View | Manage
 *   Inventory           View | Manage
 *   Content             View | Manage
 *   Branch Operations   View | Manage
 *   Reports             View
 *   Staff Management    Manage (employees only)
 *
 * `manage` always implies `view`. Capability values on a profile/employee are
 * keyed by group: { catalogue: "manage", inventory: "view", … } with "none"
 * (or a missing key) meaning no access.
 *
 * Permission keys follow the `<group>.<level>` contract the backend will
 * issue. Frontend checks stay a UX convenience — the backend is the only
 * authorization authority.
 */

export const CAPABILITY_LEVELS = {
  NONE: "none",
  VIEW: "view",
  MANAGE: "manage",
};

export const CAPABILITY_LEVEL_LABELS = {
  none: "None",
  view: "View",
  manage: "Manage",
};

/** Internal permission keys — the strings a session's claim list carries. */
export const CAPABILITIES = {
  CATALOGUE_VIEW: "catalogue.view",
  CATALOGUE_MANAGE: "catalogue.manage",
  ORDERS_VIEW: "orders.view",
  ORDERS_MANAGE: "orders.manage",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",
  CONTENT_VIEW: "content.view",
  CONTENT_MANAGE: "content.manage",
  BRANCHES_VIEW: "branches.view",
  BRANCHES_MANAGE: "branches.manage",
  REPORTS_VIEW: "reports.view",
  STAFF_MANAGE: "staff.manage",
};

/**
 * The seven business capability groups, in display order. `levels` lists the
 * meaningful levels for the group — Reports has no "manage", Staff
 * Management has no "view".
 */
export const CAPABILITY_GROUPS = [
  {
    key: "catalogue",
    label: "Catalogue",
    description: "Product catalogue — viewing pieces, pricing, availability and placement.",
    levels: ["view", "manage"],
  },
  {
    key: "orders",
    label: "Orders & Customers",
    description: "Order book and customer directory — viewing and operating orders.",
    levels: ["view", "manage"],
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Branch stock levels, low-stock state and stock adjustments.",
    levels: ["view", "manage"],
  },
  {
    key: "content",
    label: "Content",
    description: "Business content — homepage visibility, campaigns and collections.",
    levels: ["view", "manage"],
  },
  {
    key: "branches",
    label: "Branch Operations",
    description: "Branch network coordination and operational branch information.",
    levels: ["view", "manage"],
  },
  {
    key: "reports",
    label: "Reports",
    description: "Business reports — sales, orders and inventory summaries.",
    levels: ["view"],
  },
  {
    key: "staff",
    label: "Staff Management",
    description: "Creating and managing employee accounts and capability profiles.",
    levels: ["manage"],
  },
];

/** Every business capability at its top level — the Admin / head-office scope. */
export const FULL_BUSINESS_CAPABILITIES = {
  catalogue: "manage",
  orders: "manage",
  inventory: "manage",
  content: "manage",
  branches: "manage",
  reports: "view",
  staff: "manage",
};

/**
 * Capability values → permission keys. `manage` also grants the group's view
 * key where the group has one; groups are skipped when the level is missing
 * or "none", so the claim list stays exactly as wide as the grant.
 */
export function permissionsFromCapabilities(capabilities = {}) {
  const permissions = [];

  for (const group of CAPABILITY_GROUPS) {
    const level = capabilities[group.key] ?? CAPABILITY_LEVELS.NONE;
    if (level === CAPABILITY_LEVELS.MANAGE && group.levels.includes("manage")) {
      permissions.push(`${group.key}.manage`);
    }
    if (
      (level === CAPABILITY_LEVELS.MANAGE || level === CAPABILITY_LEVELS.VIEW) &&
      group.levels.includes("view")
    ) {
      permissions.push(`${group.key}.view`);
    }
  }

  return permissions;
}

/**
 * Hierarchy guard: can `actorPermissions` grant the requested capabilities?
 * A holder of "*" (Super Admin) can grant anything; anyone else may only
 * grant levels they possess themselves — an Admin can never hand out a
 * capability beyond their own scope, and an Employee can hand out none.
 */
export function capabilitiesWithinAuthority(actorPermissions, capabilities = {}) {
  const granted = Array.isArray(actorPermissions) ? actorPermissions : [];
  if (granted.includes("*")) return true;

  const requested = permissionsFromCapabilities(capabilities);
  return requested.every((key) => granted.includes(key));
}

/**
 * Human-readable rows for a capability set — the one-glance summary used on
 * staff forms, employee records and profiles. Groups at "none" are omitted.
 */
export function describeCapabilities(capabilities = {}) {
  return CAPABILITY_GROUPS.filter(
    (group) => (capabilities[group.key] ?? CAPABILITY_LEVELS.NONE) !== CAPABILITY_LEVELS.NONE
  ).map((group) => ({
    key: group.key,
    label: group.label,
    level: capabilities[group.key],
    levelLabel: CAPABILITY_LEVEL_LABELS[capabilities[group.key]] ?? "None",
  }));
}

/** The capability options one group offers on a form, including "None". */
export function capabilityLevelOptions(groupKey) {
  const group = CAPABILITY_GROUPS.find((item) => item.key === groupKey);
  const levels = group?.levels ?? [];
  return [CAPABILITY_LEVELS.NONE, ...levels];
}
