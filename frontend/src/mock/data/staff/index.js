/**
 * STAFF ACCOUNTS & CAPABILITY PROFILES (Phase 9)
 * -----------------------------------------------------------------------------
 * The authentication side of the staff directory: the platform owner account
 * and the reusable capability profiles employees are hired into.
 *
 * Admin and Employee directory records themselves stay canonical in
 * `mock/data/governance/index.js` (platformAdmins / platformEmployees) —
 * Super Admin, Admin and the staff login all read the SAME records. Passwords
 * live on those records exactly where a future backend keeps credentials
 * (here in plain fixture form; later hashed server-side).
 *
 * The shared demo password mirrors what an invitation email would carry on
 * first sign-in — a future backend replaces it with a real invite flow.
 */

export const STAFF_TEMP_PASSWORD = "Swarnova@123";

/** The platform root account — the only SUPER_ADMIN. */
export const superAdminAccount = {
  id: "SA-001",
  name: "Rajiv Meher",
  email: "superadmin@swarnova.in",
  password: STAFF_TEMP_PASSWORD,
  role: "super_admin",
  title: "Founder & Platform Owner",
  status: "active",
};

/**
 * Reusable capability profiles — the small, one-glance set employee accounts
 * are created from. Keys are capability groups, values the granted level
 * (see `features/authentication/capabilities.js`). Individual adjustments
 * are possible per employee; profiles keep the common cases instant.
 */
export const capabilityProfiles = [
  {
    id: "PROF-BRANCH-SALES",
    name: "Branch Sales",
    description:
      "Counter-side sales — catalogue lookup, order and customer handling, stock visibility at the branch.",
    capabilities: {
      catalogue: "view",
      orders: "manage",
      inventory: "view",
      branches: "view",
    },
  },
  {
    id: "PROF-INVENTORY",
    name: "Inventory Staff",
    description:
      "Stock-room operations — inventory control with catalogue and branch visibility.",
    capabilities: {
      catalogue: "view",
      inventory: "manage",
      branches: "view",
    },
  },
  {
    id: "PROF-BRANCH-MANAGER",
    name: "Branch Manager",
    description:
      "Runs one boutique — catalogue, orders, inventory and branch operations, with reports.",
    capabilities: {
      catalogue: "manage",
      orders: "manage",
      inventory: "manage",
      branches: "manage",
      reports: "view",
    },
  },
];
