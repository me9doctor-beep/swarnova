import { intakePaths } from "../../utils/links.js";
import {
  BadgeIndianRupee,
  BarChart3,
  Boxes,
  ClipboardList,
  Images,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Megaphone,
  Package,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tags,
  User,
  UserCog,
  Users,
  WandSparkles,
} from "lucide-react";
import { ROLES } from "../../features/authentication/roles.js";
import { CAPABILITIES } from "../../features/authentication/capabilities.js";

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
 *     { label?: "Group heading", items: [{ label, to, end?, icon, capability? }] }
 *   ]
 *
 * Groups without a `label` render as a plain list, which is what a single-item
 * experience uses today. Modules are appended here as their phases land —
 * never registered before their route exists.
 *
 * `capability` (Phase 9) names the permission key an item requires; the
 * shared ConsoleExperience hides items the session cannot use, so a signed-in
 * account only ever sees its own navigation (Super Admin's "*" sees all).
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
      {
        label: "Business",
        items: [
          { label: "Products", to: "/admin/products", icon: Package, capability: CAPABILITIES.CATALOGUE_VIEW },
          ...Object.values(intakePaths).map((path) => ({ label: path.title, to: `/admin/${path.segment}`, icon: ClipboardList, capability: CAPABILITIES.ORDERS_VIEW })),
          { label: "Orders", to: "/admin/orders", icon: ClipboardList, capability: CAPABILITIES.ORDERS_VIEW },
          { label: "Customers", to: "/admin/customers", icon: ShoppingBag, capability: CAPABILITIES.ORDERS_VIEW },
          { label: "Inventory", to: "/admin/inventory", icon: Boxes, capability: CAPABILITIES.INVENTORY_VIEW },
        ],
      },
      {
        label: "Content",
        items: [
          { label: "Homepage", to: "/admin/homepage", icon: LayoutTemplate, capability: CAPABILITIES.CONTENT_VIEW },
          { label: "Campaigns", to: "/admin/campaigns", icon: Megaphone, capability: CAPABILITIES.CONTENT_VIEW },
          { label: "Collections", to: "/admin/collections", icon: Layers, capability: CAPABILITIES.CONTENT_VIEW },
        ],
      },
      {
        label: "Organisation",
        items: [
          { label: "Branches", to: "/admin/branches", icon: Store, capability: CAPABILITIES.BRANCHES_VIEW },
          { label: "Employees", to: "/admin/employees", icon: Users, capability: CAPABILITIES.STAFF_MANAGE },
        ],
      },
      {
        label: "Insights",
        items: [
          { label: "Reports", to: "/admin/reports", icon: BarChart3, capability: CAPABILITIES.REPORTS_VIEW },
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
        label: "Operations",
        items: [
          ...Object.values(intakePaths).map((path) => ({ label: path.title, to: `/super-admin/${path.segment}`, icon: ClipboardList, capability: CAPABILITIES.ORDERS_VIEW })),
          { label: "Orders", to: "/super-admin/orders", icon: ClipboardList },
          { label: "Customers", to: "/super-admin/customers", icon: ShoppingBag },
          { label: "Inventory", to: "/super-admin/inventory", icon: Boxes },
          { label: "Reports", to: "/super-admin/reports", icon: BarChart3 },
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
  /**
   * The Employee console is deliberately the smallest of the three: the work
   * a branch colleague does in a day, and their own record — nothing about
   * the organisation, the platform or other branches. Every item is
   * capability-tagged, so a profile only ever sees the surfaces it can
   * operate, and an account with no reports capability never sees Reports.
   */
  [ROLES.EMPLOYEE]: {
    label: "Employee",
    homePath: "/employee",
    navigation: [
      {
        label: "My Work",
        items: [
          { label: "Dashboard", to: "/employee", end: true, icon: LayoutDashboard },
          ...Object.values(intakePaths).map((path) => ({ label: path.title, to: `/employee/${path.segment}`, icon: ClipboardList, capability: CAPABILITIES.ORDERS_VIEW })),
          { label: "Orders", to: "/employee/orders", icon: ClipboardList, capability: CAPABILITIES.ORDERS_VIEW },
          { label: "Customers", to: "/employee/customers", icon: ShoppingBag, capability: CAPABILITIES.ORDERS_VIEW },
          { label: "Products", to: "/employee/products", icon: Package, capability: CAPABILITIES.CATALOGUE_VIEW },
          { label: "Inventory", to: "/employee/inventory", icon: Boxes, capability: CAPABILITIES.INVENTORY_VIEW },
          { label: "Branch Operations", to: "/employee/branch", icon: Store, capability: CAPABILITIES.BRANCHES_VIEW },
          { label: "Reports", to: "/employee/reports", icon: BarChart3, capability: CAPABILITIES.REPORTS_VIEW },
        ],
      },
      {
        label: "Account",
        items: [
          { label: "My Profile", to: "/employee/profile", icon: User },
        ],
      },
    ],
  },
};

export default CONSOLE_CONFIG;
