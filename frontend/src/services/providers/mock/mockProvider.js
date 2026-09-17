/**
 * MOCK DATA PROVIDER
 * -----------------------------------------------------------------------------
 * The only place in the application that reads `src/mock/`.
 *
 * Implements the same provider interface a future API provider
 * (`services/providers/api/apiProvider.js`) will expose. The UI depends only on
 * this interface — replacing these methods with `fetch()` calls to the Swarnova
 * backend requires no changes to components, pages, hooks or services.
 *
 * Interface (all methods are async):
 *   getSite()
 *   getHomepage()
 *   getCategories()
 *   getCollections()
 *   getProducts(query)
 *   getProduct(id)
 *   getBranches(query)
 *   getJournalArticles(query)
 *   getActiveCampaign()
 *   getGoldRateBoard()
 *   getAiStudio()
 *   getAiAtelier()
 *   generateAiDesign(request)
 *   createAiVariations(conceptId)
 *   refineAiDesign(request)
 *   getTryOnRoom()
 *   getTryOnSource(source)
 *   createTryOn(request)
 *
 * The virtual try-on methods are the shared fitting-room contract (Phase 6)
 * a future AI/virtual-try-on backend fulfils one-to-one:
 *   getTryOnSource({ sourceType, sourceId })     → source summary or null
 *   createTryOn({ sourceType, sourceId, photo }) → try-on result
 *
 * getProducts(query) is the catalogue query contract — the same parameters a
 * future API provider will accept, one-to-one:
 *   { categoryId, collectionId, featured, bestseller, tryOnAvailable,
 *     availability, priceMin, priceMax, search, sort, limit }
 *
 * The AI studio methods are the generation contract a future AI backend
 * fulfils one-to-one:
 *   generateAiDesign({ prompt, jewelleryType, style, occasion, purity })
 *   createAiVariations(conceptId)   →  { id, images }
 *   refineAiDesign({ conceptId, feedback, purity })
 *
 * All generation behaviour lives here — the presentation layer only renders
 * the concept shape the provider resolves with.
 *
 * getProduct(id) is the single-piece query — the shape of a future
 * `GET /products/:id`. An unknown id resolves to `null` rather than rejecting,
 * exactly as a 404 would, so the screen can render its own not-found state.
 *
 * GOVERNANCE (Phase 8) — the Super Admin contract, fulfilled by the shared
 * governance store (`governanceStore.js`). The store holds ONE canonical,
 * mutable copy of the governed domains; the customer-facing getters above
 * read from the same store, so publishing a product or disabling a category
 * takes effect across the platform with no duplicate database:
 *
 *   getPlatformOverview()            getGovernanceProducts(query)
 *   getGovernanceProduct(id)         createGovernanceProduct(data)
 *   updateGovernanceProduct(id, d)   transitionGovernanceProduct(id, action, payload)
 *   getMediaLibrary(query)           uploadMediaAsset(file)
 *   attachMediaToProduct(id, pid, slot)   deleteMediaAsset(id)
 *   getGovernanceCategories()        createGovernanceCategory(data)
 *   updateGovernanceCategory(id, d)  getGovernanceCollections()
 *   createGovernanceCollection(d)    updateGovernanceCollection(id, d)
 *   getGovernanceHomepage()          updateHomepageSection(id, patch)
 *   moveHomepageSection(id, dir)     getGovernanceCampaigns()
 *   updateCampaignStatus(id, s)      getGovernanceBranches()
 *   setBranchStatus(id, s)           getGovernanceAdmins()
 *   createGovernanceAdmin(d)         updateGovernanceAdmin(id, d)
 *   getGovernanceEmployees()         updateGovernanceEmployee(id, d)
 *   updateGoldRates(rates)           getPlatformSettings()
 *   updatePlatformSettings(patch)    getAuditLogs(query)
 *
 * ADMIN / HEAD OFFICE OPERATIONS (Phase 9) — the business-operations
 * contract, fulfilled by the SAME shared governance store. One staff login
 * serves every staff role; orders, customers, inventory, branches,
 * employees, reports and the business overview all read the canonical
 * entities:
 *   authenticateStaff(credentials)   getAdminOverview()
 *   getAdminOrders(query)            getAdminOrder(id)
 *   updateAdminOrderStatus(id, s, actor)   getAdminCustomers(query)
 *   getAdminCustomer(id)             getAdminInventory(query)
 *   adjustInventoryStock(id, adj, actor)   getInventoryMovements(query)
 *   getBranchOperations()            getAdminReports()
 *   getCapabilityProfiles()          createGovernanceEmployee(d, actor)
 *
 * CUSTOMER IDENTITY (Phase 11) — the customer authentication contract,
 * fulfilled by the SAME shared governance store. The mock holds the session
 * as the authenticated customer id (in memory, mirrored to local storage so
 * a refresh keeps the customer signed in — the API provider resolves the
 * same identity from its own session/token instead). Every account read and
 * write below re-resolves ownership from that session id store-side:
 *   authenticateCustomer(credentials)  registerCustomer(payload)
 *   getCurrentCustomer()               logoutCustomer()
 *   requestCustomerPasswordReset(id)   resetCustomerPassword(payload)
 *
 * CHECKOUT (Phase 12) — the commerce contract between the shopping bag and
 * the canonical order book, fulfilled by the SAME shared governance store.
 * The store enforces the entire business boundary (session, cart, product,
 * quantity, price currency, address ownership, delivery/payment method,
 * inventory) before ONE order enters the book with its full commercial
 * snapshot; the payment processor is the gateway seam the API provider
 * replaces one-to-one:
 *   getDeliveryMethods()               getPaymentMethods()
 *   getCheckoutSummary(items)          placeOrder(payload)
 */
