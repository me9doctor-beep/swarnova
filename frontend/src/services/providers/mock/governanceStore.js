/**
 * GOVERNANCE STORE — the mock "backend" for platform governance (Phase 8)
 * -----------------------------------------------------------------------------
 * One in-memory store holds the canonical, mutable copy of the domains the
 * Super Admin governs: products, categories, collections, campaigns,
 * homepage sections, gold rates, branches, media, admins, employees, audit
 * log and platform settings.
 *
 * Customer-facing reads flow through the SAME store, so a governance action
 * (publish a product, disable a category, update the gold rate) takes effect
 * platform-wide — there is never a separate "admin copy" of the catalogue.
 *
 * All transition, readiness and usage logic lives here because this is where
 * a real backend's API contract would enforce it: the presentation layer only
 * reads what the store decides. Methods throw `Error` with administrator-
 * readable messages, exactly as an API's 4xx responses would.
 *
 * This file is part of the mock provider implementation — together with
 * `mockProvider.js` it is the only place that reads `src/mock/`.
 *
 * Phase 9 extends the same store with ADMIN / HEAD OFFICE operations: the
 * shared staff login, the order book, the customer directory, branch
 * inventory, employee lifecycle and the business overview/reports — all
 * computed from the SAME canonical entities Super Admin governs and the
 * storefront reads. There is no second, admin-only database.
 *
 * Phase 11 extends the same store with CUSTOMER IDENTITY: the customer
 * directory becomes the identity registry (credentials live on the records
 * exactly where staff passwords already live — plain fixture form today,
 * hashed server-side tomorrow), and per-customer profiles, addresses and
 * password-reset tokens join the canonical state. Every customer-scoped
 * read and write resolves ownership from the authenticated customer id —
 * never from a URL, a query string or a client-supplied claim — so the
 * Admin book, the branch book and the storefront account all read one
 * customer truth. Serializers strip credentials before anything leaves.
 *
 * Phase 12 extends the same store with CHECKOUT: the commerce boundary
 * between the shopping bag and the order book. The checkout summary is a
 * validated quote (published pieces at canonical prices, a store-resolved
 * fulfilment branch, the ONE totals calculation), and placing an order
 * enforces the full boundary — session, bag, address OWNERSHIP, canonical
 * delivery/payment methods, inventory — before settling the mock payment
 * and writing ONE snapshot order into the canonical book, with the minimal
 * inventory allocation, a movement log entry and an audit record. An
 * idempotency ledger replays a retried key's original result.
 */
import * as db from "../../../mock/data/index.js";
import { calculateTotals } from "../../pricingService.js";
import { ROLES } from "../../../features/authentication/roles.js";
import {
  CAPABILITIES,
  FULL_BUSINESS_CAPABILITIES,
  describeCapabilities,
  permissionsFromCapabilities,
  capabilitiesWithinAuthority,
} from "../../../features/authentication/capabilities.js";

/* ----------------------------------------------------------------------- */
/* Helpers                                                                  */
/* ----------------------------------------------------------------------- */

/** Return a detached copy so callers can never mutate the store. */
export function emit(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

const hasText = (value) => typeof value === "string" && value.trim().length > 0;

function now() {
  return new Date().toISOString();
}

function fail(message) {
  throw new Error(message);
}

/**
 * A rejection that carries a stable machine-readable code alongside the
 * customer/staff-readable message — the mock's stand-in for an API error
 * envelope (`{ code, message }`). The UI translates `code` into the exact
 * customer-facing copy; the message is already safe to show as a fallback.
 */
function failWithCode(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function highestSequence(list, prefix, pattern = /(\d+)$/) {
  return list.reduce((max, item) => {
    const match = String(item.id ?? "").match(pattern);
    return match && String(item.id).startsWith(prefix)
      ? Math.max(max, Number(match[1]))
      : max;
  }, 0);
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ----------------------------------------------------------------------- */
/* Store construction                                                       */
/* ----------------------------------------------------------------------- */

export function createGovernanceStore() {
  const products = emit(db.products);
  const media = emit(db.mediaLibrary);

  return {
    products,
    categories: emit(db.categories),
    collections: emit(db.collections),
    campaigns: emit(db.campaigns),
    homepage: emit(db.homepage),
    goldRateBoard: emit(db.goldRateBoard),
    branches: emit(db.branches),
    media,
    admins: emit(db.platformAdmins),
    employees: emit(db.platformEmployees),
    capabilityProfiles: emit(db.capabilityProfiles),
    customers: seedCustomerRegistry(),
    orders: emit(db.customerOrders),
    inventory: emit(db.inventoryStock),
    inventoryMovements: emit(db.inventoryMovements),
    auditLog: emit(db.governanceAuditLog),
    settings: emit(db.platformSettings),
    /* Phase 11 — customer identity state, keyed by authenticated customer id. */
    customerProfiles: { [db.customerProfile.id]: emit(db.customerProfile) },
    customerAddresses: { [db.customerProfile.id]: emit(db.customerAddresses) },
    customerResetTokens: {},
    counters: {
      product: highestSequence(products, "JWL-"),
      media: highestSequence(media, "MED-"),
      employee: highestSequence(db.platformEmployees, "EMP-"),
      order: highestSequence(db.customerOrders, "ORD-2026-"),
      customer: highestSequence(db.customers, "CUST-"),
      address: highestSequence(db.customerAddresses, "ADDR-"),
      movement: highestSequence(db.inventoryMovements, "MV-2026-"),
      reset: 0,
      audit: 0,
    },
    /* Phase 12 — checkout idempotency ledger: idempotencyKey → the order and
       payment it already produced, so a retried submission replays its result
       instead of creating a second order. */
    checkoutKeys: {},
  };
}

/**
 * The customer identity registry — the directory with one fixture credential
 * per account, exactly where staff passwords already live (plain fixture
 * form today, hashed server-side tomorrow). Serializers strip the credential
 * before anything leaves the store.
 */
function seedCustomerRegistry() {
  return emit(db.customers).map((customer) => ({
    ...customer,
    status: customer.status ?? "active",
    password: db.CUSTOMER_DEMO_PASSWORD,
  }));
}

/** Strip the credential (and only the credential) before serializing. */
function withoutCredential(customer) {
  if (!customer) return customer;
  const { password: _password, ...publicFields } = customer;
  return publicFields;
}

/* ----------------------------------------------------------------------- */
/* Audit                                                                    */
/* ----------------------------------------------------------------------- */

/**
 * Append one entry to the audit trail and return it. Every governance
 * mutation calls this — the trail is the platform's memory of who did what.
 */
export function appendAudit(store, entry) {
  store.counters.audit += 1;
  const record = {
    id: `AUD-${Date.now()}-${String(store.counters.audit).padStart(4, "0")}`,
    at: now(),
    actor: entry.actor ?? "Super Admin",
    ...entry,
  };
  store.auditLog = [record, ...store.auditLog].slice(0, 200);
  return emit(record);
}

/* ----------------------------------------------------------------------- */
/* Products — readiness, lifecycle, serialisation                            */
/* ----------------------------------------------------------------------- */

/**
 * The publish-readiness contract. Seven checks, each answerable from the
 * product model itself — the reviewer never hunts for what is missing.
 */
export const READINESS_CHECKS = [
  {
    key: "name",
    label: "Product name",
    ok: (product) => hasText(product.name),
  },
  {
    key: "sku",
    label: "SKU",
    ok: (product) => hasText(product.sku),
  },
  {
    key: "category",
    label: "Category",
    ok: (product) => hasText(product.categoryId),
  },
  {
    key: "description",
    label: "Description",
    ok: (product) => hasText(product.description) && product.description.length >= 30,
  },
  {
    key: "price",
    label: "Price",
    ok: (product) => typeof product.price === "number" && product.price > 0,
  },
  {
    key: "jewellery",
    label: "Jewellery details (purity & weight)",
    ok: (product) => hasText(product.purity) && hasText(product.weight),
  },
  {
    key: "media",
    label: "Primary image",
    ok: (product) => Array.isArray(product.images) && hasText(product.images[0]?.src),
  },
];

export function productReadiness(product) {
  const checks = READINESS_CHECKS.map((check) => ({
    key: check.key,
    label: check.label,
    ok: Boolean(check.ok(product)),
  }));
  return { ready: checks.every((check) => check.ok), checks };
}

/**
 * The full product lifecycle — the ONLY states and the ONLY moves between
 * them. Anything outside this table is an invalid action and is refused.
 *
 *   draft ──submit──▶ submitted ──approve──▶ approved ──publish──▶ published
 *      ▲                   │                      │
 *      └───── revision ◀──┴──── reject (reason) ──┘
 *
 *   rejected ──submit──▶ submitted
 */
export const PRODUCT_TRANSITIONS = {
  submit: { from: ["draft", "rejected"], to: "submitted" },
  approve: { from: ["submitted"], to: "approved" },
  reject: { from: ["submitted", "approved"], to: "rejected" },
  publish: { from: ["approved"], to: "published" },
};

const STATUS_NAMES = {
  draft: "Draft",
  submitted: "Submitted",
  approved: "Approved",
  published: "Published",
  rejected: "Rejected",
};

function findProduct(store, id) {
  const product = store.products.find((item) => item.id === id);
  if (!product) fail(`Product ${id} could not be found.`);
  return product;
}

/**
 * Governance actions valid for a product's current status — computed here,
 * never in components, so the UI can only offer what the backend allows.
 */
export function productActions(product) {
  return Object.entries(PRODUCT_TRANSITIONS)
    .filter(([, rule]) => rule.from.includes(product.status))
    .map(([action]) => action);
}

/** The governance view of one catalogue record. */
export function toGovernanceProduct(store, product) {
  const category = store.categories.find((item) => item.id === product.categoryId);
  const collection = store.collections.find((item) => item.id === product.collectionId);

  return emit({
    ...product,
    categoryName: category?.name ?? null,
    collectionName: collection?.name ?? null,
    readiness: productReadiness(product),
    actions: productActions(product),
  });
}

export function listGovernanceProducts(store, query = {}) {
  let list = [...store.products];

  if (query.status) list = list.filter((p) => p.status === query.status);
  if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
  if (query.collectionId) list = list.filter((p) => p.collectionId === query.collectionId);
  if (query.availability) list = list.filter((p) => p.availability === query.availability);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.id.toLowerCase().includes(term)
    );
  }

  const statusOrder = { submitted: 0, draft: 1, rejected: 2, approved: 3, published: 4 };
  list.sort(
    (a, b) =>
      (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9) ||
      String(b.governance?.updatedAt ?? "").localeCompare(String(a.governance?.updatedAt ?? ""))
  );

  return list.map((product) => toGovernanceProduct(store, product));
}

export function getGovernanceProduct(store, id) {
  const product = store.products.find((item) => item.id === id);
  return product ? toGovernanceProduct(store, product) : null;
}

/** The editable product fields — anything else on the record is read-only. */
const EDITABLE_FIELDS = [
  "name",
  "sku",
  "description",
  "purity",
  "price",
  "currency",
  "weight",
  "categoryId",
  "collectionId",
  "availability",
  "featured",
  "bestseller",
  "tryOnAvailable",
  "images",
];

function applyProductPatch(store, product, patch = {}) {
  for (const field of EDITABLE_FIELDS) {
    if (patch[field] !== undefined) product[field] = patch[field];
  }
  product.governance = { ...product.governance, updatedAt: now() };
  return toGovernanceProduct(store, product);
}

/**
 * The catalogue boundary (Phase 10). Product governance — creating, editing,
 * submitting, approving, rejecting and publishing — is head-office and
 * platform work. A branch account operates the catalogue (lookup, availability
 * and branch stock), it never governs it, and the provider says so in plain
 * words even if a request arrives from outside the employee UI.
 *
 * Callers that predate Phase 10 pass a plain actor label string (or nothing);
 * only a session-shaped actor carrying the employee role is refused.
 */
function assertCatalogueGovernanceAllowed(actor, action) {
  if (actor && typeof actor === "object" && actor.role === ROLES.EMPLOYEE) {
    fail(
      `Branch accounts cannot ${action} — product governance belongs to head office and the platform owner.`
    );
  }
}

export function createGovernanceProduct(store, data = {}) {
  store.counters.product += 1;
  const id = `JWL-${String(store.counters.product).padStart(3, "0")}`;

  const product = applyProductPatch(store, {
    id,
    sku: "",
    name: "",
    description: "",
    purity: "22K",
    price: null,
    currency: "INR",
    weight: "",
    categoryId: "",
    collectionId: "",
    images: [],
    rating: null,
    tryOnAvailable: false,
    featured: false,
    bestseller: false,
    availability: "available",
    href: `/product/${id}`,
    status: "draft",
    governance: {
      createdBy: "Super Admin",
      updatedAt: null,
      submittedAt: null,
      approvedAt: null,
      publishedAt: null,
      rejection: null,
    },
  }, data);

  store.products.push(product);
  appendAudit(store, {
    action: "product.create",
    entityType: "product",
    entityId: id,
    entityLabel: product.name || "Untitled piece",
    detail: "Created a new product draft.",
  });
  return toGovernanceProduct(store, product);
}

export function updateGovernanceProduct(store, id, data = {}, actor) {
  assertCatalogueGovernanceAllowed(actor, "edit catalogue records");
  const product = findProduct(store, id);
  const updated = applyProductPatch(store, product, data);
  appendAudit(store, {
    actor,
    action: "product.update",
    entityType: "product",
    entityId: id,
    entityLabel: product.name || "Untitled piece",
    detail: "Updated product details.",
  });
  return updated;
}

/**
 * Execute one lifecycle action. The transition table above is enforced here:
 * a Draft cannot be published, a Submitted piece cannot skip review, and a
 * rejection without a reason is refused — exactly what the API will enforce.
 */
export function transitionGovernanceProduct(store, id, action, payload = {}, actor) {
  assertCatalogueGovernanceAllowed(actor, "move products through the governance lifecycle");
  const product = findProduct(store, id);
  const rule = PRODUCT_TRANSITIONS[action];

  if (!rule) fail(`“${action}” is not a product lifecycle action.`);
  if (!rule.from.includes(product.status)) {
    const current = STATUS_NAMES[product.status] ?? product.status;
    const participle = {
      submit: "submitted",
      approve: "approved",
      reject: "rejected",
      publish: "published",
    }[action];
    fail(
      `A ${current} product cannot be ${participle} now. ` +
        "Only the actions offered for its current status are valid."
    );
  }

  const readiness = productReadiness(product);
  if (action === "approve" && !readiness.ready) {
    const missing = readiness.checks.filter((check) => !check.ok).map((check) => check.label);
    fail(`This product is not ready to approve. Missing: ${missing.join(", ")}.`);
  }
  if (action === "publish" && !readiness.ready) {
    fail("This product is not ready to publish. Resolve the readiness checks first.");
  }
  if (action === "reject" && !hasText(payload.reason)) {
    fail("A rejection reason is required — tell the admin what to fix.");
  }

  const at = now();
  product.status = rule.to;
  product.governance = { ...product.governance, updatedAt: at };

  if (action === "submit") {
    product.governance.submittedAt = at;
    product.governance.rejection = null;
  }
  if (action === "approve") product.governance.approvedAt = at;
  if (action === "reject") {
    product.governance.rejection = { reason: payload.reason.trim(), by: "Super Admin", at };
  }
  if (action === "publish") product.governance.publishedAt = at;

  /* Details are lazy: the reject string touches payload.reason and must only
     be evaluated for an actual rejection. */
  const details = {
    submit: () => "Submitted for Super Admin review.",
    approve: () => "Approved after review. The piece is ready to publish.",
    reject: () => `Rejected with reason: ${payload.reason.trim()}`,
    publish: () => "Published to the storefront catalogue.",
  };
  appendAudit(store, {
    actor,
    action: `product.${action}`,
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name || "Untitled piece",
    detail: details[action](),
  });

  return toGovernanceProduct(store, product);
}

/* ----------------------------------------------------------------------- */
/* Media — usage derivation, upload, attach, delete                          */
/* ----------------------------------------------------------------------- */

/** 5 MB — the library's upload ceiling in this phase. */
export const MEDIA_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const SECTION_LABELS = {
  hero: "Hero Banner",
  trust_strip: "Trust Strip",
  collections: "Collections Showcase",
  brand_promise: "Brand Promise",
  ai_studio: "AI Studio Feature",
  featured_products: "Featured Products",
  virtual_tryon: "Virtual Try-On Feature",
  editorial: "Editorial Feature",
  why_choose_us: "Why Choose Us",
  gold_rate: "Gold Rate Board",
  campaign: "Campaign Placement",
  stores: "Stores Showcase",
  journal: "Journal",
  newsletter: "Newsletter",
};

/**
 * Where an asset is used — derived from the canonical domains, never stored
 * on the media record, so usage can never drift out of date.
 */
export function deriveMediaUsage(store, item) {
  const usage = [];

  for (const product of store.products) {
    for (const image of product.images ?? []) {
      if (image.src === item.src) {
        usage.push({ kind: "product", id: product.id, label: product.name });
      }
    }
  }
  for (const category of store.categories) {
    if (category.image?.src === item.src) {
      usage.push({ kind: "category", id: category.id, label: category.name });
    }
  }
  for (const section of store.homepage.sections ?? []) {
    if (section.content?.image?.src === item.src) {
      usage.push({
        kind: "homepage",
        id: `HOME-${section.id}`,
        label: SECTION_LABELS[section.type] ?? section.id,
      });
    }
  }
  for (const campaign of store.campaigns) {
    if (campaign.image?.src === item.src) {
      usage.push({ kind: "campaign", id: campaign.id, label: campaign.title });
    }
  }
  for (const branch of store.branches) {
    if (branch.image?.src === item.src) {
      usage.push({ kind: "branch", id: branch.id, label: branch.name });
    }
  }

  return usage;
}

export function toGovernanceMedia(store, item) {
  const usage = deriveMediaUsage(store, item);
  return emit({
    ...item,
    usage,
    usageCount: usage.length,
    status: usage.length > 0 ? "in-use" : "unused",
  });
}

export function listGovernanceMedia(store, query = {}) {
  let list = store.media.map((item) => toGovernanceMedia(store, item));

  if (query.kind) list = list.filter((item) => item.kind === query.kind);
  if (query.usage === "in-use") list = list.filter((item) => item.usageCount > 0);
  if (query.usage === "unused") list = list.filter((item) => item.usageCount === 0);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        item.fileName.toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => String(b.uploadedAt ?? "").localeCompare(String(a.uploadedAt ?? "")));
  return list;
}

