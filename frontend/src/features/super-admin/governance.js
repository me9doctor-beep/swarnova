/**
 * GOVERNANCE PRESENTATION CONTRACT (Phase 8)
 * -----------------------------------------------------------------------------
 * The single place where governance vocabulary is defined for the UI:
 * lifecycle statuses, account statuses, media states and the labels / badge
 * variants they render with. Raw values match the mock-backend contract in
 * `services/providers/mock/governanceStore.js` — the future API returns the
 * same strings.
 *
 * Business rules (what transitions are allowed, whether a product is ready)
 * are NOT here — they are computed by the provider and arrive on the records
 * (`product.actions`, `product.readiness`). This module only maps meaning to
 * presentation.
 */

/* ----------------------------------------------------------------------- */
/* Product lifecycle (§7 of the platform contract)                          */
/* ----------------------------------------------------------------------- */

export const PRODUCT_STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  PUBLISHED: "published",
  REJECTED: "rejected",
};

export const PRODUCT_STATUS_META = {
  draft: { label: "Draft", variant: "neutral", description: "Being composed by an admin. Not yet submitted for review." },
  submitted: { label: "In Review", variant: "info", description: "Waiting in the Super Admin review queue." },
  approved: { label: "Approved", variant: "brand", description: "Reviewed and approved. One step from the storefront." },
  published: { label: "Published", variant: "success", description: "Live on the customer storefront." },
  rejected: { label: "Rejected", variant: "error", description: "Returned for revision with a reason." },
};

export const PRODUCT_STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "published", label: "Published" },
  { value: "rejected", label: "Rejected" },
];

/**
 * Lifecycle action labels. The set of actions a product actually offers
 * comes from the provider (`product.actions`) — these keys just label it.
 */
export const PRODUCT_ACTIONS = {
  submit: {
    label: "Submit for Review",
    confirmTitle: "Submit this product for review?",
    confirmBody:
      "The product moves into the Super Admin review queue. You can still edit it until it is approved.",
    confirmLabel: "Submit for Review",
    variant: "primary",
  },
  approve: {
    label: "Approve",
    confirmTitle: "Approve this product?",
    confirmBody:
      "The product passed review and is ready to publish. Nothing appears on the storefront until Publish is chosen.",
    confirmLabel: "Approve Product",
    variant: "success",
  },
  reject: {
    label: "Reject",
    confirmTitle: "Reject this product?",
    confirmBody:
      "The product returns to the admin for revision. A clear reason is required — it is shown to them and recorded in the audit log.",
    confirmLabel: "Reject Product",
    variant: "danger",
    requiresReason: true,
    reasonLabel: "Rejection reason",
    reasonHint: "Example: Primary product image is missing.",
  },
  publish: {
    label: "Publish",
    confirmTitle: "Publish this product?",
    confirmBody:
      "The product becomes visible on the customer storefront immediately. Approval does not publish — this action does.",
    confirmLabel: "Publish to Storefront",
    variant: "primary",
  },
};

/* ----------------------------------------------------------------------- */
/* Availability (catalogue contract)                                        */
/* ----------------------------------------------------------------------- */

export const AVAILABILITY_META = {
  available: { label: "Available", variant: "success" },
  limited: { label: "Limited", variant: "warning" },
  unavailable: { label: "Unavailable", variant: "neutral" },
};

export const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Any availability" },
  { value: "available", label: "Available" },
  { value: "limited", label: "Limited" },
  { value: "unavailable", label: "Unavailable" },
];

export const PURITY_OPTIONS = ["18K", "22K", "24K"];

/* ----------------------------------------------------------------------- */
/* Media library                                                            */
/* ----------------------------------------------------------------------- */

export const MEDIA_STATUS_META = {
  "in-use": { label: "In Use", variant: "brand" },
  unused: { label: "Unused", variant: "neutral" },
};

export const MEDIA_USAGE_OPTIONS = [
  { value: "all", label: "Any usage" },
  { value: "in-use", label: "In use" },
  { value: "unused", label: "Unused" },
];

export const MEDIA_KIND_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "image", label: "Images" },
];

export const MEDIA_USAGE_KIND_LABELS = {
  product: "Product",
  category: "Category",
  homepage: "Homepage",
  campaign: "Campaign",
  branch: "Branch",
};

/* ----------------------------------------------------------------------- */
/* Accounts & organisation                                                  */
/* ----------------------------------------------------------------------- */

export const ACCOUNT_STATUS_META = {
  active: { label: "Active", variant: "success" },
  disabled: { label: "Disabled", variant: "neutral" },
};

/* ----------------------------------------------------------------------- */
/* Content & campaigns                                                      */
/* ----------------------------------------------------------------------- */

export const CAMPAIGN_STATUS_META = {
  active: { label: "Active", variant: "success" },
  paused: { label: "Paused", variant: "neutral" },
};

/* ----------------------------------------------------------------------- */
/* Audit trail                                                              */
/* ----------------------------------------------------------------------- */

/** Badge tone per audit `<domain>.<verb>` family. */
export function auditActionVariant(action) {
  const [domain, verb] = String(action).split(".");
  if (verb === "reject" || verb === "disable" || verb === "delete") return "error";
  if (verb === "publish" || verb === "enable" || verb === "approve") return "success";
  if (domain === "platform" || verb === "submit") return "info";
  return "neutral";
}

/** Human label for an audit action key. */
export function auditActionLabel(action) {
  const key = String(action);
  return key
    .replace(/[._]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
