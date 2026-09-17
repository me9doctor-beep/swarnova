/**
 * PERMISSION MODEL
 * -----------------------------------------------------------------------------
 * Permission keys follow the `<resource>.<action>` contract the backend will
 * issue. The catalogue below is intentionally small — keys are added as each
 * feature phase lands, never invented ahead of time.
 *
 * IMPORTANT: frontend permission checks are a UI/UX convenience only (hide
 * actions a user cannot perform). The backend remains the only authority that
 * enforces authorization.
 */
export const PERMISSIONS = {
  PRODUCT_VIEW: "product.view",
  PRODUCT_CREATE: "product.create",
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",
  ORDER_VIEW: "order.view",
  CUSTOMER_VIEW: "customer.view",
  CAMPAIGN_PUBLISH: "campaign.publish",
  BRANCH_MANAGE: "branch.manage",
  USER_MANAGE: "user.manage",
  ANALYTICS_VIEW: "analytics.view",
};

/**
 * ROLE → PERMISSION CLAIMS
 * -----------------------------------------------------------------------------
 * The claim each role's session carries — the shape the backend issues after
 * sign-in. Super Admin holds `"*"` (everything); the other roles hold the
 * keys their own consoles need. The Roles & Permissions governance screen
 * reads this map so the permission surface lives in exactly one place.
 */
import { ROLES } from "./roles.js";

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ["*"],
  [ROLES.ADMIN]: [
    PERMISSIONS.PRODUCT_VIEW,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.ORDER_VIEW,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CAMPAIGN_PUBLISH,
  ],
  [ROLES.EMPLOYEE]: [PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.ORDER_VIEW, PERMISSIONS.CUSTOMER_VIEW],
  [ROLES.CUSTOMER]: [],
};

/** Brief operational summary of a role, for governance surfaces. */
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]:
    "Full platform command — catalogue governance, media, content, gold rates, organisation, roles and audit.",
  [ROLES.ADMIN]:
    "Head-office / branch operations — catalogue composition, inventory, orders, customers and campaigns for their scope.",
  [ROLES.EMPLOYEE]:
    "Counter-side operations — fast customer, order and stock lookup inside their boutique.",
  [ROLES.CUSTOMER]:
    "The storefront itself — browse, AI studio, virtual try-on, wishlist, cart and account.",
};

/**
 * Check a session's permission list against one required key, or all keys in an
 * array. `"*"` grants everything (Super Admin).
 *
 *   can(session.permissions, PERMISSIONS.PRODUCT_CREATE)
 *   can(session.permissions, [PERMISSIONS.INVENTORY_VIEW, PERMISSIONS.INVENTORY_MANAGE])
 */
export function can(permissions, required) {
  if (!required) return true;

  const granted = Array.isArray(permissions) ? permissions : [];
  if (granted.includes("*")) return true;

  const requiredKeys = Array.isArray(required) ? required : [required];
  return requiredKeys.every((key) => granted.includes(key));
}
