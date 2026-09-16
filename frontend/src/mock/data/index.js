/**
 * MOCK DATA AGGREGATE
 * -----------------------------------------------------------------------------
 * The single import surface for the mock database. Only the mock provider
 * (`services/providers/mock/mockProvider.js`) may import from here — nothing in
 * the presentation layer (components / pages / layouts) ever touches `src/mock`.
 *
 * Every domain lives in its own folder so a domain can grow additional fixture
 * files without disturbing the others.
 */
export { default as site } from "./site/index.js";
export { default as homepage } from "./homepage/index.js";
export { default as categories } from "./categories/index.js";
export { default as collections } from "./collections/index.js";
export { default as products } from "./products/index.js";
export { default as branches } from "./branches/index.js";
export { default as campaigns, getActiveCampaign } from "./campaigns/index.js";
export { default as goldRateBoard } from "./gold-rates/index.js";
export { aiStudio, aiAtelier, aiDesigns } from "./ai/index.js";
export { default as journalArticles } from "./journal/index.js";