import * as db from "../../../mock/data/index.js";
import * as gov from "./governanceStore.js";

/** Reuse the governance store's detached-copy helper. */
const emit = gov.emit;

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

/* --------------------------------------------------------------------------
 * AI atelier — mock generation
 * --------------------------------------------------------------------------
 * The mock "renders" a concept by choosing from the atelier's design library
 * (`mock/data/ai`). Structured options weigh more than prompt keywords, and
 * ties resolve to the library's own order, so the same request always
 * resolves to the same concept — deterministic, like a backend would be.
 * A short latency makes the atelier's static creation state readable.
 * ------------------------------------------------------------------------ */
const AI_RENDER_DELAY = 900;
/* Checkout quotes settle quickly; placing an order takes a readable moment
   so the processing state is honest rather than decorative. */
const CHECKOUT_READ_DELAY = 350;
const CHECKOUT_PLACE_DELAY = 900;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildConcept(design, promptSummary, purity) {
  return {
    id: design.id,
    title: design.title,
    promptSummary,
    category: design.category,
    style: design.style,
    occasion: design.occasion,
    purity: purity || design.purity,
    status: "completed",
    story: design.story,
    images: [{ ...design.image }],
  };
}

function matchDesign(request) {
  const prompt = String(request.prompt ?? "").toLowerCase();

  let best = null;
  let bestScore = -Infinity;
  for (const design of db.aiDesigns) {
    let score = 0;
    if (request.jewelleryType) score += design.category === request.jewelleryType ? 6 : -4;
    if (request.style) score += design.style === request.style ? 3 : 0;
    if (request.occasion) score += design.occasion === request.occasion ? 3 : 0;
    for (const keyword of design.keywords) {
      if (prompt.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      best = design;
      bestScore = score;
    }
  }
  return best;
}

/* --------------------------------------------------------------------------
 * Virtual try-on — mock fitting room
 * --------------------------------------------------------------------------
 * The mock "dresses" a portrait by resolving a prepared wearing plate for
 * the curated sample portraits; an uploaded photograph resolves to itself —
 * exactly the shape a future try-on backend's render replaces. Source
 * resolution runs through the same db the rest of the provider reads, so an
 * ineligible or unknown piece resolves to null, exactly as a 404 would.
 * ------------------------------------------------------------------------ */
const TRYON_RENDER_DELAY = 1400;
/* The fitting room occasionally cannot prepare a preview, so the failure
   path behaves as it will against a real backend: photo and jewellery stay
   put, and Try Again re-renders. */
const TRYON_FAILURE_RATE = 0.08;

function categoryLabel(categoryKey) {
  const category = db.categories.find(
    (item) => item.id === categoryKey || item.slug === categoryKey
  );
  return category?.name;
}

/** An atelier concept, summarised as the jewellery the room dresses. */
function jewelleryFromDesign(design) {
  return {
    id: design.id,
    name: design.title,
    category: categoryLabel(design.category),
    purity: design.purity,
    images: [{ ...design.image }],
  };
}

/** A catalogue piece, summarised as the jewellery the room dresses. Carries
 *  the commerce fields only a purchasable product owns. */
function jewelleryFromProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: categoryLabel(product.categoryId),
    purity: product.purity,
    images: product.images.map((image) => ({ ...image })),
    price: product.price,
    currency: product.currency,
    availability: product.availability,
    href: product.href,
  };
}