export function getGovernanceMedia(store, id) {
  const item = store.media.find((entry) => entry.id === id);
  return item ? toGovernanceMedia(store, item) : null;
}

/**
 * Validate and register an uploaded asset. The page supplies the file's
 * metadata and a data URL; everything the library needs to accept it is
 * decided here — the shape of a future `POST /media` contract.
 */
export function uploadGovernanceMedia(store, file = {}) {
  const problems = [];
  if (!hasText(file.name)) problems.push("choose a file to upload");
  if (file.type && !MEDIA_UPLOAD_TYPES.includes(file.type)) {
    problems.push("use a JPG, PNG, WebP or AVIF image");
  }
  if (typeof file.size === "number" && file.size > MEDIA_UPLOAD_MAX_BYTES) {
    problems.push("keep the image at 5 MB or smaller");
  }
  if (!hasText(file.dataUrl) && problems.length === 0) {
    problems.push("the file could not be read — try again");
  }
  if (problems.length > 0) fail(`This file cannot be uploaded — ${problems.join("; ")}.`);

  store.counters.media += 1;
  const id = `MED-${String(store.counters.media).padStart(3, "0")}`;
  const title = String(file.name).replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").trim();

  const item = {
    id,
    name: title.charAt(0).toUpperCase() + title.slice(1),
    fileName: String(file.name),
    kind: "image",
    format: (String(file.type).split("/")[1] ?? "jpg").replace("jpeg", "jpg"),
    dimensions: {
      width: Number(file.width) || 0,
      height: Number(file.height) || 0,
    },
    size: Number(file.size) || 0,
    src: file.dataUrl,
    alt: `Uploaded media — ${title}`,
    origin: "upload",
    uploadedAt: now(),
    uploadedBy: "Super Admin",
  };

  store.media = [item, ...store.media];
  appendAudit(store, {
    action: "media.upload",
    entityType: "media",
    entityId: id,
    entityLabel: item.name,
    detail: "Uploaded to the media library.",
  });
  return toGovernanceMedia(store, item);
}

/**
 * Attach a library asset to a product — as its primary image or appended to
 * the gallery. One asset, reused; never copied into the product.
 */
export function attachGovernanceMedia(store, mediaId, productId, slot = "primary") {
  const item = store.media.find((entry) => entry.id === mediaId);
  if (!item) fail(`Media ${mediaId} could not be found.`);
  const product = findProduct(store, productId);

  const reference = { src: item.src, alt: item.alt };
  if (slot === "primary") {
    product.images = [reference, ...(product.images ?? []).slice(1)];
  } else {
    product.images = [...(product.images ?? []), reference];
  }
  product.governance = { ...product.governance, updatedAt: now() };

  appendAudit(store, {
    action: "media.attach",
    entityType: "media",
    entityId: mediaId,
    entityLabel: item.name,
    detail:
      slot === "primary"
        ? `Set as the primary image for ${product.name} (${product.id}).`
        : `Added to the gallery of ${product.name} (${product.id}).`,
  });
  return {
    media: toGovernanceMedia(store, item),
    product: toGovernanceProduct(store, product),
  };
}

/** Deletion is refused while any product or content block references the asset. */
export function deleteGovernanceMedia(store, id) {
  const item = store.media.find((entry) => entry.id === id);
  if (!item) fail(`Media ${id} could not be found.`);

  const usage = deriveMediaUsage(store, item);
  if (usage.length > 0) {
    fail(
      `“${item.name}” is currently in use by ${usage.length} ` +
        `${usage.length === 1 ? "place" : "places"} (${usage[0].label}` +
        `${usage.length > 1 ? ", …" : ""}). Remove it there first, or keep it for reuse.`
    );
  }

  store.media = store.media.filter((entry) => entry.id !== id);
  appendAudit(store, {
    action: "media.delete",
    entityType: "media",
    entityId: id,
    entityLabel: item.name,
    detail: "Removed from the media library. It was not in use anywhere.",
  });
  return emit({ id, deleted: true });
}

/* ----------------------------------------------------------------------- */
/* Catalogue — categories & collections                                      */
/* ----------------------------------------------------------------------- */

export function createGovernanceCategory(store, data = {}) {
  if (!hasText(data.name)) fail("A category name is required.");
  const slug = slugify(data.name);
  const id = `CAT-${slug.toUpperCase().replace(/-/g, "_")}`;
  if (store.categories.some((item) => item.id === id || item.slug === slug)) {
    fail(`A category called “${data.name}” already exists.`);
  }

  const image = data.imageSrc
    ? { src: data.imageSrc, alt: `${data.name} category image` }
    : null;

  const category = {
    id,
    slug,
    name: data.name.trim(),
    tagline: data.tagline?.trim() ?? "",
    description: data.description?.trim() ?? "",
    image,
    cta: { label: `Explore ${data.name.trim()}`, href: `/category/${slug}` },
    enabled: data.enabled ?? true,
    order: Math.max(0, ...store.categories.map((item) => item.order ?? 0)) + 1,
  };

  store.categories = [...store.categories, category];
  appendAudit(store, {
    action: "category.create",
    entityType: "category",
    entityId: id,
    entityLabel: category.name,
    detail: "Added a new product category.",
  });
  return emit(category);
}

export function updateGovernanceCategory(store, id, patch = {}) {
  const category = store.categories.find((item) => item.id === id);
  if (!category) fail(`Category ${id} could not be found.`);

  for (const field of ["name", "tagline", "description", "enabled"]) {
    if (patch[field] !== undefined) category[field] = patch[field];
  }
  if (patch.imageSrc) category.image = { src: patch.imageSrc, alt: `${category.name} category image` };

  const toggled = patch.enabled !== undefined;
  appendAudit(store, {
    action: toggled ? (category.enabled ? "category.enable" : "category.disable") : "category.update",
    entityType: "category",
    entityId: id,
    entityLabel: category.name,
    detail: toggled
      ? category.enabled
        ? "Category enabled — it appears on the storefront."
        : "Category disabled — it is hidden from the storefront."
      : "Category details updated.",
  });
  return emit(category);
}

export function createGovernanceCollection(store, data = {}) {
  if (!hasText(data.name)) fail("A collection name is required.");
  const slug = slugify(data.name);
  const id = `COL-${slug.toUpperCase().replace(/-/g, "_")}`;
  if (store.collections.some((item) => item.id === id || item.slug === slug)) {
    fail(`A collection called “${data.name}” already exists.`);
  }

  const collection = {
    id,
    slug,
    name: data.name.trim(),
    description: data.description?.trim() ?? "",
  };
  store.collections = [...store.collections, collection];
  appendAudit(store, {
    action: "collection.create",
    entityType: "collection",
    entityId: id,
    entityLabel: collection.name,
    detail: "Added a new curated collection.",
  });
  return emit(collection);
}

export function updateGovernanceCollection(store, id, patch = {}) {
  const collection = store.collections.find((item) => item.id === id);
  if (!collection) fail(`Collection ${id} could not be found.`);
  for (const field of ["name", "description"]) {
    if (patch[field] !== undefined) collection[field] = patch[field];
  }
  appendAudit(store, {
    action: "collection.update",
    entityType: "collection",
    entityId: id,
    entityLabel: collection.name,
    detail: "Collection details updated.",
  });
  return emit(collection);
}

/* ----------------------------------------------------------------------- */
/* Content — homepage sections & campaigns                                   */
/* ----------------------------------------------------------------------- */

/** Governance view of the homepage: every section, sorted, with its controls. */
export function getGovernanceHomepage(store) {
  const sections = [...store.homepage.sections].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  return emit({
    id: store.homepage.id,
    locale: store.homepage.locale,
    sections: sections.map((section, index) => ({
      ...section,
      position: index + 1,
      totalSections: sections.length,
      typeLabel: SECTION_LABELS[section.type] ?? section.type,
    })),
  });
}

export function updateHomepageSection(store, id, patch = {}, actor) {
  const section = store.homepage.sections.find((item) => item.id === id);
  if (!section) fail(`Homepage section ${id} could not be found.`);

  if (patch.enabled !== undefined) section.enabled = Boolean(patch.enabled);

  appendAudit(store, {
    actor,
    action: section.enabled ? "content.section_enable" : "content.section_disable",
    entityType: "content",
    entityId: `HOME-${section.id}`,
    entityLabel: SECTION_LABELS[section.type] ?? section.id,
    detail: section.enabled
      ? "Section is now visible on the storefront homepage."
      : "Section is now hidden from the storefront homepage.",
  });
  return getGovernanceHomepage(store);
}

export function moveHomepageSection(store, id, direction) {
  const sections = [...store.homepage.sections].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const index = sections.findIndex((item) => item.id === id);
  if (index === -1) fail(`Homepage section ${id} could not be found.`);

  const target = index + (direction === "up" ? -1 : 1);
  if (target < 0 || target >= sections.length) {
    fail(`“${SECTION_LABELS[sections[index].type] ?? id}” is already at the ${direction === "up" ? "top" : "bottom"}.`);
  }

  const currentOrder = sections[index].order;
  sections[index].order = sections[target].order;
  sections[target].order = currentOrder;
  store.homepage.sections = sections;

  appendAudit(store, {
    action: "content.section_move",
    entityType: "content",
    entityId: `HOME-${sections[index].id}`,
    entityLabel: SECTION_LABELS[sections[index].type] ?? sections[index].id,
    detail: `Moved ${direction} on the storefront homepage.`,
  });
  return getGovernanceHomepage(store);
}

export function listGovernanceCampaigns(store) {
  const active = db.getActiveCampaign(store.campaigns);
  return emit(
    store.campaigns.map((campaign) => ({
      ...campaign,
      isLive: active?.id === campaign.id,
    }))
  );
}

export function updateCampaignStatus(store, id, status, actor) {
  if (!["active", "paused"].includes(status)) fail(`“${status}” is not a campaign status.`);
  const campaign = store.campaigns.find((item) => item.id === id);
  if (!campaign) fail(`Campaign ${id} could not be found.`);

  campaign.status = status;
  appendAudit(store, {
    actor,
    action: status === "active" ? "campaign.publish" : "campaign.pause",
    entityType: "campaign",
    entityId: id,
    entityLabel: campaign.title,
    detail:
      status === "active"
        ? "Campaign set live on the storefront homepage."
        : "Campaign paused — removed from the storefront homepage.",
  });
  return emit(campaign);
}

/* ----------------------------------------------------------------------- */
/* Organisation — branches, admins, employees                                */
/* ----------------------------------------------------------------------- */

export function toGovernanceBranch(store, branch) {
  const admin = store.admins.find((item) => item.branchId === branch.id && item.status === "active");
  const employeeCount = store.employees.filter((item) => item.branchId === branch.id).length;
  return emit({ ...branch, adminName: admin?.name ?? null, employeeCount });
}

export function listGovernanceBranches(store) {
  return store.branches.map((branch) => toGovernanceBranch(store, branch));
}

export function setBranchStatus(store, id, status) {
  if (!["active", "disabled"].includes(status)) fail(`“${status}” is not a branch status.`);
  const branch = store.branches.find((item) => item.id === id);
  if (!branch) fail(`Branch ${id} could not be found.`);

  branch.status = status;
  appendAudit(store, {
    action: status === "active" ? "branch.enable" : "branch.disable",
    entityType: "branch",
    entityId: id,
    entityLabel: branch.name,
    detail:
      status === "active"
        ? "Branch re-enabled — it appears on the storefront."
        : "Branch disabled — it is hidden from the storefront until re-enabled.",
  });
  return toGovernanceBranch(store, branch);
}

