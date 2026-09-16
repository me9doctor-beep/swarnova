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