function resolveTryOnSource(sourceType, sourceId, products = db.products) {
  if (sourceType === "ai-design") {
    const design = db.aiDesigns.find((item) => item.id === sourceId);
    if (!design) return null;
    return { sourceType, sourceId, jewellery: jewelleryFromDesign(design) };
  }
  if (sourceType === "product") {
    const product = products.find((item) => item.id === sourceId);
    /* Only genuinely eligible pieces enter the room — an ineligible product
       resolves to null exactly like an unknown one. */
    if (!product || !product.tryOnAvailable || product.status !== "published") return null;
    return { sourceType, sourceId, jewellery: jewelleryFromProduct(product) };
  }
  return null;
}

/**
 * The mock customer session — the authenticated customer id, and nothing
 * else. No token, no secret, no credential is ever persisted: the id alone
 * re-resolves the session against the canonical store, exactly as a backend
 * session cookie re-resolves server-side. Every access is guarded so the
 * provider also loads outside a browser (tests, SSR).
 */
const CUSTOMER_SESSION_KEY = "swarnova.customer.session";

function readStoredCustomerSession() {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(CUSTOMER_SESSION_KEY);
  } catch {
    return null;
  }
}

function writeStoredCustomerSession(customerId) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(CUSTOMER_SESSION_KEY, customerId);
  } catch {
    /* Private browsing etc. — the in-memory session still holds for the visit. */
  }
}

function clearStoredCustomerSession() {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
  } catch {
    /* Nothing sensitive was stored; nothing leaks. */
  }
}

/** Product orderings the contract supports. "featured" is the default. */
const PRODUCT_SORTS = {
  featured: (a, b) =>
    Number(b.bestseller) - Number(a.bestseller) ||
    Number(b.featured) - Number(a.featured) ||
    a.name.localeCompare(b.name),
  "price-asc": (a, b) => a.price - b.price || a.name.localeCompare(b.name),
  "price-desc": (a, b) => b.price - a.price || a.name.localeCompare(b.name),
};