export function listGovernanceAdmins(store) {
  return emit(
    store.admins.map((admin) => {
      const branch = store.branches.find((item) => item.id === admin.branchId);
      return { ...admin, branchName: branch?.name ?? null };
    })
  );
}

export function createGovernanceAdmin(store, data = {}, actor = {}) {
  /* Administrator accounts are a platform-governance concern: only the
     Super Admin creates them. Legacy calls (no actor) come from the Super
     Admin console itself. */
  const actorRole = actor && typeof actor === "object" ? actor.role : undefined;
  if (actorRole !== undefined && actorRole !== ROLES.SUPER_ADMIN) {
    fail("Only the Super Admin can create administrator accounts.");
  }

  if (!hasText(data.name)) fail("An administrator name is required.");
  if (!hasText(data.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    fail("A valid email address is required.");
  }
  if (data.scope === "branch" && !hasText(data.branchId)) {
    fail("Choose the branch this administrator manages.");
  }

  const id = `ADM-${String(store.admins.length + 1).padStart(3, "0")}-${Date.now().toString(36).toUpperCase()}`;
  const branch = store.branches.find((item) => item.id === data.branchId);
  const admin = {
    id,
    name: data.name.trim(),
    email: data.email.trim(),
    role: "admin",
    scope: data.scope === "branch" ? "branch" : "head-office",
    branchId: data.scope === "branch" ? data.branchId : null,
    title:
      data.scope === "branch" && branch
        ? `Branch Administrator — ${branch.city}`
        : "Head Office Administrator",
    status: "active",
  };

  store.admins = [...store.admins, admin];
  appendAudit(store, {
    action: "admin.create",
    entityType: "admin",
    entityId: id,
    entityLabel: admin.name,
    detail: `Administrator account created (${admin.title}).`,
  });
  return emit(admin);
}

export function updateGovernanceAdmin(store, id, patch = {}) {
  const admin = store.admins.find((item) => item.id === id);
  if (!admin) fail(`Administrator ${id} could not be found.`);

  const details = [];
  if (patch.scope !== undefined && patch.scope !== admin.scope) {
    admin.scope = patch.scope === "branch" ? "branch" : "head-office";
    admin.branchId = admin.scope === "branch" ? patch.branchId ?? admin.branchId : null;
    const branch = store.branches.find((item) => item.id === admin.branchId);
    admin.title =
      admin.scope === "branch" && branch
        ? `Branch Administrator — ${branch.city}`
        : "Head Office Administrator";
    details.push(`Scope reassigned to ${admin.title}.`);
  }
  if (patch.status !== undefined && patch.status !== admin.status) {
    admin.status = patch.status === "disabled" ? "disabled" : "active";
    details.push(
      admin.status === "disabled"
        ? "Administrator disabled — they can no longer sign in to their console."
        : "Administrator re-enabled."
    );
  }
  if (details.length === 0) details.push("Administrator details updated.");

  appendAudit(store, {
    action: "admin.update",
    entityType: "admin",
    entityId: id,
    entityLabel: admin.name,
    detail: details.join(" "),
  });
  return emit(admin);
}

export function listGovernanceEmployees(store) {
  return emit(
    store.employees.map((employee) => {
      const branch = store.branches.find((item) => item.id === employee.branchId);
      const profile = store.capabilityProfiles.find(
        (item) => item.id === employee.profileId
      );
      return {
        ...employee,
        branchName: branch?.name ?? null,
        profileName: profile?.name ?? null,
      };
    })
  );
}

/**
 * Employee mutation — the single employee write path, shared by the Super
 * Admin oversight screen (status only) and the Admin staff console (full
 * operational detail: contact, branch, capability profile, account status).
 *
 * RBAC is enforced here exactly as the backend will:
 *   only Admin / Super Admin may change an employee, and nobody but a
 *   Super Admin may grant capabilities they do not hold themselves.
 */
export function updateGovernanceEmployee(store, id, patch = {}, actor = {}) {
  const employee = store.employees.find((item) => item.id === id);
  if (!employee) fail(`Employee ${id} could not be found.`);

  /* `actor` is a record { role, permissions, label }; a bare string (older
     callers) is treated as a label-only Admin actor. */
  const actorRecord =
    actor && typeof actor === "object"
      ? { role: actor.role ?? ROLES.ADMIN, permissions: actor.permissions ?? [], label: actor.label }
      : { role: ROLES.ADMIN, permissions: [], label: actor || undefined };

  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(actorRecord.role)) {
    fail("Only Admins and Super Admins can manage employee accounts.");
  }

  const details = [];

  if (patch.name !== undefined && patch.name.trim() && patch.name.trim() !== employee.name) {
    employee.name = patch.name.trim();
    details.push("Name updated.");
  }
  if (patch.email !== undefined) {
    const email = String(patch.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("A valid email address is required.");
    if (email !== employee.email) {
      if (emailTaken(store, email, id)) fail(`The email ${email} already belongs to another staff account.`);
      employee.email = email;
      details.push("Email updated.");
    }
  }
  if (patch.phone !== undefined && String(patch.phone).trim() !== employee.phone) {
    employee.phone = String(patch.phone).trim();
    details.push("Phone updated.");
  }
  if (patch.role !== undefined && String(patch.role).trim() && String(patch.role).trim() !== employee.role) {
    employee.role = String(patch.role).trim();
    details.push("Role title updated.");
  }
  if (patch.branchId !== undefined) {
    const branch = store.branches.find((item) => item.id === patch.branchId);
    if (!branch) fail("Choose the branch this employee belongs to.");
    if (branch.id !== employee.branchId) {
      employee.branchId = branch.id;
      details.push(`Branch reassigned to ${branch.name}.`);
    }
  }

  /* Capability change — profile and/or individual adjustments together.
     Only counted when the grant actually differs from what is held. */
  if (patch.profileId !== undefined || patch.capabilities !== undefined) {
    let profile = store.capabilityProfiles.find((item) => item.id === employee.profileId) ?? null;
    if (patch.profileId !== undefined) {
      profile = store.capabilityProfiles.find((item) => item.id === patch.profileId) ?? null;
      if (!profile) fail("Choose a valid capability profile.");
    }
    const capabilities = {
      ...(profile?.capabilities ?? {}),
      ...(patch.capabilities ?? {}),
    };

    const unchanged =
      JSON.stringify(capabilities) === JSON.stringify(employee.capabilities ?? {}) &&
      (profile?.id ?? null) === (employee.profileId ?? null);

    if (!unchanged) {
      if (!capabilitiesWithinAuthority(actorRecord.permissions, capabilities)) {
        fail("You cannot grant capabilities you do not hold yourself.");
      }
      const profileChanged =
        patch.profileId !== undefined && patch.profileId !== employee.profileId;
      employee.profileId = profile?.id ?? employee.profileId;
      employee.capabilities = capabilities;
      details.push(
        profileChanged
          ? `Capability profile set to ${profile.name}.`
          : "Capabilities updated."
      );
    }
  }

  if (patch.status !== undefined && patch.status !== employee.status) {
    employee.status = patch.status === "disabled" ? "disabled" : "active";
    details.push(
      employee.status === "disabled"
        ? "Employee disabled — they can no longer sign in."
        : "Employee re-enabled."
    );
  }

  if (details.length === 0) details.push("Employee details updated.");

  /* A status-only change earns its own audit verb (disable / enable). */
  const statusOnly =
    patch.status !== undefined &&
    (details[details.length - 1] === "Employee disabled — they can no longer sign in." ||
      details[details.length - 1] === "Employee re-enabled.") &&
    details.length === 1;

  appendAudit(store, {
    actor: actorRecord.label,
    action: statusOnly
      ? employee.status === "disabled"
        ? "employee.disable"
        : "employee.enable"
      : "employee.update",
    entityType: "employee",
    entityId: id,
    entityLabel: employee.name,
    detail: details.join(" "),
  });
  return emit(employee);
}

/* ----------------------------------------------------------------------- */
/* Staff — shared login, employee creation, directory                      */
/* ----------------------------------------------------------------------- */

function emailTaken(store, email, exceptId = null) {
  const needle = String(email).toLowerCase();
  const matches = (entry) =>
    entry.id !== exceptId && String(entry.email ?? "").toLowerCase() === needle;
  return (
    String(db.superAdminAccount.email).toLowerCase() === needle ||
    store.admins.some(matches) ||
    store.employees.some(matches)
  );
}

/**
 * THE ONE STAFF LOGIN — credentials in, session out.
 *
 * The account decides the role; the caller never chooses one. Resolution
 * order: the platform owner, then administrators, then employees. Disabled
 * accounts are refused before the password is even compared against, and
 * every failure rejects with a readable message — the mock's 401s.
 */
export function authenticateStaff(store, credentials = {}) {
  const email = String(credentials.email ?? "").trim().toLowerCase();
  const password = String(credentials.password ?? "");

  if (!email || !password) fail("Enter both your email address and password.");

  let account = null;
  let role = null;

  if (String(db.superAdminAccount.email).toLowerCase() === email) {
    account = db.superAdminAccount;
    role = ROLES.SUPER_ADMIN;
  } else {
    account =
      store.admins.find((item) => String(item.email).toLowerCase() === email) ?? null;
    if (account) role = ROLES.ADMIN;
  }
  if (!account) {
    account =
      store.employees.find((item) => String(item.email).toLowerCase() === email) ?? null;
    if (account) role = ROLES.EMPLOYEE;
  }

  if (!account) fail("No staff account matches that email address.");
  if (account.status === "disabled") {
    fail("This account is disabled. Contact your administrator to restore access.");
  }
  if (account.password !== password) fail("Incorrect password. Please try again.");

  /* Session claims — exactly the payload a future backend issues. */
  let permissions;
  if (role === ROLES.SUPER_ADMIN) permissions = ["*"];
  else if (role === ROLES.ADMIN) {
    permissions = permissionsFromCapabilities(FULL_BUSINESS_CAPABILITIES);
  } else {
    const profile = store.capabilityProfiles.find(
      (item) => item.id === account.profileId
    );
    permissions = permissionsFromCapabilities(
      account.capabilities ?? profile?.capabilities ?? {}
    );
  }

  /* The session carries the account's branch summary for DISPLAY only
     (branch name in the console chrome). Every authorization decision is
     resolved again, store-side, in `resolveStaffScope` — the client never
     supplies its own scope. */
  const branch = store.branches.find((item) => item.id === account.branchId) ?? null;

  return emit({
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      branchId: account.branchId ?? null,
      branchName: branch?.name ?? null,
    },
    role,
    permissions,
  });
}

/**
 * Create an EMPLOYEE account — the only staff-creation path open to Admins.
 * Admins cannot create Admins (that stays with the platform owner's
 * `createGovernanceAdmin`) and nobody can create a Super Admin here.
 *
 * The hierarchy guard is enforced store-side, exactly as the API will:
 * the requested capabilities must sit within the creator's own grant.
 */
