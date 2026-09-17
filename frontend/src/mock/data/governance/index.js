/**
 * PLATFORM GOVERNANCE — MOCK DATA (Phase 8)
 * -----------------------------------------------------------------------------
 * The directory and control-plane fixtures the Super Admin command centre
 * governs. Four contracts live here:
 *
 *   platformAdmins      — the platform's administrator accounts with their
 *                         organisational scope ("head-office" or a branch id).
 *                         Identifiers and role strings match
 *                         `features/authentication/roles.js`.
 *
 *   platformEmployees   — platform-wide visibility over boutique staff. The
 *                         operational employee experience (rosters, sales)
 *                         belongs to the Admin/Employee domains; governance
 *                         only sees name, role, branch and status.
 *
 *   governanceAuditLog  — seed entries for the audit trail. The mock provider
 *                         appends one entry per governance action, in exactly
 *                         this shape — the future API contract for
 *                         `GET /audit-logs`.
 *
 *   platformSettings    — the small set of platform switches a Super Admin
 *                         may change: storefront availability, feature
 *                         availability (AI Studio / Virtual Try-On), default
 *                         currency and support contact. Infrastructure
 *                         configuration (secrets, keys, endpoints) never
 *                         appears here — by design.
 */

export const platformAdmins = [
  {
    id: "ADM-001",
    name: "Arpita Mohanty",
    email: "arpita.mohanty@swarnova.in",
    role: "admin",
    scope: "head-office",
    branchId: null,
    title: "Head Office Administrator",
    status: "active",
  },
  {
    id: "ADM-002",
    name: "Ishita Rath",
    email: "ishita.rath@swarnova.in",
    role: "admin",
    scope: "branch",
    branchId: "BR-001",
    title: "Branch Administrator — Bhubaneswar",
    status: "active",
  },
  {
    id: "ADM-003",
    name: "Prakash Sahu",
    email: "prakash.sahu@swarnova.in",
    role: "admin",
    scope: "branch",
    branchId: "BR-002",
    title: "Branch Administrator — Cuttack",
    status: "active",
  },
  {
    id: "ADM-004",
    name: "Lopamudra Behera",
    email: "lopamudra.behera@swarnova.in",
    role: "admin",
    scope: "branch",
    branchId: "BR-003",
    title: "Branch Administrator — Rourkela",
    status: "disabled",
  },
];

export const platformEmployees = [
  {
    id: "EMP-001",
    name: "Meera Das",
    role: "Boutique Manager",
    branchId: "BR-001",
    status: "active",
  },
  {
    id: "EMP-002",
    name: "Ananya Tripathy",
    role: "Senior Sales Consultant",
    branchId: "BR-001",
    status: "active",
  },
  {
    id: "EMP-003",
    name: "Sonalika Mishra",
    role: "Sales Consultant",
    branchId: "BR-001",
    status: "active",
  },
  {
    id: "EMP-004",
    name: "Rohit Panda",
    role: "Inventory Associate",
    branchId: "BR-001",
    status: "active",
  },
  {
    id: "EMP-005",
    name: "Subhasmita Ray",
    role: "Boutique Manager",
    branchId: "BR-002",
    status: "active",
  },
  {
    id: "EMP-006",
    name: "Deepankar Lenka",
    role: "Sales Consultant",
    branchId: "BR-002",
    status: "disabled",
  },
  {
    id: "EMP-007",
    name: "Priyanka Khandelwal",
    role: "Boutique Manager",
    branchId: "BR-003",
    status: "active",
  },
];

/**
 * Audit trail seeds — newest first. `action` follows the `<domain>.<verb>`
 * contract (`product.submit`, `media.upload`, `platform.gold_rate`, …) that
 * the audit screen filters on.
 */
export const governanceAuditLog = [
  {
    id: "AUD-20260917-0005",
    at: "2026-09-17T09:25:00+05:30",
    action: "product.reject",
    actor: "Super Admin",
    entityType: "product",
    entityId: "JWL-012",
    entityLabel: "Tara Everyday Chain",
    detail:
      "Rejected with reason: Description is incomplete — add the BIS hallmark and making-charges note, then re-submit.",
  },
  {
    id: "AUD-20260916-0004",
    at: "2026-09-16T16:20:00+05:30",
    action: "product.approve",
    actor: "Super Admin",
    entityType: "product",
    entityId: "JWL-011",
    entityLabel: "Surya Heritage Kada",
    detail: "Approved after review. The piece is ready to publish.",
  },
  {
    id: "AUD-20260916-0003",
    at: "2026-09-16T11:40:00+05:30",
    action: "product.submit",
    actor: "Ishita Rath — Admin, Bhubaneswar",
    entityType: "product",
    entityId: "JWL-010",
    entityLabel: "Mayura Polki Choker",
    detail: "Submitted for Super Admin review.",
  },
  {
    id: "AUD-20260915-0002",
    at: "2026-09-15T10:05:00+05:30",
    action: "media.upload",
    actor: "Super Admin",
    entityType: "media",
    entityId: "MED-012",
    entityLabel: "Makar Festive Editorial",
    detail: "Uploaded to the media library. Not yet placed in any content.",
  },
  {
    id: "AUD-20260914-0001",
    at: "2026-09-14T09:32:00+05:30",
    action: "platform.gold_rate",
    actor: "Super Admin",
    entityType: "platform",
    entityId: "GOLD-DESK-IN",
    entityLabel: "Gold Rate Board",
    detail: "Updated the indicative morning rates for 22K and 24K gold.",
  },
  {
    id: "AUD-20260912-0001",
    at: "2026-09-12T13:18:00+05:30",
    action: "campaign.publish",
    actor: "Super Admin",
    entityType: "campaign",
    entityId: "CMP-2026-PRECIOUS",
    entityLabel: "A Piece for Every Moment Worth Keeping",
    detail: "Campaign active window extended through 2027.",
  },
  {
    id: "AUD-20260206-0001",
    at: "2026-02-06T10:00:00+05:30",
    action: "product.publish",
    actor: "Super Admin",
    entityType: "product",
    entityId: "JWL-003",
    entityLabel: "Aabharan Drop Earrings",
    detail: "Published to the storefront catalogue.",
  },
];

export const platformSettings = {
  storefront: {
    status: "online",
    statusNote: "The customer storefront is trading normally.",
  },
  features: {
    aiStudio: { enabled: true, label: "AI Jewellery Studio" },
    virtualTryOn: { enabled: true, label: "Virtual Try-On" },
  },
  commerce: {
    defaultCurrency: "INR",
    supportEmail: "care@swarnova.in",
  },
};
