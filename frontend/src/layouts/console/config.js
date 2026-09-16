import { LayoutDashboard } from "lucide-react";
import { ROLES } from "../../features/authentication/roles.js";

/**
 * CONSOLE CONFIGURATION
 * -----------------------------------------------------------------------------
 * One entry per management experience. Each entry owns its own brand label,
 * home route and navigation groups — the three experiences stay separate
 * surfaces, but the sidebar, topbar and shell that render them exist once.
 *
 * Navigation shape:
 *
 *   navigation: [
 *     { label?: "Group heading", items: [{ label, to, end?, icon }] }
 *   ]
 *
 * Groups without a `label` render as a plain list, which is what a single-item
 * experience uses today. Modules are appended here as their phases land —
 * never registered before their route exists.
 */
export const CONSOLE_CONFIG = {
  [ROLES.ADMIN]: {
    label: "Admin",
    homePath: "/admin",
    navigation: [
      {
        items: [
          { label: "Overview", to: "/admin", end: true, icon: LayoutDashboard },
        ],
      },
    ],
  },
  [ROLES.SUPER_ADMIN]: {
    label: "Super Admin",
    homePath: "/super-admin",
    navigation: [
      {
        items: [
          {
            label: "Command Centre",
            to: "/super-admin",
            end: true,
            icon: LayoutDashboard,
          },
        ],
      },
    ],
  },
  [ROLES.EMPLOYEE]: {
    label: "Employee",
    homePath: "/employee",
    navigation: [
      {
        items: [
          { label: "Overview", to: "/employee", end: true, icon: LayoutDashboard },
        ],
      },
    ],
  },
};

export default CONSOLE_CONFIG;