export function createEmployee(store, data = {}, actor = {}) {
  if (![ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(actor.role)) {
    fail("Only Admins and Super Admins can create staff accounts.");
  }

  if (!hasText(data.name)) fail("The employee's name is required.");
  const email = String(data.email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("A valid email address is required.");
  if (emailTaken(store, email)) {
    fail(`The email ${email} already belongs to another staff account.`);
  }
  if (!hasText(data.phone)) fail("A phone number is required.");
  const branch = store.branches.find((item) => item.id === data.branchId);
  if (!branch) fail("Choose the branch this employee belongs to.");
  if (!hasText(data.role)) fail("A role title is required — for example, Sales Consultant.");

  const profile = store.capabilityProfiles.find((item) => item.id === data.profileId);
  if (!profile) fail("Choose the capability profile this employee is hired into.");

  const capabilities = { ...profile.capabilities, ...(data.capabilities ?? {}) };
  if (!capabilitiesWithinAuthority(actor.permissions, capabilities)) {
    fail("You cannot grant capabilities you do not hold yourself.");
  }

  store.counters.employee += 1;
  const id = `EMP-${String(store.counters.employee).padStart(3, "0")}`;

  const employee = {
    id,
    name: data.name.trim(),
    email,
    password: db.STAFF_TEMP_PASSWORD,
    phone: String(data.phone).trim(),
    role: data.role.trim(),
    branchId: branch.id,
    profileId: profile.id,
    capabilities,
    status: "active",
  };

  store.employees = [...store.employees, employee];
  appendAudit(store, {
    actor: actor.label ?? "Admin",
    action: "employee.create",
    entityType: "employee",
    entityId: id,
    entityLabel: employee.name,
    detail: `Employee account created at ${branch.name} with the ${profile.name} capability profile.`,
  });

  /* The temporary password travels once, for the invite handover. */
  return { ...emit(employee), temporaryPassword: db.STAFF_TEMP_PASSWORD };
}

/* ----------------------------------------------------------------------- */
/* Platform — gold rates, settings, overview, audit                          */
/* ----------------------------------------------------------------------- */

export function updateGoldRates(store, rates = []) {
  if (!Array.isArray(rates) || rates.length === 0) fail("No rates were supplied.");
  for (const rate of rates) {
    if (typeof rate.pricePer10g !== "number" || rate.pricePer10g <= 0) {
      fail(`The ${rate.karat} rate must be a positive amount per 10 g.`);
    }
  }

  for (const rate of rates) {
    const existing = store.goldRateBoard.rates.find((item) => item.karat === rate.karat);
    if (existing) existing.pricePer10g = rate.pricePer10g;
  }
  store.goldRateBoard.updatedAt = now();

  appendAudit(store, {
    action: "platform.gold_rate",
    entityType: "platform",
    entityId: store.goldRateBoard.id,
    entityLabel: "Gold Rate Board",
    detail: `Updated the indicative rates for ${rates.map((rate) => rate.karat).join(" and ")} gold.`,
  });
  return emit(store.goldRateBoard);
}

export function updatePlatformSettings(store, patch = {}) {
  const next = JSON.parse(JSON.stringify(store.settings));

  if (patch.storefront?.status !== undefined) {
    next.storefront.status = patch.storefront.status === "offline" ? "offline" : "online";
    next.storefront.statusNote =
      next.storefront.status === "offline"
        ? "The storefront is temporarily paused. Customers see a maintenance notice."
        : "The customer storefront is trading normally.";
  }
  for (const key of ["aiStudio", "virtualTryOn"]) {
    if (patch.features?.[key]?.enabled !== undefined) {
      next.features[key].enabled = Boolean(patch.features[key].enabled);
    }
  }
  if (hasText(patch.commerce?.supportEmail)) {
    next.commerce.supportEmail = patch.commerce.supportEmail.trim();
  }
  if (["INR"].includes(patch.commerce?.defaultCurrency)) {
    next.commerce.defaultCurrency = patch.commerce.defaultCurrency;
  }

  store.settings = next;
  appendAudit(store, {
    action: "platform.settings",
    entityType: "platform",
    entityId: "SETTINGS",
    entityLabel: "Platform Settings",
    detail: "Platform settings updated.",
  });
  return emit(store.settings);
}

/** The command-centre summary — computed from canonical state, never stored. */
export function platformOverview(store) {
  const products = store.products;
  const published = products.filter((p) => p.status === "published");
  const media = store.media.map((item) => toGovernanceMedia(store, item));
  const activeCampaign = db.getActiveCampaign(store.campaigns);

  return emit({
    products: {
      total: products.length,
      published: published.length,
      inReview: products.filter((p) => p.status === "submitted").length,
      drafts: products.filter((p) => p.status === "draft").length,
      approved: products.filter((p) => p.status === "approved").length,
      rejected: products.filter((p) => p.status === "rejected").length,
    },
    media: {
      total: media.length,
      inUse: media.filter((item) => item.status === "in-use").length,
      unused: media.filter((item) => item.status === "unused").length,
    },
    branches: {
      total: store.branches.length,
      active: store.branches.filter((branch) => branch.status !== "disabled").length,
      disabled: store.branches.filter((branch) => branch.status === "disabled").length,
    },
    people: {
      admins: store.admins.length,
      activeAdmins: store.admins.filter((admin) => admin.status === "active").length,
      employees: store.employees.length,
    },
    campaigns: {
      total: store.campaigns.length,
      live: activeCampaign ? 1 : 0,
      liveTitle: activeCampaign?.title ?? null,
    },
    aiStudio: {
      enabled: store.settings.features.aiStudio.enabled,
      designLibrary: db.aiDesigns.length,
    },
    virtualTryOn: {
      enabled: store.settings.features.virtualTryOn.enabled,
      eligiblePieces: published.filter((p) => p.tryOnAvailable).length,
      samplePortraits: db.tryOnSamples.length,
    },
    storefront: {
      status: store.settings.storefront.status,
      defaultCurrency: store.settings.commerce.defaultCurrency,
    },
    goldRate: {
      updatedAt: store.goldRateBoard.updatedAt,
      rates: store.goldRateBoard.rates.map((rate) => ({
        karat: rate.karat,
        pricePer10g: rate.pricePer10g,
      })),
    },
    recentActivity: store.auditLog.slice(0, 6),
  });
}

export function listAuditLogs(store, query = {}) {
  let list = [...store.auditLog];

  if (query.action) list = list.filter((entry) => entry.action === query.action);
  if (query.actor) list = list.filter((entry) => entry.actor === query.actor);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (entry) =>
        entry.detail.toLowerCase().includes(term) ||
        String(entry.entityLabel ?? "").toLowerCase().includes(term) ||
        String(entry.entityId ?? "").toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return emit(list.slice(0, query.limit ?? 100));
}

/* ----------------------------------------------------------------------- */
/* Admin operations — orders                                               */
/* ----------------------------------------------------------------------- */

/**
 * The operational order lifecycle — the ONLY states and moves between them.
 * An order walks forward Placed → Processing → Shipped → Delivered, or is
 * Cancelled before it ships. Nothing else exists; the backend refuses it.
 */
export const ORDER_FLOW = {
  Placed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

/** Order states that still need business attention. */
export const OPEN_ORDER_STATUSES = ["Placed", "Processing", "Shipped"];

export function orderActions(status) {
  return ORDER_FLOW[status] ?? [];
}

export function toAdminOrder(store, order) {
  const customer = store.customers.find((item) => item.id === order.customerId);
  const branch = store.branches.find((item) => item.id === order.branchId);
  return emit({
    ...order,
    customerName: customer?.name ?? "Unknown customer",
    branchName: branch?.name ?? null,
    actions: orderActions(order.status),
  });
}

function findOrder(store, id) {
  const order = store.orders.find(
    (item) => item.id === id || item.orderNumber === id
  );
  if (!order) fail(`Order ${id} could not be found.`);
  return order;
}

export function listAdminOrders(store, query = {}) {
  let list = [...store.orders];

  if (query.status) list = list.filter((order) => order.status === query.status);
  if (query.branchId) list = list.filter((order) => order.branchId === query.branchId);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((order) => {
      const customer = store.customers.find((item) => item.id === order.customerId);
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term) ||
        String(customer?.name ?? "").toLowerCase().includes(term)
      );
    });
  }

  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return list.map((order) => toAdminOrder(store, order));
}

export function getAdminOrder(store, id) {
  const order = store.orders.find(
    (item) => item.id === id || item.orderNumber === id
  );
  return order ? toAdminOrder(store, order) : null;
}

/**
 * Move an order along the lifecycle. The flow table is enforced here — an
 * Admin cannot skip states, re-open a delivery, or cancel a shipped order.
 *
 * `branchId` is optional and only ever recorded on the audit entry: the
 * employee contract passes the branch it already resolved from the session,
 * so a branch action reads as one in the trail.
 */
export function updateAdminOrderStatus(store, id, status, actor, branchId = null) {
  const order = findOrder(store, id);
  const allowed = ORDER_FLOW[order.status] ?? [];
  if (!allowed.includes(status)) {
    fail(
      `A ${order.status.toLowerCase()} order cannot move to “${status}”. ` +
        (allowed.length > 0
          ? `Allowed next steps: ${allowed.join(", ")}.`
          : "This order has reached its final state.")
    );
  }

  const at = now();
  order.status = status;
  if (status === "Delivered") order.deliveredAt = at;
  if (status === "Cancelled") {
    order.cancelledAt = at;
    order.paymentStatus = "refunded";
  }

  appendAudit(store, {
    actor,
    branchId,
    action: "order.status",
    entityType: "order",
    entityId: order.id,
    entityLabel: order.orderNumber,
    detail:
      status === "Cancelled"
        ? "Order cancelled and payment marked for refund."
        : `Order status changed to ${status}.`,
  });
  return toAdminOrder(store, order);
}

/* ----------------------------------------------------------------------- */
/* Admin operations — customers                                            */
/* ----------------------------------------------------------------------- */

function customerStats(store, customerId) {
  const orders = store.orders.filter((order) => order.customerId === customerId);
  const purchased = orders.filter((order) => order.status !== "Cancelled");
  const sorted = [...orders].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
  return {
    orderCount: orders.length,
    totalSpent: purchased.reduce((sum, order) => sum + order.total, 0),
    lastOrderAt: sorted[0]?.createdAt ?? null,
  };
}

export function toAdminCustomer(store, customer) {
  /* Credentials never leave the store — the Admin book sees the public record. */
  return emit({ ...withoutCredential(customer), ...customerStats(store, customer.id) });
}

export function listAdminCustomers(store, query = {}) {
  let list = [...store.customers];

  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.toLowerCase().includes(term) ||
        customer.city.toLowerCase().includes(term)
    );
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list.map((customer) => toAdminCustomer(store, customer));
}

export function getAdminCustomer(store, id) {
  const customer = store.customers.find((item) => item.id === id);
  if (!customer) return null;
  const orders = store.orders
    .filter((order) => order.customerId === id)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((order) => toAdminOrder(store, order));
  return emit({ ...toAdminCustomer(store, customer), orders });
}

/* ----------------------------------------------------------------------- */
/* Admin operations — inventory                                            */
/* ----------------------------------------------------------------------- */

/** Stock state: "out" beats "low" beats "ok" — derived, never stored. */
export function stockState(row) {
  if (row.available <= 0) return "out";
  if (row.available <= row.reorderLevel) return "low";
  return "ok";
}

export function toAdminStock(store, row) {
  const product = store.products.find((item) => item.id === row.productId);
  const branch = store.branches.find((item) => item.id === row.branchId);
  return emit({
    ...row,
    productName: product?.name ?? row.productId,
    sku: product?.sku ?? null,
    productImage: product?.images?.[0] ?? null,
    branchName: branch?.name ?? row.branchId,
    branchCity: branch?.city ?? null,
    state: stockState(row),
  });
}

/**
 * Inventory query contract:
 *   { branchId, productId, stock: "low" | "out", search }
 * `stock: "low"` includes out-of-stock rows — "needs attention" as one bucket.
 */
export function listAdminInventory(store, query = {}) {
  let list = [...store.inventory];

  if (query.branchId) list = list.filter((row) => row.branchId === query.branchId);
  if (query.productId) list = list.filter((row) => row.productId === query.productId);
  if (query.stock === "low") list = list.filter((row) => stockState(row) !== "ok");
  if (query.stock === "out") list = list.filter((row) => stockState(row) === "out");
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((row) => {
      const product = store.products.find((item) => item.id === row.productId);
      return (
        String(product?.name ?? "").toLowerCase().includes(term) ||
        String(product?.sku ?? "").toLowerCase().includes(term)
      );
    });
  }

  const stateOrder = { out: 0, low: 1, ok: 2 };
  list.sort(
    (a, b) =>
      stateOrder[stockState(a)] - stateOrder[stockState(b)] ||
      String(a.productId).localeCompare(String(b.productId))
  );
  return list.map((row) => toAdminStock(store, row));
}

/**
 * Adjust one stock row by a signed quantity. The adjustment is validated
 * exactly as the API will: whole pieces only, never below zero, and a
 * written reason — which travels into the movement log and the audit trail.
 *
 * `branchId` is optional and only ever recorded on the audit entry (see
 * `updateAdminOrderStatus`); the employee contract passes the branch it
 * resolved from the session.
 */
export function adjustAdminInventory(store, stockId, adjustment = {}, actor, branchId = null) {
  const row = store.inventory.find((item) => item.id === stockId);
  if (!row) fail(`Stock record ${stockId} could not be found.`);

  const delta = Number(adjustment.delta);
  if (!Number.isInteger(delta) || delta === 0) {
    fail("Enter a whole-piece quantity to add or remove.");
  }
  if (!hasText(adjustment.reason)) {
    fail("A reason is required for every stock adjustment.");
  }
  if (row.available + delta < 0) {
    fail(
      `Only ${row.available} piece${row.available === 1 ? "" : "s"} available — ` +
        "stock can never be adjusted below zero."
    );
  }

  row.available += delta;

  const movement = {
    id: `MV-${Date.now()}`,
    stockId: row.id,
    type: "adjustment",
    delta,
    at: now(),
    by: actor ?? "Admin",
    note: adjustment.reason.trim(),
  };
  store.inventoryMovements = [movement, ...store.inventoryMovements].slice(0, 200);

  const stock = toAdminStock(store, row);
  appendAudit(store, {
    actor,
    branchId,
    action: "inventory.adjust",
    entityType: "inventory",
    entityId: row.id,
    entityLabel: `${stock.productName} · ${stock.branchName}`,
    detail: `Stock adjusted by ${delta > 0 ? "+" : ""}${delta} (${adjustment.reason.trim()}). Now ${row.available} available.`,
  });
  return stock;
}

export function listInventoryMovements(store, query = {}) {
  let list = [...store.inventoryMovements];
  if (query.stockId) list = list.filter((item) => item.stockId === query.stockId);
  list.sort((a, b) => String(b.at).localeCompare(String(a.at)));
  return emit(list.slice(0, query.limit ?? 20));
}

/* ----------------------------------------------------------------------- */
/* Admin operations — branch coordination                                  */
/* ----------------------------------------------------------------------- */

/**
 * The operational branch view: what the head office needs to coordinate a
 * boutique — people, stock and open orders. Platform governance of branches
 * (enable/disable) stays with the Super Admin; nothing here duplicates it.
 */
export function listBranchOperations(store) {
  return store.branches.map((branch) => {
    const manager = store.admins.find(
      (item) => item.branchId === branch.id && item.status === "active"
    );
    const employees = store.employees.filter((item) => item.branchId === branch.id);
    const stock = store.inventory.filter((row) => row.branchId === branch.id);
    const openOrders = store.orders.filter(
      (order) => order.branchId === branch.id && OPEN_ORDER_STATUSES.includes(order.status)
    );

    return emit({
      ...branch,
      managerName: manager?.name ?? null,
      employeeCount: employees.length,
      activeEmployeeCount: employees.filter((item) => item.status === "active").length,
      inventory: {
        rows: stock.length,
        units: stock.reduce((sum, row) => sum + row.available, 0),
        lowCount: stock.filter((row) => stockState(row) !== "ok").length,
      },
      openOrders: {
        count: openOrders.length,
        value: openOrders.reduce((sum, order) => sum + order.total, 0),
      },
    });
  });
}

/* ----------------------------------------------------------------------- */
/* Admin operations — reports & overview                                   */
/* ----------------------------------------------------------------------- */

const ORDER_STATUS_LIST = ["Placed", "Processing", "Shipped", "Delivered", "Cancelled"];

