/**
 * ROLE MODEL
 * -----------------------------------------------------------------------------
 * The single source of truth for role identifiers. These strings map to the
 * backend's role claims and to the route groups in `app/router.jsx`.
 *
 * Never compare against raw strings ("admin", "super_admin", …) in components —
 * always reference ROLES here.
 */
export const ROLES = {
  CUSTOMER: "customer",
  EMPLOYEE: "employee",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
};

/** Human-readable labels for shells, tables and status language. */
export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: "Customer",
  [ROLES.EMPLOYEE]: "Employee",
  [ROLES.ADMIN]: "Admin",
  [ROLES.SUPER_ADMIN]: "Super Admin",
};

export const ROLE_LIST = [
  ROLES.CUSTOMER,
  ROLES.EMPLOYEE,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
];

/** Role labels keyed for quick lookup, tolerant of an unknown role value. */
export function roleLabel(role) {
  return ROLE_LABELS[role] ?? "Guest";
}

/**
 * STAFF LOGIN RESOLUTION (Phase 9)
 * -----------------------------------------------------------------------------
 * One shared staff login (`/staff/login`) authenticates every staff role; the
 * account's role then decides where the session lands. This map is that
 * resolution table — authentication never asks the user to pick a role.
 */
export const STAFF_HOME_PATHS = {
  [ROLES.SUPER_ADMIN]: "/super-admin",
  [ROLES.ADMIN]: "/admin",
  [ROLES.EMPLOYEE]: "/employee",
};

export const STAFF_LOGIN_PATH = "/staff/login";

/** Home route for a signed-in role; customers belong to the storefront. */
export function roleHomePath(role) {
  return STAFF_HOME_PATHS[role] ?? "/";
}

/**
 * Audit-trail actor label for a session — "Name — Role". Mutations pass this
 * to the provider so the canonical audit trail records who really acted.
 */
export function actorLabel(user, role) {
  if (!user?.name) return roleLabel(role);
  return `${user.name} — ${roleLabel(role)}`;
}
