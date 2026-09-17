import {
  BadgeIndianRupee,
  Images,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  UserCog,
  Users,
  WandSparkles,
} from "lucide-react";
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
        label: "Overview",
        items: [
          { label: "Command Centre", to: "/super-admin", end: true, icon: LayoutDashboard },
        ],
      },
      {
        label: "Organisation",
        items: [
          { label: "Branches", to: "/super-admin/branches", icon: Store },
          { label: "Admins", to: "/super-admin/admins", icon: UserCog },
          { label: "Employees", to: "/super-admin/employees", icon: Users },
        ],
      },
      {
        label: "Catalogue",
        items: [
          { label: "Products", to: "/super-admin/products", icon: Package },
          { label: "Media", to: "/super-admin/media", icon: Images },
          { label: "Categories", to: "/super-admin/categories", icon: Tags },
        ],
      },
      {
        label: "Content",
        items: [
          { label: "Homepage", to: "/super-admin/homepage", icon: LayoutTemplate },
          { label: "Campaigns", to: "/super-admin/campaigns", icon: Megaphone },
          { label: "Collections", to: "/super-admin/collections", icon: Layers },
        ],
      },
      {
        label: "Platform",
        items: [
          { label: "AI & Try-On", to: "/super-admin/ai-try-on", icon: WandSparkles },
          { label: "Gold Rate", to: "/super-admin/gold-rate", icon: BadgeIndianRupee },
        ],
      },
      {
        label: "Governance",
        items: [
          { label: "Roles & Permissions", to: "/super-admin/roles", icon: ShieldCheck },
          { label: "Audit Logs", to: "/super-admin/audit-logs", icon: ScrollText },
          { label: "Settings", to: "/super-admin/settings", icon: Settings },
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