/** Business reports — computed from canonical state, never stored. */
export function adminReports(store) {
  const ordersByStatus = ORDER_STATUS_LIST.map((status) => {
    const list = store.orders.filter((order) => order.status === status);
    return {
      status,
      count: list.length,
      value: list.reduce((sum, order) => sum + order.total, 0),
    };
  });

  const salesByBranch = store.branches.map((branch) => {
    const sold = store.orders.filter(
      (order) => order.branchId === branch.id && order.status !== "Cancelled"
    );
    return {
      branchId: branch.id,
      branchName: branch.name,
      city: branch.city,
      orders: sold.length,
      units: sold.reduce(
        (sum, order) =>
          sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
        0
      ),
      revenue: sold.reduce((sum, order) => sum + order.total, 0),
    };
  });

  const byProduct = new Map();
  for (const order of store.orders) {
    if (order.status === "Cancelled") continue;
    for (const item of order.items) {
      const entry = byProduct.get(item.id) ?? {
        productId: item.id,
        name: item.name,
        sku: item.sku,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      byProduct.set(item.id, entry);
    }
  }
  const topProducts = [...byProduct.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .slice(0, 5);

  return emit({
    ordersByStatus,
    salesByBranch,
    topProducts,
    lowStock: listAdminInventory(store, { stock: "low" }),
  });
}

/**
 * The Admin dashboard payload — "what needs attention in the jewellery
 * business today?" Computed from canonical state, like the platform
 * overview; never stored, never a second database.
 */
export function adminOverview(store) {
  const openOrders = store.orders.filter((order) =>
    OPEN_ORDER_STATUSES.includes(order.status)
  );
  const placed = store.orders.filter((order) => order.status === "Placed");
  const processing = store.orders.filter((order) => order.status === "Processing");
  const lowStock = store.inventory.filter((row) => stockState(row) !== "ok");
  const outOfStock = store.inventory.filter((row) => stockState(row) === "out");
  const published = store.products.filter((product) => product.status === "published");
  const drafts = store.products.filter((product) => product.status === "draft");
  const rejected = store.products.filter((product) => product.status === "rejected");
  const activeCampaign = db.getActiveCampaign(store.campaigns);

  const attention = [];
  if (placed.length > 0) {
    attention.push({
      key: "orders-placed",
      label: `${placed.length} newly placed order${placed.length === 1 ? "" : "s"} to confirm`,
      action: "Review",
      to: "/admin/orders?status=Placed",
    });
  }
  if (processing.length > 0) {
    attention.push({
      key: "orders-fulfilment",
      label: `${processing.length} order${processing.length === 1 ? "" : "s"} awaiting fulfilment`,
      action: "Fulfil",
      to: "/admin/orders?status=Processing",
    });
  }
  if (lowStock.length > 0) {
    attention.push({
      key: "inventory-low",
      label: `${lowStock.length} stock line${lowStock.length === 1 ? "" : "s"} at or below reorder level`,
      action: "Restock",
      to: "/admin/inventory?stock=low",
    });
  }
  if (rejected.length > 0) {
    attention.push({
      key: "products-rejected",
      label: `${rejected.length} rejected product${rejected.length === 1 ? "" : "s"} awaiting revision`,
      action: "Revise",
      to: "/admin/products?status=rejected",
    });
  }
  if (drafts.length > 0) {
    attention.push({
      key: "products-drafts",
      label: `${drafts.length} product draft${drafts.length === 1 ? "" : "s"} not yet submitted for review`,
      action: "View",
      to: "/admin/products?status=draft",
    });
  }

  const recentOrders = [...store.orders]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 5)
    .map((order) => toAdminOrder(store, order));

  return emit({
    business: {
      openOrders: openOrders.length,
      openOrdersValue: openOrders.reduce((sum, order) => sum + order.total, 0),
      awaitingFulfilment: placed.length + processing.length,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      publishedProducts: published.length,
      totalProducts: store.products.length,
      customers: store.customers.length,
      activeBranches: store.branches.filter((branch) => branch.status !== "disabled").length,
      totalBranches: store.branches.length,
    },
    attention,
    ordersNeedingAttention: [...placed, ...processing]
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      .slice(0, 5)
      .map((order) => toAdminOrder(store, order)),
    lowStock: listAdminInventory(store, { stock: "low" }).slice(0, 5),
    branches: listBranchOperations(store),
    recentOrders,
    campaign: activeCampaign
      ? { title: activeCampaign.title, eyebrow: activeCampaign.eyebrow }
      : null,
    recentActivity: store.auditLog.slice(0, 6),
  });
}

/* ----------------------------------------------------------------------- */
/* Employee / branch operations (Phase 10)                                  */
/* ----------------------------------------------------------------------- */

/**
 * STAFF SCOPE — who is asking, and what they may see.
 *
 * The employee contract never trusts a scope that arrives with a request.
 * `actor` is the session identity only — `{ id, role, label }` — and every
 * fact an authorization decision depends on is re-resolved, store-side, from
 * the canonical records:
 *
 *   Super Admin   global — every branch may be named explicitly
 *   Admin         head office — global, or its own boutique when the
 *                 administrator account is branch-scoped
 *   Employee      the branch on their OWN employee record, and the
 *                 capabilities granted to that record
 *
 * A `branchId` in a query that differs from a scoped caller's branch is
 * refused, never honoured: changing a URL parameter cannot widen anyone's
 * reach. The resolved scope carries the permission claims the operations
 * below check — the same `<group>.<level>` capability keys the Admin console
 * uses, so there is exactly one authorization vocabulary in the platform.
 */
export function resolveStaffScope(store, actor = {}) {
  const role = actor.role;

  if (role === ROLES.SUPER_ADMIN) {
    return {
      role,
      label: hasText(actor.label) ? actor.label : "Super Admin",
      global: true,
      branchId: null,
      branch: null,
      admin: null,
      employee: null,
      profile: null,
      capabilities: FULL_BUSINESS_CAPABILITIES,
      permissions: ["*"],
    };
  }

  if (role === ROLES.ADMIN) {
    const admin = hasText(actor.id)
      ? store.admins.find((item) => item.id === actor.id) ?? null
      : null;
    if (hasText(actor.id) && !admin) fail("This administrator account could not be resolved.");
    if (admin?.status === "disabled") fail("This administrator account is disabled.");

    const branchId =
      admin?.scope === "branch" && hasText(admin.branchId) ? admin.branchId : null;

    return {
      role,
      label: hasText(actor.label) ? actor.label : `${admin?.name ?? "Admin"} — Admin`,
      global: !branchId,
      branchId,
      branch: branchId ? branchOrFail(store, branchId) : null,
      admin,
      employee: null,
      profile: null,
      capabilities: FULL_BUSINESS_CAPABILITIES,
      permissions: permissionsFromCapabilities(FULL_BUSINESS_CAPABILITIES),
    };
  }

  if (role === ROLES.EMPLOYEE) {
    const employee = store.employees.find((item) => item.id === actor.id) ?? null;
    if (!employee) fail("This employee account could not be resolved.");
    if (employee.status === "disabled") {
      fail("This account is disabled. Contact head office to restore access.");
    }

    const branch = branchOrFail(store, employee.branchId);
    const profile =
      store.capabilityProfiles.find((item) => item.id === employee.profileId) ?? null;
    const capabilities = { ...(profile?.capabilities ?? {}), ...(employee.capabilities ?? {}) };

    return {
      role,
      label: hasText(actor.label) ? actor.label : `${employee.name} — Employee`,
      global: false,
      branchId: branch.id,
      branch,
      admin: null,
      employee,
      profile,
      capabilities,
      permissions: permissionsFromCapabilities(capabilities),
    };
  }

  fail("This account has no branch operations access.");
  return null;
}

function branchOrFail(store, id) {
  const branch = store.branches.find((item) => item.id === id);
  if (!branch) fail(`Branch ${id} could not be found.`);
  return branch;
}

/**
 * The one place a requested branch becomes an allowed one. A scoped caller may
 * only ever name its own branch (normally it names none at all); a global
 * caller may name any branch, or none for "the whole network".
 */
function resolveScopeBranch(store, scope, requested) {
  if (!scope.global) {
    if (hasText(requested) && requested !== scope.branchId) {
      fail(`${scope.branch.name} is the only branch this account can work in.`);
    }
    return scope.branchId;
  }
  if (!hasText(requested)) return null;
  return branchOrFail(store, requested).id;
}

/** The branch an intrinsically single-branch view opens on. */
function defaultBranchId(store) {
  const branch = store.branches.find((item) => item.status !== "disabled") ?? store.branches[0];
  return branch?.id ?? null;
}

function requireScopeCapability(scope, key, subject) {
  const granted = scope.permissions ?? [];
  if (granted.includes("*") || granted.includes(key)) return;
  fail(`This account does not have the ${subject} capability.`);
}

function hasScopeCapability(scope, key) {
  const granted = scope.permissions ?? [];
  return granted.includes("*") || granted.includes(key);
}

/**
 * The mock's current BUSINESS DAY — the calendar date of the newest order in
 * the book. The fixtures are dated, so deriving "today" from them keeps the
 * operational screens alive whenever the demo runs; a real backend returns the
 * server's business date here and nothing else changes.
 */
function businessDay(store) {
  const newest = store.orders.reduce(
    (latest, order) => (String(order.createdAt) > latest ? String(order.createdAt) : latest),
    ""
  );
  return newest.slice(0, 10) || new Date().toISOString().slice(0, 10);
}

function onBusinessDay(iso, day) {
  return String(iso ?? "").slice(0, 10) === day;
}

function daysBefore(day, count) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - count);
  return date.toISOString().slice(0, 10);
}

/** Orders, pieces and value — cancelled orders never count as sales. */
function summariseOrders(orders) {
  const sold = orders.filter((order) => order.status !== "Cancelled");
  return {
    orders: sold.length,
    units: sold.reduce(
      (sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0),
      0
    ),
    value: sold.reduce((sum, order) => sum + order.total, 0),
  };
}

function branchOrders(store, branchId) {
  return branchId ? store.orders.filter((order) => order.branchId === branchId) : [...store.orders];
}

function branchStockRows(store, branchId) {
  return branchId
    ? store.inventory.filter((row) => row.branchId === branchId)
    : [...store.inventory];
}

/* ----------------------------------------------------------------------- */
/* Employee — orders                                                        */
/* ----------------------------------------------------------------------- */

/** The branch's order book, newest first (orders.view). */
export function listEmployeeOrders(store, actor, query = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.ORDERS_VIEW, "order");
  const branchId = resolveScopeBranch(store, scope, query.branchId);

  let list = branchOrders(store, branchId);
  if (query.status) list = list.filter((order) => order.status === query.status);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((order) => {
      const customer = store.customers.find((item) => item.id === order.customerId);
      return (
        order.orderNumber.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term) ||
        String(customer?.name ?? "").toLowerCase().includes(term)
      );
    });
  }

  list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return list.map((order) => toAdminOrder(store, order));
}

/** One order the branch fulfils; `null` when it does not exist at all. */
export function getEmployeeOrder(store, actor, id) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.ORDERS_VIEW, "order");
  const branchId = resolveScopeBranch(store, scope, null);

  const order = store.orders.find((item) => item.id === id || item.orderNumber === id);
  if (!order) return null;
  if (branchId && order.branchId !== branchId) {
    fail(
      `“${order.orderNumber}” is fulfilled by another boutique — this account works ${scope.branch.name} only.`
    );
  }
  return toAdminOrder(store, order);
}

/**
 * Move a branch order along THE SAME lifecycle the business already uses —
 * Placed → Processing → Shipped → Delivered, cancelled before shipping only.
 * The flow table is enforced by `updateAdminOrderStatus`; this contract adds
 * the branch boundary in front of it (orders.manage).
 */
export function updateEmployeeOrderStatus(store, actor, id, status) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.ORDERS_MANAGE, "order management");

  const order = store.orders.find((item) => item.id === id || item.orderNumber === id);
  if (!order) fail(`Order ${id} could not be found.`);
  if (!scope.global && order.branchId !== scope.branchId) {
    fail(
      `“${order.orderNumber}” is fulfilled by another boutique — this account works ${scope.branch.name} only.`
    );
  }

  return updateAdminOrderStatus(
    store,
    order.id,
    status,
    scope.label,
    scope.branchId ?? order.branchId
  );
}

/* ----------------------------------------------------------------------- */
/* Employee — customers                                                     */
/* ----------------------------------------------------------------------- */

function branchCustomerIds(store, branchId) {
  return new Set(branchOrders(store, branchId).map((order) => order.customerId));
}

/** Customer statistics as the branch itself sees them — its own orders only. */
function branchCustomerStats(store, customerId, branchId) {
  const orders = branchOrders(store, branchId).filter((order) => order.customerId === customerId);
  const sorted = [...orders].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const purchased = orders.filter((order) => order.status !== "Cancelled");
  return {
    orderCount: orders.length,
    totalSpent: purchased.reduce((sum, order) => sum + order.total, 0),
    lastOrderAt: sorted[0]?.createdAt ?? null,
  };
}

function toEmployeeCustomer(store, customer, branchId) {
  /* Credentials never leave the store — the branch book sees the public record. */
  return emit({ ...withoutCredential(customer), ...branchCustomerStats(store, customer.id, branchId) });
}

/**
 * The branch's customer book — the people this boutique has actually served,
 * taken from the ONE canonical customer directory. Order counts and lifetime
 * value are the branch's own slice, so nobody's cross-branch spend leaks.
 */
export function listEmployeeCustomers(store, actor, query = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.ORDERS_VIEW, "customer");
  const branchId = resolveScopeBranch(store, scope, query.branchId);

  const ids = branchCustomerIds(store, branchId);
  let list = store.customers.filter((customer) => ids.has(customer.id));

  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.city].some((value) =>
        String(value ?? "").toLowerCase().includes(term)
      )
    );
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list.map((customer) => toEmployeeCustomer(store, customer, branchId));
}

/** One customer with the orders THIS branch has fulfilled for them. */
export function getEmployeeCustomer(store, actor, id) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.ORDERS_VIEW, "customer");
  const branchId = resolveScopeBranch(store, scope, null);

  const customer = store.customers.find((item) => item.id === id);
  if (!customer) return null;

  const orders = branchOrders(store, branchId).filter((order) => order.customerId === id);
  if (orders.length === 0 && !scope.global) {
    fail(
      `${customer.name} has no orders at ${scope.branch.name} — customer records are branch-scoped.`
    );
  }

  orders.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return emit({
    ...toEmployeeCustomer(store, customer, branchId),
    orders: orders.map((order) => toAdminOrder(store, order)),
  });
}

/* ----------------------------------------------------------------------- */
/* Employee — catalogue                                                     */
/* ----------------------------------------------------------------------- */

/** A piece's position in one branch — null when the branch does not stock it. */
function branchStockFor(store, branchId, productId) {
  if (!branchId) return null;
  const row = store.inventory.find(
    (item) => item.branchId === branchId && item.productId === productId
  );
  return row ? toAdminStock(store, row) : null;
}

/**
 * The catalogue as an employee operates it: PUBLISHED pieces only, with the
 * piece's price, SKU, availability, media — and, when the account also holds
 * inventory visibility, its position in the account's own branch. Governance
 * fields (lifecycle status detail, readiness, audit metadata) are deliberately
 * absent: employees operate the catalogue, they never govern it.
 */
function toEmployeeProduct(store, scope, product, branchId) {
  const category = store.categories.find((item) => item.id === product.categoryId);
  const collection = store.collections.find((item) => item.id === product.collectionId);

  return emit({
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    purity: product.purity,
    price: product.price,
    currency: product.currency,
    weight: product.weight,
    categoryId: product.categoryId,
    collectionId: product.collectionId,
    categoryName: category?.name ?? null,
    collectionName: collection?.name ?? null,
    availability: product.availability,
    tryOnAvailable: product.tryOnAvailable,
    images: product.images,
    rating: product.rating,
    href: product.href,
    stock: hasScopeCapability(scope, CAPABILITIES.INVENTORY_VIEW)
      ? branchStockFor(store, branchId, product.id)
      : null,
  });
}

export function listEmployeeCatalogue(store, actor, query = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.CATALOGUE_VIEW, "catalogue");
  const branchId = resolveScopeBranch(store, scope, query.branchId);
  const stockBranch = branchId ?? (scope.global ? null : scope.branchId);

  let list = store.products.filter((product) => product.status === "published");

  if (query.categoryId) list = list.filter((product) => product.categoryId === query.categoryId);
  if (query.collectionId) list = list.filter((product) => product.collectionId === query.collectionId);
  if (query.availability) list = list.filter((product) => product.availability === query.availability);
  if (query.search) {
    const term = String(query.search).toLowerCase();
    list = list.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.sku.toLowerCase().includes(term) ||
        product.id.toLowerCase().includes(term)
    );
  }
  if (query.stock && stockBranch) {
    list = list.filter((product) => {
      const row = store.inventory.find(
        (item) => item.branchId === stockBranch && item.productId === product.id
      );
      const state = row ? stockState(row) : "out";
      return query.stock === "low" ? state !== "ok" : state === query.stock;
    });
  }

  list.sort((a, b) => a.name.localeCompare(b.name));
  return list.map((product) => toEmployeeProduct(store, scope, product, stockBranch));
}