export const mockProvider = {
  name: "mock",

  /* ----------------------------------------------------------------------
   * The one canonical store. Lazily created once per page load; every
   * governed domain (customer reads AND Super Admin writes) flows through
   * it, so a governance action is immediately visible platform-wide.
   * -------------------------------------------------------------------- */
  _store: null,
  getStore() {
    if (!this._store) this._store = gov.createGovernanceStore();
    return this._store;
  },

  getSite() {
    return Promise.resolve(emit(db.site));
  },

  getHomepage() {
    const homepage = emit(this.getStore().homepage);
    homepage.sections = homepage.sections
      .filter((section) => section.enabled !== false)
      .sort(byOrder);
    return Promise.resolve(homepage);
  },

  getCategories() {
    return Promise.resolve(
      emit(this.getStore().categories.filter((c) => c.enabled !== false).sort(byOrder))
    );
  },

  getCollections() {
    return Promise.resolve(emit(this.getStore().collections));
  },

  getProducts(query = {}) {
    /* The storefront only ever sees published pieces — the lifecycle states
       belong to the governance experience. */
    let list = this.getStore().products.filter((p) => p.status === "published");

    if (query.categoryId) list = list.filter((p) => p.categoryId === query.categoryId);
    if (query.collectionId) list = list.filter((p) => p.collectionId === query.collectionId);
    if (query.featured) list = list.filter((p) => p.featured);
    if (query.bestseller) list = list.filter((p) => p.bestseller);
    if (query.tryOnAvailable) list = list.filter((p) => p.tryOnAvailable);
    if (query.availability) list = list.filter((p) => p.availability === query.availability);
    if (query.priceMin != null) list = list.filter((p) => p.price >= query.priceMin);
    if (query.priceMax != null) list = list.filter((p) => p.price <= query.priceMax);
    if (query.search) {
      const term = String(query.search).toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
      );
    }

    list.sort(PRODUCT_SORTS[query.sort] ?? PRODUCT_SORTS.featured);

    if (typeof query.limit === "number") list = list.slice(0, query.limit);
    return Promise.resolve(emit(list));
  },

  getProduct(id) {
    return Promise.resolve(
      emit(
        this.getStore().products.find(
          (product) => product.id === id && product.status === "published"
        ) ?? null
      )
    );
  },

  getBranches(query = {}) {
    let list = this.getStore().branches.filter((b) => b.status !== "disabled");
    if (query.featured) list = list.filter((b) => b.featured);
    if (typeof query.limit === "number") list = list.slice(0, query.limit);
    return Promise.resolve(emit(list));
  },

  getJournalArticles(query = {}) {
    let list = [...db.journalArticles];
    if (typeof query.limit === "number") list = list.slice(0, query.limit);
    return Promise.resolve(emit(list));
  },

  getActiveCampaign() {
    return Promise.resolve(emit(db.getActiveCampaign(this.getStore().campaigns)));
  },

  getGoldRateBoard() {
    return Promise.resolve(emit(this.getStore().goldRateBoard));
  },

  getAiStudio() {
    return Promise.resolve(emit(db.aiStudio));
  },

  getAiAtelier() {
    return Promise.resolve(emit(db.aiAtelier));
  },

  async generateAiDesign(request = {}) {
    const prompt = String(request.prompt ?? "").trim();
    if (!prompt) {
      return Promise.reject(
        new Error("Describe the jewellery you envision before creating a design.")
      );
    }

    await wait(AI_RENDER_DELAY);
    const design = matchDesign({ ...request, prompt });
    if (!design) {
      return Promise.reject(
        new Error("The atelier could not render this concept. Please try again.")
      );
    }
    return emit(buildConcept(design, prompt, request.purity));
  },

  async createAiVariations(conceptId) {
    await wait(AI_RENDER_DELAY);
    const design = db.aiDesigns.find((item) => item.id === conceptId);
    if (!design) {
      return Promise.reject(new Error("This concept is no longer available in the atelier."));
    }
    return emit({
      id: design.id,
      images: [{ ...design.image }, ...design.variationPlates.map((plate) => ({ ...plate }))],
    });
  },

  async refineAiDesign(request = {}) {
    const feedback = String(request.feedback ?? "").trim();
    if (!feedback) {
      return Promise.reject(new Error("Describe how you would like the design refined."));
    }

    await wait(AI_RENDER_DELAY);
    const design = db.aiDesigns.find((item) => item.id === request.conceptId);
    if (!design) {
      return Promise.reject(new Error("This concept is no longer available in the atelier."));
    }

    /* The mock re-renders the concept from the refinement words: the atelier
       note stays with the design, the plate is re-issued and the customer's
       latest words become the concept's prompt summary. */
    const plate = design.variationPlates[0] ?? design.image;
    return emit({ ...buildConcept(design, feedback, request.purity), images: [{ ...plate }] });
  },

  getTryOnRoom() {
    return Promise.resolve(emit({ ...db.tryOnRoom, samples: db.tryOnSamples }));
  },

  getTryOnSource(source = {}) {
    return Promise.resolve(
      emit(
        resolveTryOnSource(source.sourceType, source.sourceId, this.getStore().products)
      )
    );
  },

  async createTryOn(request = {}) {
    const { sourceType, sourceId } = request;
    const photo = request.photo;

    const source = resolveTryOnSource(sourceType, sourceId, this.getStore().products);
    if (!source) {
      return Promise.reject(
        new Error(
          "This jewellery is no longer available for virtual try-on. Please choose another piece."
        )
      );
    }
    if (!photo?.image?.src) {
      return Promise.reject(
        new Error("Add a photograph before trying the jewellery on.")
      );
    }

    await wait(TRYON_RENDER_DELAY);

    if (Math.random() < TRYON_FAILURE_RATE) {
      return Promise.reject(
        new Error(
          "The fitting room could not prepare your preview just now. Your photo and jewellery are waiting — please try again."
        )
      );
    }

    /* Sample portraits ship a prepared wearing plate; an uploaded photograph
       resolves to itself in the mock — a real backend returns its render. */
    const sample =
      photo.origin === "sample"
        ? db.tryOnSamples.find((item) => item.id === photo.sampleId)
        : null;
    const wearing = sample?.resultImage ?? photo.image;

    return emit({
      id: `TRYON-${sourceId}-${Date.now()}`,
      status: "completed",
      createdAt: new Date().toISOString(),
      source,
      photo: {
        origin: photo.origin,
        sampleId: sample?.id ?? null,
        name: photo.name ?? sample?.name ?? null,
        image: { ...photo.image },
      },
      image: { ...wearing },
    });
  },

  /* --------------------------------------------------------------------------
   * Customer authentication & identity (Phase 11)
   * --------------------------------------------------------------------------
   * The session is the authenticated customer id — held in memory, mirrored
   * to local storage so a refresh keeps the customer signed in. Every
   * account method below hands that id to the canonical store, which
   * re-resolves ownership itself; without a session the store rejects with
   * SESSION_EXPIRED, exactly as an unauthenticated API call would 401.
   * ------------------------------------------------------------------------ */

  /* `undefined` until first read — the stored session hydrates lazily so a
     sign-in during the visit is never overwritten by a stale stored id. */
  _customerSessionId: undefined,

  customerSessionId() {
    if (this._customerSessionId === undefined) {
      this._customerSessionId = readStoredCustomerSession();
    }
    return this._customerSessionId;
  },

  setCustomerSession(customerId) {
    this._customerSessionId = customerId ?? null;
    if (customerId) writeStoredCustomerSession(customerId);
    else clearStoredCustomerSession();
  },

  authenticateCustomer(credentials = {}) {
    const result = gov.authenticateCustomer(this.getStore(), credentials);
    this.setCustomerSession(result.customer.id);
    return Promise.resolve({ authenticated: true, customer: emit(result.customer) });
  },

  registerCustomer(payload = {}) {
    const result = gov.registerCustomer(this.getStore(), payload);
    this.setCustomerSession(result.customer.id);
    return Promise.resolve({ authenticated: true, customer: emit(result.customer) });
  },

  getCurrentCustomer() {
    const customerId = this.customerSessionId();
    if (!customerId) return Promise.resolve({ authenticated: false, customer: null });
    try {
      const record = gov.resolveCustomerScope(this.getStore(), customerId);
      return Promise.resolve({
        authenticated: true,
        customer: gov.toCustomerPublic(record),
      });
    } catch {
      /* A stale stored id (disabled account, fresh seed) is simply no session. */
      this.setCustomerSession(null);
      return Promise.resolve({ authenticated: false, customer: null });
    }
  },

  logoutCustomer() {
    this.setCustomerSession(null);
    return Promise.resolve({ authenticated: false });
  },

  requestCustomerPasswordReset(identifier) {
    return Promise.resolve(
      emit(gov.requestCustomerPasswordReset(this.getStore(), identifier))
    );
  },

  resetCustomerPassword(payload = {}) {
    return Promise.resolve(emit(gov.resetCustomerPassword(this.getStore(), payload)));
  },

  /* --------------------------------------------------------------------------
   * Customer Google OAuth (Phase 13.5)
   * --------------------------------------------------------------------------
   * Backend-ready seam:
   *   UI → useCustomerGoogleAuth → customerAuthService → DataProvider →
   *   Future Backend OAuth Endpoint → Google.
   *
   * In a live deployment, initiateCustomerGoogleOAuth obtains the authorization
   * URL from the backend and completes the exchange upon callback. In this
   * mock-only environment without an active backend server, initiate rejects
   * with BACKEND_UNAVAILABLE honestly rather than faking Google authentication.
   * Tests and verified callback exchanges can invoke completeCustomerGoogleOAuth
   * with verified identity payloads.
   * ------------------------------------------------------------------------ */
  initiateCustomerGoogleOAuth(options = {}) {
    const returnTo = options?.returnTo ?? "/account";
    if (typeof window !== "undefined" && window.__SWARNOVA_MOCK_OAUTH_REDIRECT__) {
      return Promise.resolve({
        redirectUrl: `/auth/callback?mock=true&returnTo=${encodeURIComponent(returnTo)}`,
      });
    }
    const error = new Error(
      "Google sign-in requires the backend identity service scheduled for Phase 14."
    );
    error.code = "BACKEND_UNAVAILABLE";
    return Promise.reject(error);
  },

  completeCustomerGoogleOAuth(payload = {}) {
    if (payload.error === "access_denied" || payload.error === "cancelled") {
      const err = new Error("Google sign-in was cancelled.");
      err.code = "OAUTH_CANCELLED";
      return Promise.reject(err);
    }
    if (payload.error) {
      const err = new Error("Authentication with Google failed.");
      err.code = "OAUTH_FAILED";
      return Promise.reject(err);
    }

    if (payload.customer || payload.email) {
      const result = gov.authenticateOrLinkGoogleCustomer(this.getStore(), payload);
      this.setCustomerSession(result.customer.id);
      return Promise.resolve({
        authenticated: true,
        customer: emit(result.customer),
        isNewAccount: result.isNewAccount,
      });
    }

    const err = new Error("Google authentication requires backend token verification.");
    err.code = "BACKEND_UNAVAILABLE";
    return Promise.reject(err);
  },

  /* --------------------------------------------------------------------------
   * Customer account & commerce (Phase 7 reads, Phase 11 ownership)
   * --------------------------------------------------------------------------
   * Signatures are unchanged — hooks and services call them exactly as
   * before — but every one now resolves the caller from the customer
   * session and reads/writes only that customer's slice of the canonical
   * store. Customer A can no longer reach Customer B by any argument,
   * because there is no identity argument to forge.
   * ------------------------------------------------------------------------ */

  getCustomerProfile() {
    return Promise.resolve(
      gov.getCustomerProfile(this.getStore(), this.customerSessionId())
    );
  },

  updateCustomerProfile(data = {}) {
    return Promise.resolve(
      gov.updateCustomerProfile(this.getStore(), this.customerSessionId(), data)
    );
  },

  getCustomerAddresses() {
    return Promise.resolve(
      gov.listCustomerAddresses(this.getStore(), this.customerSessionId())
    );
  },

  addCustomerAddress(address = {}) {
    return Promise.resolve(
      gov.addCustomerAddress(this.getStore(), this.customerSessionId(), address)
    );
  },

  updateCustomerAddress(address = {}) {
    return Promise.resolve(
      gov.updateCustomerAddress(this.getStore(), this.customerSessionId(), address)
    );
  },

  deleteCustomerAddress(id) {
    return Promise.resolve(
      gov.deleteCustomerAddress(this.getStore(), this.customerSessionId(), id)
    );
  },

  setDefaultCustomerAddress(id) {
    return Promise.resolve(
      gov.setDefaultCustomerAddress(this.getStore(), this.customerSessionId(), id)
    );
  },

  /* The storefront account sees its own slice of the ONE canonical order
     book — the Admin console operates the whole book from the same store. */
  getOrders() {
    return Promise.resolve(
      gov.listCustomerOrders(this.getStore(), this.customerSessionId())
    );
  },

  getOrder(id) {
    return Promise.resolve(
      gov.getCustomerOrder(this.getStore(), this.customerSessionId(), id)
    );
  },

  /* --------------------------------------------------------------------------
   * Customer checkout (Phase 12)
   * --------------------------------------------------------------------------
   * The commerce boundary between the shopping bag and the canonical order
   * book. Every method re-resolves the caller from the customer session
   * store-side; a guest has no summary and no order. The summary is a quote
   * (validated lines, fulfilment branch, ONE totals calculation); placeOrder
   * enforces the full boundary, settles the mock payment and returns
   * `{ order, payment }` from the canonical book — a declined payment or an
   * empty/invalid bag creates nothing.
   * ------------------------------------------------------------------------ */

  async getDeliveryMethods() {
    await wait(CHECKOUT_READ_DELAY);
    return Promise.resolve(emit(db.deliveryMethods));
  },

  async getPaymentMethods() {
    await wait(CHECKOUT_READ_DELAY);
    return Promise.resolve(emit(db.paymentMethods));
  },

  async getCheckoutSummary(items = []) {
    await wait(CHECKOUT_READ_DELAY);
    return gov.getCheckoutSummary(this.getStore(), this.customerSessionId(), items);
  },

  async placeOrder(payload = {}) {
    await wait(CHECKOUT_PLACE_DELAY);
    return gov.placeCheckoutOrder(this.getStore(), this.customerSessionId(), payload);
  },

  /* --------------------------------------------------------------------------
   * Platform governance (Phase 8)
   * --------------------------------------------------------------------------
   * Every method delegates to the shared governance store, which enforces
   * the lifecycle, readiness and usage contracts. A future API provider
   * exposes the same methods over HTTP.
   * ------------------------------------------------------------------------ */

  getPlatformOverview() {
    return Promise.resolve(gov.platformOverview(this.getStore()));
  },

  getGovernanceProducts(query = {}) {
    return Promise.resolve(gov.listGovernanceProducts(this.getStore(), query));
  },

  getGovernanceProduct(id) {
    return Promise.resolve(gov.getGovernanceProduct(this.getStore(), id));
  },

  createGovernanceProduct(data = {}) {
    return Promise.resolve(gov.createGovernanceProduct(this.getStore(), data));
  },

  updateGovernanceProduct(id, data = {}, actor) {
    return Promise.resolve(gov.updateGovernanceProduct(this.getStore(), id, data, actor));
  },

  transitionGovernanceProduct(id, action, payload = {}, actor) {
    return Promise.resolve(
      gov.transitionGovernanceProduct(this.getStore(), id, action, payload, actor)
    );
  },

  getMediaLibrary(query = {}) {
    return Promise.resolve(gov.listGovernanceMedia(this.getStore(), query));
  },

  uploadMediaAsset(file = {}) {
    return Promise.resolve(gov.uploadGovernanceMedia(this.getStore(), file));
  },

  attachMediaToProduct(mediaId, productId, slot = "primary") {
    return Promise.resolve(gov.attachGovernanceMedia(this.getStore(), mediaId, productId, slot));
  },

  deleteMediaAsset(id) {
    return Promise.resolve(gov.deleteGovernanceMedia(this.getStore(), id));
  },

  getGovernanceCategories() {
    return Promise.resolve(emit(this.getStore().categories));
  },

  createGovernanceCategory(data = {}) {
    return Promise.resolve(gov.createGovernanceCategory(this.getStore(), data));
  },

  updateGovernanceCategory(id, data = {}) {
    return Promise.resolve(gov.updateGovernanceCategory(this.getStore(), id, data));
  },

  getGovernanceCollections() {
    return Promise.resolve(emit(this.getStore().collections));
  },

  createGovernanceCollection(data = {}) {
    return Promise.resolve(gov.createGovernanceCollection(this.getStore(), data));
  },

  updateGovernanceCollection(id, data = {}) {
    return Promise.resolve(gov.updateGovernanceCollection(this.getStore(), id, data));
  },

  getGovernanceHomepage() {
    return Promise.resolve(gov.getGovernanceHomepage(this.getStore()));
  },

  updateHomepageSection(id, patch = {}, actor) {
    return Promise.resolve(gov.updateHomepageSection(this.getStore(), id, patch, actor));
  },

  moveHomepageSection(id, direction) {
    return Promise.resolve(gov.moveHomepageSection(this.getStore(), id, direction));
  },

  getGovernanceCampaigns() {
    return Promise.resolve(gov.listGovernanceCampaigns(this.getStore()));
  },

  updateCampaignStatus(id, status, actor) {
    return Promise.resolve(gov.updateCampaignStatus(this.getStore(), id, status, actor));
  },

  getGovernanceBranches() {
    return Promise.resolve(gov.listGovernanceBranches(this.getStore()));
  },

  setBranchStatus(id, status) {
    return Promise.resolve(gov.setBranchStatus(this.getStore(), id, status));
  },

  getGovernanceAdmins() {
    return Promise.resolve(gov.listGovernanceAdmins(this.getStore()));
  },

  createGovernanceAdmin(data = {}, actor) {
    return Promise.resolve(gov.createGovernanceAdmin(this.getStore(), data, actor));
  },

  updateGovernanceAdmin(id, data = {}) {
    return Promise.resolve(gov.updateGovernanceAdmin(this.getStore(), id, data));
  },

  getGovernanceEmployees() {
    return Promise.resolve(gov.listGovernanceEmployees(this.getStore()));
  },

  updateGovernanceEmployee(id, data = {}, actor) {
    return Promise.resolve(gov.updateGovernanceEmployee(this.getStore(), id, data, actor));
  },

  createGovernanceEmployee(data = {}, actor) {
    return Promise.resolve(gov.createEmployee(this.getStore(), data, actor));
  },

  updateGoldRates(rates = []) {
    return Promise.resolve(gov.updateGoldRates(this.getStore(), rates));
  },

  getPlatformSettings() {
    return Promise.resolve(emit(this.getStore().settings));
  },

  updatePlatformSettings(patch = {}) {
    return Promise.resolve(gov.updatePlatformSettings(this.getStore(), patch));
  },

  getAuditLogs(query = {}) {
    return Promise.resolve(gov.listAuditLogs(this.getStore(), query));
  },

  /* --------------------------------------------------------------------------
   * Admin / head office operations (Phase 9)
   * --------------------------------------------------------------------------
   * One staff login for every staff role, then the business-operations
   * surface: the order book, the customer directory, branch inventory,
   * branch coordination, employees, reports and the business overview.
   * Every read/write crosses into the same shared governance store.
   * ------------------------------------------------------------------------ */

  authenticateStaff(credentials = {}) {
    return Promise.resolve(gov.authenticateStaff(this.getStore(), credentials));
  },

  getAdminOverview() {
    return Promise.resolve(gov.adminOverview(this.getStore()));
  },

  getAdminOrders(query = {}) {
    return Promise.resolve(gov.listAdminOrders(this.getStore(), query));
  },

  getAdminOrder(id) {
    return Promise.resolve(gov.getAdminOrder(this.getStore(), id));
  },

  updateAdminOrderStatus(id, status, actor) {
    return Promise.resolve(gov.updateAdminOrderStatus(this.getStore(), id, status, actor));
  },

  getAdminCustomers(query = {}) {
    return Promise.resolve(gov.listAdminCustomers(this.getStore(), query));
  },

  getAdminCustomer(id) {
    return Promise.resolve(gov.getAdminCustomer(this.getStore(), id));
  },

  getAdminInventory(query = {}) {
    return Promise.resolve(gov.listAdminInventory(this.getStore(), query));
  },

  adjustInventoryStock(stockId, adjustment = {}, actor) {
    return Promise.resolve(gov.adjustAdminInventory(this.getStore(), stockId, adjustment, actor));
  },

  getInventoryMovements(query = {}) {
    return Promise.resolve(gov.listInventoryMovements(this.getStore(), query));
  },

  getBranchOperations() {
    return Promise.resolve(gov.listBranchOperations(this.getStore()));
  },

  getAdminReports() {
    return Promise.resolve(gov.adminReports(this.getStore()));
  },

  getCapabilityProfiles() {
    return Promise.resolve(emit(this.getStore().capabilityProfiles));
  },

  /* --------------------------------------------------------------------------
   * Employee / branch operations (Phase 10)
   * --------------------------------------------------------------------------
   * The counter-side contract. Every method receives the session actor
   * (`{ id, role, label }`) and re-resolves the employee's branch and
   * capabilities store-side — a `branchId` that arrives in a query is treated
   * as a request to validate, never as authority. A Super Admin stays global
   * and may name any branch; an Admin works head-office-wide, or its own
   * boutique when the administrator account is branch-scoped.
   *
   *   employeeOverview(actor)
   *   employeeOrders(actor, query)            employeeOrder(actor, id)
   *   employeeOrderStatus(actor, id, status)
   *   employeeCustomers(actor, query)         employeeCustomer(actor, id)
   *   employeeCatalogue(actor, query)         employeeProduct(actor, id)
   *   employeeCategories(actor)
   *   employeeInventory(actor, query)         employeeInventoryMovements(actor, query)
   *   employeeStockAdjustment(actor, stockId, adjustment)
   *   employeeBranchOperations(actor)         employeeReports(actor)
   *   employeeProfile(actor)                  updateEmployeeProfile(actor, patch)
   * ------------------------------------------------------------------------ */

  getEmployeeOverview(actor, query = {}) {
    return Promise.resolve(gov.employeeOverview(this.getStore(), actor, query));
  },

  getEmployeeOrders(actor, query = {}) {
    return Promise.resolve(gov.listEmployeeOrders(this.getStore(), actor, query));
  },

  getEmployeeOrder(actor, id) {
    return Promise.resolve(gov.getEmployeeOrder(this.getStore(), actor, id));
  },

  updateEmployeeOrderStatus(actor, id, status) {
    return Promise.resolve(gov.updateEmployeeOrderStatus(this.getStore(), actor, id, status));
  },

  getEmployeeCustomers(actor, query = {}) {
    return Promise.resolve(gov.listEmployeeCustomers(this.getStore(), actor, query));
  },

  getEmployeeCustomer(actor, id) {
    return Promise.resolve(gov.getEmployeeCustomer(this.getStore(), actor, id));
  },

  getEmployeeCatalogue(actor, query = {}) {
    return Promise.resolve(gov.listEmployeeCatalogue(this.getStore(), actor, query));
  },

  getEmployeeProduct(actor, id) {
    return Promise.resolve(gov.getEmployeeProduct(this.getStore(), actor, id));
  },

  getEmployeeCategories(actor) {
    return Promise.resolve(gov.listEmployeeCategories(this.getStore(), actor));
  },

  getEmployeeInventory(actor, query = {}) {
    return Promise.resolve(gov.listEmployeeInventory(this.getStore(), actor, query));
  },

  adjustEmployeeInventory(actor, stockId, adjustment = {}) {
    return Promise.resolve(
      gov.adjustEmployeeInventory(this.getStore(), actor, stockId, adjustment)
    );
  },

  getEmployeeInventoryMovements(actor, query = {}) {
    return Promise.resolve(
      gov.listEmployeeInventoryMovements(this.getStore(), actor, query)
    );
  },

  getEmployeeBranchOperations(actor, query = {}) {
    return Promise.resolve(gov.employeeBranchOperations(this.getStore(), actor, query));
  },

  getEmployeeReports(actor, query = {}) {
    return Promise.resolve(gov.employeeReports(this.getStore(), actor, query));
  },

  getEmployeeProfile(actor) {
    return Promise.resolve(gov.employeeProfile(this.getStore(), actor));
  },

  updateEmployeeProfile(actor, patch = {}) {
    return Promise.resolve(gov.updateEmployeeProfile(this.getStore(), actor, patch));
  },
};

export default mockProvider;
