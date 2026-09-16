/**
 * MOCK DATA PROVIDER
 * -----------------------------------------------------------------------------
 * Implements the same provider interface a future API provider will expose.
 * The UI depends only on this interface — replacing this file's methods with
 * `fetch()` calls to the Swarnova backend requires no changes to components.
 *
 * Interface (all methods are async):
 *   getSite()
 *   getHomepage()
 *   getCategories()
 *   getCollections()
 *   getProducts(query)
 *   getBranches(query)
 *   getJournalArticles(query)
 *   getActiveCampaign()
 *   getGoldRateBoard()
 *   getAiStudio()
 */
import * as db from "../mock/data/index.js";

/** Return a detached copy so callers can never mutate the mock database. */
function emit(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function byOrder(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

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

    list.sort((a, b) => {
      if (Number(b.bestseller) !== Number(a.bestseller)) {
        return Number(b.bestseller) - Number(a.bestseller);
      }
      return a.name.localeCompare(b.name);
    });

    if (typeof query.limit === "number") list = list.slice(0, query.limit);
    return Promise.resolve(emit(list));
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
};

export default mockProvider;