export function getEmployeeProduct(store, actor, id) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.CATALOGUE_VIEW, "catalogue");
  const branchId = resolveScopeBranch(store, scope, null);

  const product = store.products.find((item) => item.id === id);
  /* Drafts, submissions and rejections are governance states: an employee
     never sees a piece the storefront cannot. */
  if (!product || product.status !== "published") return null;

  return toEmployeeProduct(store, scope, product, branchId ?? defaultBranchId(store));
}

/**
 * Catalogue taxonomy for lookup (catalogue.view): the enabled categories in
 * their display order, as id / name / slug. A branch account gets the labels
 * it searches by — never the governance fields behind them.
 */
export function listEmployeeCategories(store, actor) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.CATALOGUE_VIEW, "catalogue");
  return emit(
    store.categories
      .filter((category) => category.enabled !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((category) => ({ id: category.id, name: category.name, slug: category.slug }))
  );
}

/* ----------------------------------------------------------------------- */
/* Employee — inventory                                                     */
/* ----------------------------------------------------------------------- */

/** The branch's stock lines (inventory.view). All branches only for a global caller. */
export function listEmployeeInventory(store, actor, query = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.INVENTORY_VIEW, "inventory");
  const branchId = resolveScopeBranch(store, scope, query.branchId);
  return listAdminInventory(store, { ...query, branchId: branchId ?? undefined });
}

/**
 * Adjust one stock line (inventory.manage). The row must belong to the
 * account's own branch — the branch is resolved from the session, never read
 * from the request — and the adjustment keeps every rule head office already
 * enforces: whole pieces, a written reason, never below zero, always audited.
 */
export function adjustEmployeeInventory(store, actor, stockId, adjustment = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.INVENTORY_MANAGE, "inventory management");

  const row = store.inventory.find((item) => item.id === stockId);
  if (!row) fail(`Stock record ${stockId} could not be found.`);
  if (!scope.global && row.branchId !== scope.branchId) {
    fail(`${scope.branch.name} can only adjust its own stock — that line belongs to another boutique.`);
  }

  return adjustAdminInventory(store, stockId, adjustment, scope.label, row.branchId);
}

/** Movement history, restricted to the stock lines the account may see. */
export function listEmployeeInventoryMovements(store, actor, query = {}) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.INVENTORY_VIEW, "inventory");
  const branchId = resolveScopeBranch(store, scope, query.branchId);

  const visible = new Set(branchStockRows(store, branchId).map((row) => row.id));
  if (hasText(query.stockId) && !visible.has(query.stockId)) {
    fail("That stock line belongs to another boutique.");
  }

  const limit = query.limit ?? 20;
  const movements = listInventoryMovements(store, {
    stockId: query.stockId,
    limit: query.stockId ? limit : 200,
  });
  return movements.filter((movement) => visible.has(movement.stockId)).slice(0, limit);
}

/* ----------------------------------------------------------------------- */
/* Employee — dashboard, branch operations, reports, profile               */
/* ----------------------------------------------------------------------- */

function employeeBranchSummary(branch) {
  return {
    id: branch.id,
    name: branch.name,
    city: branch.city,
    state: branch.state,
    status: branch.status,
    flagship: Boolean(branch.flagship),
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    openingHours: branch.openingHours,
    image: branch.image,
  };
}

function recentBranchActivity(store, branchId, limit = 6) {
  const visible = new Set(branchStockRows(store, branchId).map((row) => row.id));

  const movements = store.inventoryMovements
    .filter((movement) => visible.has(movement.stockId))
    .map((movement) => ({
      id: movement.id,
      at: movement.at,
      kind: movement.type,
      label: `${movement.delta > 0 ? "+" : ""}${movement.delta} ${
        Math.abs(movement.delta) === 1 ? "piece" : "pieces"
      }`,
      actor: movement.by,
      detail: movement.note ?? "",
    }));

  /* Audit entries written by branch actions carry the branch they happened
     in; head-office entries do not, and stay out of a branch's own feed. */
  const entries = store.auditLog
    .filter((entry) => entry.branchId === branchId)
    .map((entry) => ({
      id: entry.id,
      at: entry.at,
      kind: "audit",
      label: entry.action,
      actor: entry.actor,
      detail: entry.detail,
    }));

  return [...movements, ...entries]
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, limit);
}

/**
 * THE BRANCH DASHBOARD — "what do I need to do at my branch today?".
 * Deliberately operational: today's counter activity, what is waiting to be
 * processed, the stock that needs attention and the pieces of work that carry
 * a next step. Every block is capability-aware, so a profile without
 * inventory visibility never receives stock figures at all.
 */
export function employeeOverview(store, actor) {
  const scope = resolveStaffScope(store, actor);
  const branchId = scope.branchId ?? defaultBranchId(store);
  const branch = branchOrFail(store, branchId);
  const day = businessDay(store);

  const canOrders = hasScopeCapability(scope, CAPABILITIES.ORDERS_VIEW);
  const canManageOrders = hasScopeCapability(scope, CAPABILITIES.ORDERS_MANAGE);
  const canInventory = hasScopeCapability(scope, CAPABILITIES.INVENTORY_VIEW);
  const canBranch = hasScopeCapability(scope, CAPABILITIES.BRANCHES_VIEW);

  const orders = branchOrders(store, branchId);
  const today = orders.filter((order) => onBusinessDay(order.createdAt, day));
  const open = orders.filter((order) => OPEN_ORDER_STATUSES.includes(order.status));
  const placed = orders.filter((order) => order.status === "Placed");
  const processing = orders.filter((order) => order.status === "Processing");
  const stock = branchStockRows(store, branchId);
  const needsRestock = stock
    .filter((row) => stockState(row) !== "ok")
    .sort((a, b) => stockState(a).localeCompare(stockState(b)));

  const attention = [];
  if (canOrders && placed.length > 0) {
    attention.push({
      key: "orders-placed",
      label: `${placed.length} order${placed.length === 1 ? "" : "s"} waiting to be confirmed`,
      action: canManageOrders ? "Confirm" : "Review",
      to: "/employee/orders?status=Placed",
    });
  }
  if (canOrders && processing.length > 0) {
    attention.push({
      key: "orders-processing",
      label: `${processing.length} order${processing.length === 1 ? "" : "s"} being prepared for the customer`,
      action: canManageOrders ? "Fulfil" : "Review",
      to: "/employee/orders?status=Processing",
    });
  }
  if (canInventory && needsRestock.length > 0) {
    attention.push({
      key: "inventory-low",
      label: `${needsRestock.length} stock line${needsRestock.length === 1 ? "" : "s"} at or below reorder level`,
      action: "Restock",
      to: "/employee/inventory?stock=low",
    });
  }

  const team = store.employees.filter((item) => item.branchId === branchId);

  return emit({
    branch: employeeBranchSummary(branch),
    businessDay: day,
    employee: scope.employee
      ? {
          id: scope.employee.id,
          name: scope.employee.name,
          role: scope.employee.role,
          profileName: scope.profile?.name ?? null,
        }
      : null,
    /* Order-derived blocks exist only for an account with order visibility —
       the payload carries nothing a profile cannot read. */
    today: canOrders
      ? {
          orders: today.length,
          customers: new Set(today.map((order) => order.customerId)).size,
          ...summariseOrders(today),
        }
      : null,
    openOrders: canOrders
      ? {
          count: open.length,
          value: open.reduce((sum, order) => sum + order.total, 0),
        }
      : null,
    awaiting: canOrders ? { count: placed.length + processing.length } : null,
    inventory: canInventory
      ? {
          rows: stock.length,
          units: stock.reduce((sum, row) => sum + row.available, 0),
          lowCount: needsRestock.length,
          outCount: stock.filter((row) => stockState(row) === "out").length,
        }
      : null,
    lowStock: canInventory ? needsRestock.slice(0, 4).map((row) => toAdminStock(store, row)) : [],
    team: canBranch ? { count: team.length, activeCount: team.filter((item) => item.status === "active").length } : null,
    attention,
    recentOrders: canOrders
      ? [...orders]
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          .slice(0, 5)
          .map((order) => toAdminOrder(store, order))
      : [],
  });
}

/**
 * BRANCH OPERATIONS — the boutique's own operating picture: who works here,
 * what stock it holds, what is open and what has been happening. Read-only:
 * enabling a branch, moving employees or governing the catalogue stay with
 * head office and the Super Admin.
 */
export function employeeBranchOperations(store, actor) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.BRANCHES_VIEW, "branch operations");
  const branchId = scope.branchId ?? defaultBranchId(store);
  const branch = branchOrFail(store, branchId);
  const day = businessDay(store);

  const orders = branchOrders(store, branchId);
  const today = orders.filter((order) => onBusinessDay(order.createdAt, day));
  const open = orders.filter((order) => OPEN_ORDER_STATUSES.includes(order.status));
  const awaiting = orders
    .filter((order) => order.status === "Placed" || order.status === "Processing")
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const stock = branchStockRows(store, branchId);
  const needsRestock = stock.filter((row) => stockState(row) !== "ok");

  const team = store.employees
    .filter((item) => item.branchId === branchId)
    .map((employee) => {
      const profile =
        store.capabilityProfiles.find((item) => item.id === employee.profileId) ?? null;
      return {
        id: employee.id,
        name: employee.name,
        role: employee.role,
        profileName: profile?.name ?? null,
        status: employee.status,
      };
    });

  const canOrders = hasScopeCapability(scope, CAPABILITIES.ORDERS_VIEW);
  const canInventory = hasScopeCapability(scope, CAPABILITIES.INVENTORY_VIEW);

  return emit({
    branch: employeeBranchSummary(branch),
    businessDay: day,
    team: {
      count: team.length,
      activeCount: team.filter((item) => item.status === "active").length,
      members: team,
    },
    /* Each block is present only for the capability that owns it — a branch
       view is not a licence to read the order book or the stock figures. */
    inventory: canInventory
      ? {
          rows: stock.length,
          units: stock.reduce((sum, row) => sum + row.available, 0),
          lowCount: needsRestock.length,
          outCount: stock.filter((row) => stockState(row) === "out").length,
          lowStock: needsRestock.slice(0, 5).map((row) => toAdminStock(store, row)),
        }
      : null,
    orders: canOrders
      ? {
          openCount: open.length,
          openValue: open.reduce((sum, order) => sum + order.total, 0),
          todayCount: today.length,
          ...summariseOrders(today),
          awaiting: awaiting.slice(0, 5).map((order) => toAdminOrder(store, order)),
        }
      : null,
    /* Inventory movements are stock data: without inventory visibility only
       the branch's audit trail remains in the feed. */
    activity: recentBranchActivity(store, branchId).filter(
      (entry) => canInventory || entry.kind === "audit"
    ),
  });
}

/**
 * BRANCH REPORTS (reports.view) — the branch's own numbers, computed from the
 * canonical order book and inventory: counter sales, the order book by status,
 * the pieces that actually move and stock health. Head-office comparisons,
 * other boutiques' performance and platform analytics are simply not part of
 * this contract.
 */
export function employeeReports(store, actor) {
  const scope = resolveStaffScope(store, actor);
  requireScopeCapability(scope, CAPABILITIES.REPORTS_VIEW, "reports");
  const branchId = scope.branchId ?? defaultBranchId(store);
  const branch = branchOrFail(store, branchId);
  const day = businessDay(store);
  const weekStart = daysBefore(day, 6);

  const orders = branchOrders(store, branchId);
  const stock = branchStockRows(store, branchId);
  const needsRestock = stock.filter((row) => stockState(row) !== "ok");

  const ordersByStatus = ORDER_STATUS_LIST.map((status) => {
    const list = orders.filter((order) => order.status === status);
    return {
      status,
      count: list.length,
      value: list.reduce((sum, order) => sum + order.total, 0),
    };
  });

  const byProduct = new Map();
  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    for (const item of order.items) {
      const entry = byProduct.get(item.id) ?? {
        productId: item.id,
        name: item.name,
        sku: item.sku,
        units: 0,
        revenue: 0,
      };
      entry.units += item.quantity;
      entry.revenue += item.price * item.quantity;
      byProduct.set(item.id, entry);
    }
  }

  const recentDays = [...Array(7)].map((_, index) => {
    const date = daysBefore(day, 6 - index);
    return {
      date,
      ...summariseOrders(orders.filter((order) => onBusinessDay(order.createdAt, date))),
    };
  });

  return emit({
    branch: employeeBranchSummary(branch),
    businessDay: day,
    sales: {
      today: summariseOrders(orders.filter((order) => onBusinessDay(order.createdAt, day))),
      week: summariseOrders(orders.filter((order) => String(order.createdAt).slice(0, 10) >= weekStart)),
      all: summariseOrders(orders),
    },
    ordersByStatus,
    recentDays,
    topProducts: [...byProduct.values()]
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 5),
    inventory: {
      rows: stock.length,
      units: stock.reduce((sum, row) => sum + row.available, 0),
      lowCount: needsRestock.length,
      outCount: stock.filter((row) => stockState(row) === "out").length,
      lowStock: needsRestock.slice(0, 5).map((row) => toAdminStock(store, row)),
    },
  });
}

/** MY PROFILE — the employee's own record, read-only apart from the phone number. */
export function employeeProfile(store, actor) {
  const scope = resolveStaffScope(store, actor);
  if (!scope.employee) return null;

  return emit({
    id: scope.employee.id,
    name: scope.employee.name,
    email: scope.employee.email,
    phone: scope.employee.phone,
    title: scope.employee.role,
    status: scope.employee.status,
    branch: employeeBranchSummary(scope.branch),
    profile: scope.profile
      ? {
          id: scope.profile.id,
          name: scope.profile.name,
          description: scope.profile.description,
        }
      : null,
    capabilities: describeCapabilities(scope.capabilities),
  });
}

/**
 * SELF-SERVICE UPDATE — the phone number, and nothing else. Role, branch,
 * capability profile and account status describe the employee's authority, so
 * they are head-office decisions: the provider refuses them here exactly as
 * the API will, rather than trusting a disabled field in the UI.
 */
