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
 */
import * as db from "../../../mock/data/index.js";

/** Return a detached copy so callers can never mutate the mock database. */
function emit(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

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

function resolveTryOnSource(sourceType, sourceId) {
  if (sourceType === "ai-design") {
    const design = db.aiDesigns.find((item) => item.id === sourceId);
    if (!design) return null;
    return { sourceType, sourceId, jewellery: jewelleryFromDesign(design) };
  }
  if (sourceType === "product") {
    const product = db.products.find((item) => item.id === sourceId);
    /* Only genuinely eligible pieces enter the room — an ineligible product
       resolves to null exactly like an unknown one. */
    if (!product || !product.tryOnAvailable) return null;
    return { sourceType, sourceId, jewellery: jewelleryFromProduct(product) };
  }
  return null;
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

  getSite() {
    return Promise.resolve(emit(db.site));
  },

  getHomepage() {
    const homepage = emit(db.homepage);
    homepage.sections = homepage.sections
      .filter((section) => section.enabled !== false)
      .sort(byOrder);
    return Promise.resolve(homepage);
  },

  getCategories() {
    return Promise.resolve(
      emit(db.categories.filter((c) => c.enabled !== false).sort(byOrder))
    );
  },

  getCollections() {
    return Promise.resolve(emit(db.collections));
  },

  getProducts(query = {}) {
    let list = [...db.products];

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
    return Promise.resolve(emit(db.products.find((product) => product.id === id) ?? null));
  },

  getBranches(query = {}) {
    let list = [...db.branches];
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
    return Promise.resolve(emit(db.getActiveCampaign()));
  },

  getGoldRateBoard() {
    return Promise.resolve(emit(db.goldRateBoard));
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
      emit(resolveTryOnSource(source.sourceType, source.sourceId))
    );
  },

  async createTryOn(request = {}) {
    const { sourceType, sourceId } = request;
    const photo = request.photo;

    const source = resolveTryOnSource(sourceType, sourceId);
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
   * Customer account & commerce (Phase 7)
   * ------------------------------------------------------------------------ */
  _profile: null,
  _addresses: null,
  _orders: null,

  getCustomerProfile() {
    if (!this._profile) {
      this._profile = emit(db.customerProfile);
    }
    return Promise.resolve(emit(this._profile));
  },

  updateCustomerProfile(data = {}) {
    if (!this._profile) {
      this._profile = emit(db.customerProfile);
    }
    this._profile = {
      ...this._profile,
      ...data,
      preferences: {
        ...this._profile.preferences,
        ...(data.preferences || {}),
      },
    };
    return Promise.resolve(emit(this._profile));
  },

  getCustomerAddresses() {
    if (!this._addresses) {
      this._addresses = emit(db.customerAddresses);
    }
    return Promise.resolve(emit(this._addresses));
  },

  addCustomerAddress(address = {}) {
    if (!this._addresses) {
      this._addresses = emit(db.customerAddresses);
    }
    const newAddress = {
      ...address,
      id: `ADDR-${Date.now()}`,
      isDefault: Boolean(address.isDefault || this._addresses.length === 0),
    };
    if (newAddress.isDefault) {
      this._addresses = this._addresses.map((a) => ({ ...a, isDefault: false }));
    }
    this._addresses = [newAddress, ...this._addresses];
    return Promise.resolve(emit(newAddress));
  },

  updateCustomerAddress(address = {}) {
    if (!this._addresses) {
      this._addresses = emit(db.customerAddresses);
    }
    if (address.isDefault) {
      this._addresses = this._addresses.map((a) => ({ ...a, isDefault: false }));
    }
    this._addresses = this._addresses.map((a) =>
      a.id === address.id ? { ...a, ...address } : a
    );
    return Promise.resolve(emit(address));
  },

  deleteCustomerAddress(id) {
    if (!this._addresses) {
      this._addresses = emit(db.customerAddresses);
    }
    const target = this._addresses.find((a) => a.id === id);
    this._addresses = this._addresses.filter((a) => a.id !== id);
    if (target?.isDefault && this._addresses.length > 0) {
      this._addresses[0].isDefault = true;
    }
    return Promise.resolve(emit(id));
  },

  setDefaultCustomerAddress(id) {
    if (!this._addresses) {
      this._addresses = emit(db.customerAddresses);
    }
    this._addresses = this._addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    return Promise.resolve(emit(this._addresses));
  },

  getOrders() {
    if (!this._orders) {
      this._orders = emit(db.customerOrders);
    }
    return Promise.resolve(emit(this._orders));
  },

  getOrder(id) {
    if (!this._orders) {
      this._orders = emit(db.customerOrders);
    }
    const order = this._orders.find((o) => o.id === id || o.orderNumber === id);
    return Promise.resolve(emit(order ?? null));
  },
};

export default mockProvider;
