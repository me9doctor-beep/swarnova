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