export function updateEmployeeProfile(store, actor, patch = {}) {
  const scope = resolveStaffScope(store, actor);
  if (!scope.employee) fail("Only employee accounts have a counter profile.");

  const protectedFields = [
    "name",
    "email",
    "role",
    "branchId",
    "profileId",
    "capabilities",
    "status",
  ].filter((field) => patch[field] !== undefined);

  if (protectedFields.length > 0) {
    fail(
      "Only your phone number can be changed here — your branch, role, capabilities and account status are managed by head office."
    );
  }
  if (patch.phone === undefined) fail("Nothing to update.");

  const phone = String(patch.phone).trim();
  if (!hasText(phone) || !/^[+\d][\d\s-]{7,}$/.test(phone)) fail("Enter a valid phone number.");
  if (phone === scope.employee.phone) return employeeProfile(store, actor);

  scope.employee.phone = phone;
  appendAudit(store, {
    actor: scope.label,
    branchId: scope.branchId,
    action: "employee.profile.update",
    entityType: "employee",
    entityId: scope.employee.id,
    entityLabel: scope.employee.name,
    detail: "Contact number updated from the employee profile.",
  });
  return employeeProfile(store, actor);
}

/* ----------------------------------------------------------------------- */
/* Customer identity & account (Phase 11)                                   */
/* ----------------------------------------------------------------------- */
/**
 * CUSTOMER AUTHENTICATION + IDENTITY
 * ----------------------------------------------------------------------------
 * The customer directory (`store.customers`) doubles as the identity
 * registry; per-customer profiles, addresses and reset tokens live beside it.
 * The contract mirrors the future customer API one-to-one:
 *
 *   authenticateCustomer(store, { identifier, password })
 *   registerCustomer(store, { name, email, phone, password })
 *   resolveCustomerScope(store, customerId)
 *   getCustomerProfile(store, customerId)
 *   updateCustomerProfile(store, customerId, patch)
 *   listCustomerAddresses(store, customerId)
 *   addCustomerAddress(store, customerId, address)
 *   updateCustomerAddress(store, customerId, address)
 *   deleteCustomerAddress(store, customerId, addressId)
 *   setDefaultCustomerAddress(store, customerId, addressId)
 *   listCustomerOrders(store, customerId)
 *   getCustomerOrder(store, customerId, id)
 *   requestCustomerPasswordReset(store, identifier)
 *   resetCustomerPassword(store, { token, password })
 *
 * Ownership is ALWAYS derived from the authenticated customer id handed in
 * by the provider (which the provider itself resolved from its session —
 * never from a URL, a query string or a client claim). A record that does
 * not belong to the caller resolves to null / throws NOT_FOUND exactly as
 * the API will, without disclosing that it exists.
 *
 * Customer identity is a separate domain from staff RBAC: these functions
 * never issue roles, permissions or capabilities, and no staff function
 * accepts a customer id as authority.
 */

/** Stable machine-readable codes for customer-auth rejections. */
export const CUSTOMER_AUTH_CODES = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  PHONE_TAKEN: "PHONE_TAKEN",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  NOT_FOUND: "NOT_FOUND",
  RESET_FAILURE: "RESET_FAILURE",
};

export const CUSTOMER_PASSWORD_MIN_LENGTH = 8;

/** The public customer shape — `{ id, name, email, phone, status }` plus the
 *  membership summary the account masthead renders. Never the credential. */
export function toCustomerPublic(customer) {
  const record = withoutCredential(customer);
  if (!record) return null;
  return emit({
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    city: record.city ?? null,
    state: record.state ?? null,
    tier: record.tier ?? "Swarnova Classic",
    memberSince: record.memberSince ?? null,
    status: record.status ?? "active",
  });
}

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** Phone numbers compare on digits alone — "+91 98765 43210" and
 *  "919876543210" are the same account. */
function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

function isPhoneLike(value) {
  return /^[+\d][\d\s-]{7,}$/.test(String(value ?? "").trim());
}

function assertPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < CUSTOMER_PASSWORD_MIN_LENGTH
  ) {
    failWithCode(
      CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
      `Choose a password of at least ${CUSTOMER_PASSWORD_MIN_LENGTH} characters.`
    );
  }
}

/** Resolve an email address or phone number to its registry record. */
export function findCustomerByIdentifier(store, identifier) {
  const raw = String(identifier ?? "").trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    const email = normalizeEmail(raw);
    return (
      store.customers.find((item) => normalizeEmail(item.email) === email) ?? null
    );
  }
  const digits = normalizePhone(raw);
  if (!digits) return null;
  return (
    store.customers.find((item) => normalizePhone(item.phone) === digits) ?? null
  );
}

/**
 * Sign in with email-or-phone + password. Unknown identifiers and wrong
 * passwords reject identically — the response never discloses which half
 * failed, exactly as the API will.
 */
export function authenticateCustomer(store, credentials = {}) {
  const identifier = String(
    credentials.identifier ?? credentials.email ?? ""
  ).trim();
  const password = String(credentials.password ?? "");

  if (!identifier || !password) {
    failWithCode(
      CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
      "Enter your email or phone number and password."
    );
  }

  const record = findCustomerByIdentifier(store, identifier);
  if (!record || record.status === "disabled" || record.password !== password) {
    failWithCode(
      CUSTOMER_AUTH_CODES.INVALID_CREDENTIALS,
      "We could not sign you in with those details. Check your email or phone number and password, then try again."
    );
  }

  return { customer: toCustomerPublic(record) };
}

/**
 * Create a customer account. The new record joins the ONE canonical
 * directory, so the Admin and branch books see the customer immediately —
 * there is no separate registration database.
 */
export function registerCustomer(store, payload = {}) {
  const name = String(payload.name ?? "").trim();
  const email = String(payload.email ?? "").trim();
  const phone = String(payload.phone ?? "").trim();
  const password = String(payload.password ?? "");

  if (!hasText(name) || name.length < 2) {
    failWithCode(CUSTOMER_AUTH_CODES.VALIDATION_ERROR, "Enter your full name.");
  }
  if (!isEmailLike(email)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
      "Enter a valid email address."
    );
  }
  if (!isPhoneLike(phone)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
      "Enter a valid phone number."
    );
  }
  assertPassword(password);

  if (findCustomerByIdentifier(store, email)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.EMAIL_TAKEN,
      "An account already exists with this email address. Try signing in instead."
    );
  }
  if (findCustomerByIdentifier(store, phone)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.PHONE_TAKEN,
      "An account already exists with this phone number. Try signing in instead."
    );
  }

  store.counters.customer += 1;
  const memberSince = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
  const record = {
    id: `CUST-${store.counters.customer}`,
    name,
    email,
    phone,
    city: null,
    state: null,
    tier: "Swarnova Classic",
    memberSince,
    status: "active",
    password,
  };
  store.customers = [...store.customers, record];
  return { customer: toCustomerPublic(record) };
}

/**
 * Re-resolve the authenticated customer for every scoped call — the
 * customer-side twin of `resolveStaffScope`. An unknown, missing or
 * disabled id is an expired session, never an authorization decision the
 * client can influence.
 */
export function resolveCustomerScope(store, customerId) {
  const record =
    store.customers.find((item) => item.id === customerId) ?? null;
  if (!record || record.status === "disabled") {
    failWithCode(
      CUSTOMER_AUTH_CODES.SESSION_EXPIRED,
      "Your session has expired. Please sign in again."
    );
  }
  return record;
}

/** The rich profile the account experience renders; directory customers
 *  without a stored profile resolve a derived default, never null. */
export function getCustomerProfile(store, customerId) {
  const record = resolveCustomerScope(store, customerId);
  const stored = store.customerProfiles[record.id];
  if (stored) return emit(stored);
  return emit({
    id: record.id,
    name: record.name,
    email: record.email,
    phone: record.phone,
    dateOfBirth: "",
    preferences: { preferredMetal: "", ringSize: "", favouriteStyle: "" },
    memberSince: record.memberSince,
    tier: record.tier,
  });
}

/**
 * Update the caller's own profile. Membership facts (id, tier, memberSince)
 * are server-owned and ignored; email/phone changes are uniqueness-checked
 * and synced back to the directory record so the identity registry and the
 * profile never disagree.
 */
export function updateCustomerProfile(store, customerId, patch = {}) {
  const record = resolveCustomerScope(store, customerId);
  const current = getCustomerProfile(store, record.id);

  const next = {
    ...current,
    ...(patch.name !== undefined ? { name: String(patch.name).trim() } : {}),
    ...(patch.dateOfBirth !== undefined
      ? { dateOfBirth: String(patch.dateOfBirth) }
      : {}),
    preferences: {
      ...current.preferences,
      ...(patch.preferences || {}),
    },
  };

  if (!hasText(next.name) || next.name.length < 2) {
    failWithCode(CUSTOMER_AUTH_CODES.VALIDATION_ERROR, "Enter your full name.");
  }

  if (patch.email !== undefined && String(patch.email).trim() !== record.email) {
    const email = String(patch.email).trim();
    if (!isEmailLike(email)) {
      failWithCode(
        CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
        "Enter a valid email address."
      );
    }
    const clash = findCustomerByIdentifier(store, email);
    if (clash && clash.id !== record.id) {
      failWithCode(
        CUSTOMER_AUTH_CODES.EMAIL_TAKEN,
        "Another account already uses this email address."
      );
    }
    next.email = email;
    record.email = email;
  }

  if (patch.phone !== undefined && String(patch.phone).trim() !== record.phone) {
    const phone = String(patch.phone).trim();
    if (!isPhoneLike(phone)) {
      failWithCode(
        CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
        "Enter a valid phone number."
      );
    }
    const clash = findCustomerByIdentifier(store, phone);
    if (clash && clash.id !== record.id) {
      failWithCode(
        CUSTOMER_AUTH_CODES.PHONE_TAKEN,
        "Another account already uses this phone number."
      );
    }
    next.phone = phone;
    record.phone = phone;
  }

  record.name = next.name;
  store.customerProfiles[record.id] = emit(next);
  return emit(next);
}

/* ---------------- Customer addresses (scoped) ---------------- */

function scopedAddresses(store, customerId) {
  resolveCustomerScope(store, customerId);
  return store.customerAddresses[customerId] ?? [];
}

export function listCustomerAddresses(store, customerId) {
  return emit(scopedAddresses(store, customerId));
}

function assertAddressShape(address = {}) {
  const required = [
    ["name", "Enter the recipient name."],
    ["phone", "Enter a contact number for this address."],
    ["line1", "Enter the street address."],
    ["city", "Enter the city."],
    ["state", "Enter the state."],
    ["postalCode", "Enter the postal code."],
  ];
  for (const [field, message] of required) {
    if (!hasText(address[field])) {
      failWithCode(CUSTOMER_AUTH_CODES.VALIDATION_ERROR, message);
    }
  }
  if (!isPhoneLike(address.phone)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.VALIDATION_ERROR,
      "Enter a valid contact number for this address."
    );
  }
}

export function addCustomerAddress(store, customerId, address = {}) {
  resolveCustomerScope(store, customerId);
  assertAddressShape(address);

  const list = scopedAddresses(store, customerId);
  store.counters.address += 1;
  const record = {
    ...address,
    id: `ADDR-${String(store.counters.address).padStart(3, "0")}`,
    country: address.country || "India",
    isDefault: Boolean(address.isDefault || list.length === 0),
  };
  store.customerAddresses[customerId] = record.isDefault
    ? [record, ...list.map((item) => ({ ...item, isDefault: false }))]
    : [...list, record];
  return emit(record);
}

export function updateCustomerAddress(store, customerId, address = {}) {
  resolveCustomerScope(store, customerId);
  const list = scopedAddresses(store, customerId);
  /* A foreign id resolves as missing — never as someone else's address. */
  if (!address.id || !list.some((item) => item.id === address.id)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.NOT_FOUND,
      "We could not find that address."
    );
  }
  const merged = { ...list.find((item) => item.id === address.id), ...address };
  assertAddressShape(merged);
  store.customerAddresses[customerId] = list.map((item) =>
    item.id === address.id
      ? merged
      : address.isDefault
        ? { ...item, isDefault: false }
        : item
  );
  return emit(merged);
}

export function deleteCustomerAddress(store, customerId, addressId) {
  resolveCustomerScope(store, customerId);
  const list = scopedAddresses(store, customerId);
  if (!list.some((item) => item.id === addressId)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.NOT_FOUND,
      "We could not find that address."
    );
  }
  const target = list.find((item) => item.id === addressId);
  const rest = list.filter((item) => item.id !== addressId);
  if (target?.isDefault && rest.length > 0) rest[0].isDefault = true;
  store.customerAddresses[customerId] = rest;
  return emit(addressId);
}

export function setDefaultCustomerAddress(store, customerId, addressId) {
  resolveCustomerScope(store, customerId);
  const list = scopedAddresses(store, customerId);
  if (!list.some((item) => item.id === addressId)) {
    failWithCode(
      CUSTOMER_AUTH_CODES.NOT_FOUND,
      "We could not find that address."
    );
  }
  store.customerAddresses[customerId] = list.map((item) => ({
    ...item,
    isDefault: item.id === addressId,
  }));
  return emit(store.customerAddresses[customerId]);
}

/* ---------------- Customer orders (scoped) ---------------- */

/** The caller's own slice of the ONE canonical order book, most recent first. */
export function listCustomerOrders(store, customerId) {
  resolveCustomerScope(store, customerId);
  return emit(
    store.orders
      .filter((order) => order.customerId === customerId)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  );
}

/**
 * One order by id or order number — resolved to null unless it belongs to
 * the caller, exactly as a 404 would. Ownership is never taken from the URL.
 */
export function getCustomerOrder(store, customerId, id) {
  resolveCustomerScope(store, customerId);
  const order = store.orders.find(
    (item) =>
      (item.id === id || item.orderNumber === id) &&
      item.customerId === customerId
  );
  return emit(order ?? null);
}

/* ----------------------------------------------------------------------- */
/* Customer checkout (Phase 12)                                             */
/* ----------------------------------------------------------------------- */
/**
 * The commerce boundary between the shopping bag and the canonical order
 * book. Everything a future backend must enforce, the store enforces here:
 * authenticated session, cart validity, product purchasability, quantity,
 * price currency, address OWNERSHIP (a supplied address id is a claim to
 * verify, never authority), delivery/payment method validity, payment
 * detail presence and inventory availability — then, and only then, the
 * payment is settled through the provider-independent processor, ONE order
 * is created in the canonical book with a full commercial snapshot, the
 * branch inventory takes its minimal allocation effect, and the audit trail
 * records the placement. A retried idempotency key replays its original
 * result instead of creating a second order.
 */

/** Machine-readable checkout rejections — mirrors `checkoutErrors.js`. */
export const CHECKOUT_CODES = {
  SESSION_EXPIRED: "SESSION_EXPIRED",
  CART_EMPTY: "CART_EMPTY",
  PRODUCT_UNAVAILABLE: "PRODUCT_UNAVAILABLE",
  INVALID_QUANTITY: "INVALID_QUANTITY",
  PRICE_UNAVAILABLE: "PRICE_UNAVAILABLE",
  ADDRESS_REQUIRED: "ADDRESS_REQUIRED",
  ADDRESS_NOT_FOUND: "ADDRESS_NOT_FOUND",
  DELIVERY_METHOD_INVALID: "DELIVERY_METHOD_INVALID",
  PAYMENT_METHOD_INVALID: "PAYMENT_METHOD_INVALID",
  PAYMENT_INFO_REQUIRED: "PAYMENT_INFO_REQUIRED",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  PAYMENT_DECLINED: "PAYMENT_DECLINED",
};

