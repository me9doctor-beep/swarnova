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
 */
import * as db from "../../../mock/data/index.js";

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
    auditLog: emit(db.governanceAuditLog),
    settings: emit(db.platformSettings),
    counters: {
      product: highestSequence(products, "JWL-"),
      media: highestSequence(media, "MED-"),
      audit: 0,
    },
  };
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

export function updateGovernanceProduct(store, id, data = {}) {
  const product = findProduct(store, id);
  const updated = applyProductPatch(store, product, data);
  appendAudit(store, {
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
export function transitionGovernanceProduct(store, id, action, payload = {}) {
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

export function updateHomepageSection(store, id, patch = {}) {
  const section = store.homepage.sections.find((item) => item.id === id);
  if (!section) fail(`Homepage section ${id} could not be found.`);

  if (patch.enabled !== undefined) section.enabled = Boolean(patch.enabled);

  appendAudit(store, {
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

export function updateCampaignStatus(store, id, status) {
  if (!["active", "paused"].includes(status)) fail(`“${status}” is not a campaign status.`);
  const campaign = store.campaigns.find((item) => item.id === id);
  if (!campaign) fail(`Campaign ${id} could not be found.`);

  campaign.status = status;
  appendAudit(store, {
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

export function createGovernanceAdmin(store, data = {}) {
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
      return { ...employee, branchName: branch?.name ?? null };
    })
  );
}

export function updateGovernanceEmployee(store, id, patch = {}) {
  const employee = store.employees.find((item) => item.id === id);
  if (!employee) fail(`Employee ${id} could not be found.`);
  if (patch.status !== undefined) {
    employee.status = patch.status === "disabled" ? "disabled" : "active";
  }
  appendAudit(store, {
    action: "employee.update",
    entityType: "employee",
    entityId: id,
    entityLabel: employee.name,
    detail:
      employee.status === "disabled"
        ? "Employee marked inactive at platform level."
        : "Employee marked active.",
  });
  return emit(employee);
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
