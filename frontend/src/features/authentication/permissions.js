/**
 * PERMISSION MODEL
 * -----------------------------------------------------------------------------
 * Permission keys follow the `<resource>.<action>` contract the backend will
 * issue. Since Phase 9 the staff keys are the BUSINESS CAPABILITY keys
 * defined in `capabilities.js` (catalogue.view, inventory.manage, …) — the
 * UI talks about capabilities, sessions carry these strings, and the backend
 * will enforce them. Super Admin holds `"*"` (everything).
 *
 * IMPORTANT: frontend permission checks are a UI/UX convenience only (hide
 * actions a user cannot perform). The backend remains the only authority that
 * enforces authorization.
 */
import { ROLES } from "./roles.js";
import {
  FULL_BUSINESS_CAPABILITIES,
  permissionsFromCapabilities,
} from "./capabilities.js";

/**
 * ROLE → PERMISSION CLAIMS
 * -----------------------------------------------------------------------------
 * The claim each role's session carries — the shape the backend issues after
 * sign-in. The Roles & Permissions governance screen reads this map so the
 * permission surface lives in exactly one place.
 *
 * Admin holds every business capability at its top level (head-office scope).
 * Employee claims are granted per person through a capability profile at
 * sign-in, so the role itself carries no fixed claim here.
 */
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ["*"],
  [ROLES.ADMIN]: permissionsFromCapabilities(FULL_BUSINESS_CAPABILITIES),
  [ROLES.EMPLOYEE]: [],
  [ROLES.CUSTOMER]: [],
};

/** Explains an empty claim list where one is not the whole story. */
export const ROLE_CLAIM_NOTES = {
  [ROLES.EMPLOYEE]:
    "Employee claims are granted per person through a capability profile when their account signs in — see Staff Management in the Admin console.",
};

/** Brief operational summary of a role, for governance surfaces. */
export const ROLE_DESCRIPTIONS = {
  [ROLES.SUPER_ADMIN]:
    "Organization-wide authority — platform governance, and the same order, customer, inventory and report book head office operates.",
  [ROLES.ADMIN]:
    "Head-office business operations — products, orders, customers, inventory, branches, business content, reports and employees for their scope.",
  [ROLES.EMPLOYEE]:
    "Counter-side operations — day-to-day branch work inside their boutique, shaped by their capability profile.",
  [ROLES.CUSTOMER]:
    "The storefront itself — browse, AI studio, virtual try-on, wishlist, cart and account.",
};

/**
 * Check a session's permission list against one required key, or all keys in an
 * array. `"*"` grants everything (Super Admin).
 *
 *   can(session.permissions, CAPABILITIES.INVENTORY_MANAGE)
 *   can(session.permissions, [CAPABILITIES.ORDERS_VIEW, CAPABILITIES.ORDERS_MANAGE])
 */
export function can(permissions, required) {
  if (!required) return true;

  const granted = Array.isArray(permissions) ? permissions : [];
  if (granted.includes("*")) return true;

  const requiredKeys = Array.isArray(required) ? required : [required];
  return requiredKeys.every((key) => granted.includes(key));
}