const UPI_PATTERN = /^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/;

/** The deterministic mock-decline: a UPI handle beginning with the fixture's
 *  documented decline prefix is declined; every other checkout settles. See
 *  `mock/data/checkout` (`checkoutScenarios.declinedUpiPrefix`). */
function isDeclinedUpi(upiId) {
  const prefix = db.checkoutScenarios?.declinedUpiPrefix ?? "fail";
  return new RegExp(`^${prefix}`, "i").test(String(upiId ?? "").trim());
}

/** Validated checkout lines — canonical products only, never client prices. */
function checkoutLines(store, requestedItems) {
  if (!Array.isArray(requestedItems) || requestedItems.length === 0) {
    failWithCode(
      CHECKOUT_CODES.CART_EMPTY,
      "Your shopping bag is empty. Add a piece before checking out."
    );
  }

  const lines = [];
  const issues = [];
  for (const entry of requestedItems) {
    const productId = String(entry?.id ?? "").trim();
    if (!productId) continue;
    const quantity = Number(entry?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      issues.push({
        code: CHECKOUT_CODES.INVALID_QUANTITY,
        productId,
        message: "Choose a valid quantity for this piece.",
      });
      continue;
    }
    /* Purchasable = a published canonical piece. Draft/rejected lifecycle
       records resolve exactly like unknown ids — the storefront can never
       buy what the catalogue has not published. */
    const product = store.products.find(
      (item) => item.id === productId && item.status === "published"
    );
    if (!product) {
      issues.push({
        code: CHECKOUT_CODES.PRODUCT_UNAVAILABLE,
        productId,
        message: "One of the pieces in your bag is no longer available.",
      });
      continue;
    }
    if (!(typeof product.price === "number" && product.price > 0)) {
      issues.push({
        code: CHECKOUT_CODES.PRICE_UNAVAILABLE,
        productId,
        message: "A price for one of your pieces could not be confirmed.",
      });
      continue;
    }
    lines.push({ product, quantity });
  }

  if (lines.length === 0 && issues.length === 0) {
    failWithCode(
      CHECKOUT_CODES.CART_EMPTY,
      "Your shopping bag is empty. Add a piece before checking out."
    );
  }
  return { lines, issues };
}

function branchStockRow(store, branchId, productId) {
  return (
    store.inventory.find(
      (row) => row.branchId === branchId && row.productId === productId
    ) ?? null
  );
}

/**
 * Fulfilment resolution — the store, not the client, decides the fulfilling
 * boutique. A branch qualifies when it holds every line's quantity free
 * (`available`); the first canonical candidate fulfils. A client-supplied
 * branch id is never trusted, so there is nothing to forge.
 */
function resolveFulfilment(store, lines) {
  const branches = store.branches.filter((b) => b.status !== "disabled");
  const fulfilment =
    branches.find((branch) =>
      lines.every(({ product, quantity }) => {
        const row = branchStockRow(store, branch.id, product.id);
        return row && row.available >= quantity;
      })
    ) ?? null;

  const availability = lines.map(({ product, quantity }) => {
    const row = fulfilment
      ? branchStockRow(store, fulfilment.id, product.id)
      : null;
    const networkAvailable = branches.reduce(
      (max, branch) =>
        Math.max(max, branchStockRow(store, branch.id, product.id)?.available ?? 0),
      0
    );
    return {
      productId: product.id,
      quantity,
      available: row?.available ?? networkAvailable,
      fulfilled: Boolean(row && row.available >= quantity),
    };
  });

  return { fulfilment, availability, satisfiable: Boolean(fulfilment) };
}

function availabilityFor(availability, productId) {
  return availability.find((item) => item.productId === productId) ?? null;
}

/** The checkout summary — a read-only quote of what the bag can become. */
export function getCheckoutSummary(store, customerId, requestedItems) {
  resolveCustomerScope(store, customerId);

  const { lines, issues } = checkoutLines(store, requestedItems);
  const { fulfilment, availability, satisfiable } = resolveFulfilment(store, lines);

  if (lines.length > 0 && !satisfiable) {
    const shortfall = lines
      .filter(({ product, quantity }) => {
        const info = availabilityFor(availability, product.id);
        return !info || info.available < quantity;
      })
      .map(({ product, quantity }) => {
        const info = availabilityFor(availability, product.id);
        return `${product.name} — ${info?.available ?? 0} available, ${quantity} requested`;
      })
      .join("; ");
    issues.unshift({
      code: CHECKOUT_CODES.OUT_OF_STOCK,
      message: `We cannot fulfil this bag from boutique stock at the moment (${shortfall}). Adjust the quantity or check back soon.`,
    });
  }

  const delivery = db.deliveryMethods[0] ?? null;

  const totals = calculateTotals({
    items: lines.map(({ product, quantity }) => ({
      unitPrice: product.price,
      quantity,
    })),
    deliveryCharge: delivery?.charge ?? 0,
  });

  return emit({
    items: lines.map(({ product, quantity }) => {
      const info = availabilityFor(availability, product.id);
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        purity: product.purity,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
        image: product.images[0] ? { ...product.images[0] } : null,
        href: product.href,
        available: info?.available ?? 0,
        stockOk: Boolean(info?.fulfilled),
      };
    }),
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    totals,
    delivery: delivery ? { ...delivery } : null,
    fulfilment: fulfilment
      ? {
          branchId: fulfilment.id,
          branchName: fulfilment.name,
          city: fulfilment.city,
        }
      : null,
    ready: lines.length > 0 && issues.length === 0,
    issues,
  });
}

/** The canonical order-book label for a checkout payment method. */
function orderPaymentLabel(method) {
  return method.orderMethodLabel ?? (method.mode === "prepaid" ? `Prepaid · ${method.label}` : method.label);
}

/**
 * The mock payment processor — the seam a real gateway occupies. The UI
 * names a canonical method and its client-safe detail; the processor alone
 * decides the outcome. Deterministic: everything settles except the
 * documented "fail…" UPI handle. No credential ever reaches this function,
 * and no PAN/CVV shape exists anywhere in the contract.
 */
function processCheckoutPayment(method, amount, detail) {
  if (method.id === "upi") {
    const upiId = String(detail?.upiId ?? "").trim();
    if (!UPI_PATTERN.test(upiId)) {
      failWithCode(
        CHECKOUT_CODES.PAYMENT_INFO_REQUIRED,
        "Enter the UPI ID you would like to pay from — for example, yourname@bank."
      );
    }
    if (isDeclinedUpi(upiId)) {
      failWithCode(
        CHECKOUT_CODES.PAYMENT_DECLINED,
        "Your bank declined this UPI payment. No order was created and nothing was charged — try another UPI ID or payment method."
      );
    }
  }

  return {
    id: `PAY-${Date.now()}`,
    method: method.id,
    label: orderPaymentLabel(method),
    status: "success",
    amount,
    at: now(),
  };
}

/**
 * Place an order — the one domain operation of checkout. Validates the full
 * business boundary, settles payment, writes the snapshot into the canonical
 * order book, takes the minimal inventory allocation and audits the act.
 * `idempotencyKey` replays the original result for a duplicate submission.
 */
export function placeCheckoutOrder(store, customerId, payload = {}) {
  const record = resolveCustomerScope(store, customerId);

  const idempotencyKey = String(payload.idempotencyKey ?? "").trim();
  if (idempotencyKey && store.checkoutKeys[idempotencyKey]) {
    const replay = store.checkoutKeys[idempotencyKey];
    const order = store.orders.find((item) => item.id === replay.orderId);
    if (order) {
      return { order: emit(order), payment: emit(replay.payment), replay: true };
    }
  }

  /* 1 · The bag — valid, purchasable, correctly quantified lines only. */
  const { lines, issues } = checkoutLines(store, payload.items);
  if (issues.length > 0) {
    failWithCode(issues[0].code, issues[0].message);
  }

  /* 2 · The address — must exist in THIS customer's own address book. */
  const addressId = String(payload.addressId ?? "").trim();
  if (!addressId) {
    failWithCode(
      CHECKOUT_CODES.ADDRESS_REQUIRED,
      "Choose a delivery address to continue."
    );
  }
  const address = scopedAddresses(store, customerId).find(
    (item) => item.id === addressId
  );
  if (!address) {
    failWithCode(
      CHECKOUT_CODES.ADDRESS_NOT_FOUND,
      "We could not use that delivery address. Please choose one of your saved addresses."
    );
  }

  /* 3 · The delivery method — must be a canonical method. */
  const delivery = db.deliveryMethods.find(
    (item) => item.id === payload.deliveryMethod
  );
  if (!delivery) {
    failWithCode(
      CHECKOUT_CODES.DELIVERY_METHOD_INVALID,
      "Choose one of the available delivery methods."
    );
  }

  /* 4 · The payment method — must be a canonical method… */
  const paymentMethod = db.paymentMethods.find(
    (item) => item.id === payload.paymentMethod
  );
  if (!paymentMethod) {
    failWithCode(
      CHECKOUT_CODES.PAYMENT_METHOD_INVALID,
      "Choose one of the available payment methods."
    );
  }

  /* 5 · Fulfilment — one boutique must hold every line in free stock. */
  const { fulfilment, availability, satisfiable } = resolveFulfilment(store, lines);
  if (!satisfiable) {
    const shortfall = lines
      .map(({ product, quantity }) => {
        const info = availabilityFor(availability, product.id);
        return `${product.name} — ${info?.available ?? 0} available`;
      })
      .join("; ");
    failWithCode(
      CHECKOUT_CODES.OUT_OF_STOCK,
      `We cannot fulfil this bag from boutique stock at the moment (${shortfall}). Adjust the quantity and try again.`
    );
  }

  /* 6 · The amount — calculated once, here, from canonical prices. */
  const totals = calculateTotals({
    items: lines.map(({ product, quantity }) => ({
      unitPrice: product.price,
      quantity,
    })),
    deliveryCharge: delivery.charge,
  });

  /* 7 · Payment — settled before the order exists; a decline creates nothing. */
  const payment = processCheckoutPayment(
    paymentMethod,
    totals.grandTotal,
    payload.paymentDetail
  );

  /* 8 · The canonical order — a full commercial snapshot. */
  store.counters.order += 1;
  const sequence = store.counters.order;
  const order = {
    id: `ORD-2026-${sequence}`,
    orderNumber: `SWN-${sequence}-IN`,
    createdAt: now(),
    status: "Placed",
    customerId,
    branchId: fulfilment.id,
    paymentStatus: "paid",
    items: lines.map(({ product, quantity }) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      purity: product.purity,
      price: product.price,
      quantity,
      image: product.images[0] ? { ...product.images[0] } : null,
      href: product.href,
    })),
    subtotal: totals.subtotal,
    shipping: totals.deliveryCharge,
    taxAmount: totals.taxAmount,
    total: totals.grandTotal,
    deliveryMethod: delivery.id,
    shippingAddress: {
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "India",
    },
    paymentMethod: orderPaymentLabel(paymentMethod),
    courier: delivery.courier,
    trackingNumber: null,
  };
  store.orders = [order, ...store.orders];

  /* 9 · Inventory — the minimal allocation the model asks for: pieces move
     from free stock to reserved against the new open order, and the
     movement log records the allocation exactly as the branch book does. */
  for (const line of lines) {
    const row = branchStockRow(store, fulfilment.id, line.product.id);
    if (!row || row.available < line.quantity) {
      failWithCode(
        CHECKOUT_CODES.OUT_OF_STOCK,
        "Stock changed while your order was being placed. Please review your bag and try again."
      );
    }
    row.available -= line.quantity;
    row.reserved += line.quantity;
    store.counters.movement += 1;
    store.inventoryMovements = [
      {
        id: `MV-2026-${String(store.counters.movement).padStart(4, "0")}`,
        stockId: row.id,
        type: "sale",
        delta: -line.quantity,
        at: now(),
        by: `${record.name} — Storefront`,
        note: `Allocated to order ${order.orderNumber}.`,
      },
      ...store.inventoryMovements,
    ].slice(0, 200);
  }

  /* 10 · The audit trail and the idempotency ledger. */
  appendAudit(store, {
    actor: `${record.name} — Storefront`,
    branchId: fulfilment.id,
    action: "order.place",
    entityType: "order",
    entityId: order.id,
    entityLabel: order.orderNumber,
    detail: `Checkout order placed — ${order.items.length} piece(s), ${order.paymentMethod}. Fulfilled by ${fulfilment.name}.`,
  });

  if (idempotencyKey) {
    store.checkoutKeys[idempotencyKey] = {
      orderId: order.id,
      payment: emit(payment),
      at: now(),
    };
  }

  return { order: emit(order), payment: emit(payment), replay: false };
}

/* ---------------- Password reset (mock contract) ---------------- */

/**
 * Request a reset for an email or phone number. ALWAYS resolves
 * `{ requested: true }` — the response never discloses whether an account
 * exists for the identifier, exactly as the API will.
 *
 * `devReference` is mock-only: the deterministic stand-in for the token the
 * real email/SMS channel would deliver, shown solely inside the same
 * explicit "Demo access" disclosure the staff login uses. The API provider
 * omits it; UI treats it as optional.
 */
export function requestCustomerPasswordReset(store, identifier) {
  const record = findCustomerByIdentifier(store, identifier);
  if (!record || record.status === "disabled") {
    return { requested: true, devReference: null };
  }
  store.counters.reset += 1;
  const token = `SWN-RST-${record.id.replace(/\D/g, "").slice(-4)}-${String(
    store.counters.reset
  ).padStart(4, "0")}`;
  store.customerResetTokens[token] = {
    token,
    customerId: record.id,
    createdAt: now(),
    usedAt: null,
  };
  return { requested: true, devReference: token };
}

/**
 * Consume a reset token. The token is single-use and opaque to the UI — it
 * is never validated client-side, only handed to the provider, which is the
 * authority here exactly as the backend will be.
 */
export function resetCustomerPassword(store, payload = {}) {
  const token = String(payload.token ?? "").trim();
  const entry = store.customerResetTokens[token];
  if (!token || !entry || entry.usedAt) {
    failWithCode(
      CUSTOMER_AUTH_CODES.RESET_FAILURE,
      "This reset link is invalid or has already been used. Request a new one to continue."
    );
  }
  assertPassword(String(payload.password ?? ""));
  const record =
    store.customers.find((item) => item.id === entry.customerId) ?? null;
  if (!record || record.status === "disabled") {
    failWithCode(
      CUSTOMER_AUTH_CODES.RESET_FAILURE,
      "This reset link is invalid or has already been used. Request a new one to continue."
    );
  }
  record.password = String(payload.password);
  entry.usedAt = now();
  return { reset: true };
}
