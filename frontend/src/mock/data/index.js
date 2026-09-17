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
export { tryOnRoom, tryOnSamples } from "./try-on/index.js";
export { default as journalArticles } from "./journal/index.js";
export { customerProfile, customerAddresses, customers, CUSTOMER_DEMO_PASSWORD } from "./customer/index.js";
export { default as customerOrders } from "./orders/index.js";
export { deliveryMethods, paymentMethods, checkoutScenarios } from "./checkout/index.js";
export { default as mediaLibrary } from "./media/index.js";
export { inventoryStock, inventoryMovements } from "./inventory/index.js";
export { superAdminAccount, capabilityProfiles, STAFF_TEMP_PASSWORD } from "./staff/index.js";
export {
  platformAdmins,
  platformEmployees,
  governanceAuditLog,
  platformSettings,
} from "./governance/index.js";
